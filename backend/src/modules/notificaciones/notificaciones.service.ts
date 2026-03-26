import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notificacion } from './entities/notificacion.entity';
import { TipoNotificacion } from '../../common/enums';
import { Inventario } from '../inventario/entities/inventario.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { EstadoTurno } from '../../common/enums';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    @InjectRepository(Notificacion)
    private readonly notificacionRepository: Repository<Notificacion>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  async findAll(clinicaId: string): Promise<Notificacion[]> {
    return this.notificacionRepository.find({
      where: { clinica_id: clinicaId },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async findUnread(clinicaId: string): Promise<Notificacion[]> {
    return this.notificacionRepository.find({
      where: { clinica_id: clinicaId, leida: false },
      order: { created_at: 'DESC' },
      take: 50,
    });
  }

  async countUnread(clinicaId: string): Promise<number> {
    return this.notificacionRepository.count({
      where: { clinica_id: clinicaId, leida: false },
    });
  }

  async markAsRead(id: string, clinicaId: string): Promise<void> {
    await this.notificacionRepository.update(
      { id, clinica_id: clinicaId },
      { leida: true },
    );
  }

  async markAllAsRead(clinicaId: string): Promise<void> {
    await this.notificacionRepository.update(
      { clinica_id: clinicaId, leida: false },
      { leida: true },
    );
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    await this.notificacionRepository.delete({ id, clinica_id: clinicaId });
  }

  async crear(
    clinicaId: string,
    tipo: TipoNotificacion,
    titulo: string,
    mensaje: string,
    metadata?: Record<string, unknown>,
    userId?: string,
  ): Promise<Notificacion> {
    const notif = this.notificacionRepository.create({
      clinica_id: clinicaId,
      tipo,
      titulo,
      mensaje,
      metadata: metadata || null,
      user_id: userId || null,
    });
    return this.notificacionRepository.save(notif);
  }

  /**
   * Cron: cada 30 minutos revisa stock bajo y genera notificaciones
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async verificarStockBajo(): Promise<void> {
    try {
      const itemsBajos = await this.inventarioRepository
        .createQueryBuilder('i')
        .where('i.cantidad <= i.stock_min')
        .andWhere('i.stock_min IS NOT NULL')
        .andWhere('i.cantidad IS NOT NULL')
        .getMany();

      for (const item of itemsBajos) {
        const yaExiste = await this.notificacionRepository
          .createQueryBuilder('n')
          .where('n.clinica_id = :clinicaId', { clinicaId: item.clinica_id })
          .andWhere('n.tipo = :tipo', { tipo: TipoNotificacion.STOCK_BAJO })
          .andWhere('n.leida = false')
          .andWhere("n.metadata->>'item_id' = :itemId", { itemId: item.id })
          .getOne();

        if (!yaExiste) {
          await this.crear(
            item.clinica_id,
            TipoNotificacion.STOCK_BAJO,
            'Stock bajo',
            `"${item.nombre}" tiene ${item.cantidad} unidades (mínimo: ${item.stock_min})`,
            { item_id: item.id, cantidad: item.cantidad, stock_min: item.stock_min },
          );
        }
      }

      if (itemsBajos.length > 0) {
        this.logger.log(`Stock bajo detectado: ${itemsBajos.length} ítem(s)`);
      }
    } catch (err) {
      this.logger.error(`Error en cron stock bajo: ${err.message}`);
    }
  }

  /**
   * Cron: cada 30 minutos genera notificaciones de turnos próximos (1 hora)
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async verificarTurnosProximos(): Promise<void> {
    try {
      const ahora = new Date();
      const enUnaHora = new Date(ahora.getTime() + 60 * 60 * 1000);

      const turnosProximos = await this.turnoRepository
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.paciente', 'paciente')
        .leftJoinAndSelect('t.user', 'user')
        .where('t.estado = :estado', { estado: EstadoTurno.CONFIRMADO })
        .andWhere('t.start_time > :ahora', { ahora })
        .andWhere('t.start_time <= :enUnaHora', { enUnaHora })
        .getMany();

      for (const turno of turnosProximos) {
        const yaExiste = await this.notificacionRepository
          .createQueryBuilder('n')
          .where('n.clinica_id = :clinicaId', { clinicaId: turno.clinica_id })
          .andWhere('n.tipo = :tipo', { tipo: TipoNotificacion.TURNO_PROXIMO })
          .andWhere("n.metadata->>'turno_id' = :turnoId", { turnoId: turno.id })
          .getOne();

        if (!yaExiste) {
          const hora = turno.start_time.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          });
          await this.crear(
            turno.clinica_id,
            TipoNotificacion.TURNO_PROXIMO,
            'Turno próximo',
            `${turno.paciente?.nombre} ${turno.paciente?.apellido} a las ${hora} con ${turno.user?.nombre} ${turno.user?.apellido}`,
            { turno_id: turno.id },
            turno.user_id,
          );
        }
      }
    } catch (err) {
      this.logger.error(`Error en cron turnos próximos: ${err.message}`);
    }
  }

  /**
   * Llamado desde otros services cuando ocurren eventos
   */
  async notificarCambioEstadoTurno(
    clinicaId: string,
    estado: EstadoTurno,
    pacienteNombre: string,
    turnoId: string,
    userId?: string,
  ): Promise<void> {
    const tipos: Record<string, { tipo: TipoNotificacion; titulo: string }> = {
      [EstadoTurno.CONFIRMADO]: {
        tipo: TipoNotificacion.TURNO_CONFIRMADO,
        titulo: 'Turno confirmado',
      },
      [EstadoTurno.CANCELADO]: {
        tipo: TipoNotificacion.TURNO_CANCELADO,
        titulo: 'Turno cancelado',
      },
      [EstadoTurno.PERDIDO]: {
        tipo: TipoNotificacion.TURNO_PERDIDO,
        titulo: 'Turno perdido',
      },
    };

    const config = tipos[estado];
    if (!config) return;

    await this.crear(
      clinicaId,
      config.tipo,
      config.titulo,
      `${pacienteNombre} — turno marcado como ${estado}`,
      { turno_id: turnoId },
      userId,
    );
  }
}
