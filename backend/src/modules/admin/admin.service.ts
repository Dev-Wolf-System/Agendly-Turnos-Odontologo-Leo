import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, DataSource } from 'typeorm';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { EstadoSubscription } from '../../common/enums';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(Clinica)
    private readonly clinicaRepo: Repository<Clinica>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,
    private readonly dataSource: DataSource,
  ) {}

  // ─── Clínicas ────────────────────────────────────────

  async findAllClinicas(filters?: {
    is_active?: string;
    plan_id?: string;
    search?: string;
    estado_aprobacion?: string;
  }) {
    const qb = this.clinicaRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.subscriptions', 's')
      .leftJoinAndSelect('s.plan', 'p')
      .orderBy('c.created_at', 'DESC');

    if (filters?.is_active !== undefined) {
      qb.andWhere('c.is_active = :isActive', {
        isActive: filters.is_active === 'true',
      });
    }

    if (filters?.plan_id) {
      qb.andWhere('s.plan_id = :planId', { planId: filters.plan_id });
    }

    if (filters?.search) {
      qb.andWhere('(c.nombre ILIKE :search OR c.email ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    if (filters?.estado_aprobacion) {
      qb.andWhere('c.estado_aprobacion = :estadoAprobacion', {
        estadoAprobacion: filters.estado_aprobacion,
      });
    }

    const clinicas = await qb.getMany();

    // Agregar conteos por clínica
    const result = await Promise.all(
      clinicas.map(async (clinica) => {
        const [usersCount, pacientesCount, turnosCount] = await Promise.all([
          this.userRepo.count({ where: { clinica_id: clinica.id } }),
          this.pacienteRepo.count({ where: { clinica_id: clinica.id } }),
          this.turnoRepo.count({ where: { clinica_id: clinica.id } }),
        ]);

        return {
          ...clinica,
          _stats: {
            usuarios: usersCount,
            pacientes: pacientesCount,
            turnos: turnosCount,
          },
        };
      }),
    );

    return result;
  }

  async findClinicaById(id: string) {
    const clinica = await this.clinicaRepo.findOne({
      where: { id },
      relations: ['subscriptions', 'subscriptions.plan', 'users'],
    });

    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const [pacientesCount, turnosCount] = await Promise.all([
      this.pacienteRepo.count({ where: { clinica_id: id } }),
      this.turnoRepo.count({ where: { clinica_id: id } }),
    ]);

    // Obtener suscripción activa con plan
    const subscriptionActiva = await this.subscriptionRepo.findOne({
      where: { clinica_id: id },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    return {
      ...clinica,
      subscription: subscriptionActiva,
      _stats: {
        usuarios: clinica.users?.length ?? 0,
        pacientes: pacientesCount,
        turnos: turnosCount,
      },
    };
  }

  async updateClinica(id: string, data: Partial<Clinica>) {
    const clinica = await this.clinicaRepo.findOne({ where: { id } });
    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }
    Object.assign(clinica, data);
    return this.clinicaRepo.save(clinica);
  }

  async aprobarClinica(id: string) {
    const clinica = await this.clinicaRepo.findOne({ where: { id } });
    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }
    clinica.estado_aprobacion = 'Aprobado';
    return this.clinicaRepo.save(clinica);
  }

  async rechazarClinica(id: string) {
    const clinica = await this.clinicaRepo.findOne({ where: { id } });
    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }
    clinica.estado_aprobacion = 'Rechazado';
    clinica.is_active = false;
    return this.clinicaRepo.save(clinica);
  }

  async deleteClinica(id: string) {
    const clinica = await this.clinicaRepo.findOne({ where: { id } });
    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      // 1. Desvincular pagos de los turnos (SET NULL) para preservarlos
      await qr.query(
        `UPDATE pagos SET turno_id = NULL WHERE turno_id IN (SELECT id FROM turnos WHERE clinica_id = $1)`,
        [id],
      );

      // 2. Eliminar entidades hoja (sin dependencias propias)
      await qr.query(`DELETE FROM historial_medico WHERE turno_id IN (SELECT id FROM turnos WHERE clinica_id = $1)`, [id]);
      await qr.query(`DELETE FROM historial_medico WHERE paciente_id IN (SELECT id FROM pacientes WHERE clinica_id = $1)`, [id]);
      await qr.query(`DELETE FROM archivos_medicos WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM notificaciones WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM chat_messages WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM tickets WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM horarios_profesional WHERE clinica_id = $1`, [id]);

      // 3. Eliminar entidades intermedias
      await qr.query(`DELETE FROM turnos WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM pacientes WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM inventario WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM proveedor WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM tratamientos WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM categorias WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM sucursales WHERE clinica_padre_id = $1`, [id]);

      // 4. Eliminar usuarios y suscripciones
      await qr.query(`DELETE FROM users WHERE clinica_id = $1`, [id]);
      await qr.query(`DELETE FROM subscriptions WHERE clinica_id = $1`, [id]);

      // 5. Eliminar la clínica
      await qr.query(`DELETE FROM clinicas WHERE id = $1`, [id]);

      await qr.commitTransaction();
      return { deleted: true, clinica: clinica.nombre };
    } catch (error) {
      await qr.rollbackTransaction();
      this.logger.error(`deleteClinica(${id}) falló: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    } finally {
      await qr.release();
    }
  }

  // ─── Dashboard KPIs ─────────────────────────────────

  async getDashboardKPIs() {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMes = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // En 7 días
    const en7Dias = new Date(now);
    en7Dias.setDate(en7Dias.getDate() + 7);

    const [
      totalClinicas,
      clinicasActivas,
      clinicasInactivas,
      nuevasEsteMes,
      totalSubscriptions,
      subscripcionesActivas,
      subscripcionesTrial,
      trialsPorVencer,
      planes,
    ] = await Promise.all([
      this.clinicaRepo.count(),
      this.clinicaRepo.count({ where: { is_active: true, estado_aprobacion: 'Aprobado' } }),
      this.clinicaRepo.count({ where: { is_active: false } }),
      this.clinicaRepo
        .createQueryBuilder('c')
        .where('c.created_at >= :inicio', { inicio: inicioMes })
        .andWhere('c.created_at <= :fin', { fin: finMes })
        .getCount(),
      this.subscriptionRepo.count(),
      this.subscriptionRepo.count({
        where: { estado: EstadoSubscription.ACTIVA },
      }),
      // Trials = suscripciones activas con trial_ends_at futuro
      this.subscriptionRepo
        .createQueryBuilder('s')
        .where('s.estado = :estado', { estado: EstadoSubscription.ACTIVA })
        .andWhere('s.trial_ends_at IS NOT NULL')
        .andWhere('s.trial_ends_at >= :hoy', { hoy: now })
        .getCount(),
      // Trials por vencer en 7 días
      this.subscriptionRepo
        .createQueryBuilder('s')
        .where('s.estado = :estado', { estado: EstadoSubscription.ACTIVA })
        .andWhere('s.trial_ends_at IS NOT NULL')
        .andWhere('s.trial_ends_at <= :fecha', { fecha: en7Dias })
        .andWhere('s.trial_ends_at >= :hoy', { hoy: now })
        .getCount(),
      this.planRepo.find({ where: { is_active: true } }),
    ]);

    // Clínicas por plan
    const clinicasPorPlan = await this.subscriptionRepo
      .createQueryBuilder('s')
      .select('s.plan_id', 'plan_id')
      .addSelect('p.nombre', 'plan_nombre')
      .addSelect('COUNT(s.id)', 'cantidad')
      .innerJoin('s.plan', 'p')
      .where('s.estado = :estado', {
        estado: EstadoSubscription.ACTIVA,
      })
      .groupBy('s.plan_id')
      .addGroupBy('p.nombre')
      .getRawMany();

    // MRR (Monthly Recurring Revenue)
    const mrrResult = await this.subscriptionRepo
      .createQueryBuilder('s')
      .select('SUM(p.precio_mensual)', 'mrr')
      .innerJoin('s.plan', 'p')
      .where('s.estado = :estado', { estado: EstadoSubscription.ACTIVA })
      .getRawOne();

    return {
      clinicas: {
        total: totalClinicas,
        activas: clinicasActivas,
        inactivas: clinicasInactivas,
        nuevas_este_mes: nuevasEsteMes,
      },
      subscripciones: {
        total: totalSubscriptions,
        activas: subscripcionesActivas,
        trial: subscripcionesTrial,
        trials_por_vencer: trialsPorVencer,
      },
      mrr: Number(mrrResult?.mrr ?? 0) || 0,
      clinicas_por_plan: clinicasPorPlan,
      planes,
    };
  }

  // ─── Dashboard trends (últimos 6 meses) ─────────────────

  async getDashboardTrends() {
    const months: Array<{ label: string; inicio: Date; fin: Date }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
      const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const label = d.toLocaleDateString('es-AR', { month: 'short' });
      months.push({ label, inicio, fin });
    }

    const [clinicasTrend, mrrTrend] = await Promise.all([
      // Nuevas clínicas por mes
      Promise.all(
        months.map(({ inicio, fin }) =>
          this.clinicaRepo.count({
            where: { created_at: Between(inicio, fin) },
          }),
        ),
      ),
      // MRR acumulado por mes (suscripciones activas creadas hasta fin del mes)
      Promise.all(
        months.map(({ fin }) =>
          this.subscriptionRepo
            .createQueryBuilder('s')
            .select('COALESCE(SUM(p.precio_mensual), 0)', 'mrr')
            .innerJoin('s.plan', 'p')
            .where('s.estado = :estado', { estado: EstadoSubscription.ACTIVA })
            .andWhere('s.created_at <= :fin', { fin })
            .getRawOne()
            .then((r) => Number(r?.mrr ?? 0)),
        ),
      ),
    ]);

    return months.map((m, i) => ({
      mes: m.label,
      nuevas_clinicas: clinicasTrend[i],
      mrr: mrrTrend[i],
    }));
  }
}
