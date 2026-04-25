import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Turno } from './entities/turno.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { HistorialMedico } from '../historial-medico/entities/historial-medico.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import { EstadoPago } from '../../common/enums';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { EstadoTurno } from '../../common/enums';
import { WebhookService } from '../../common/services/webhook.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { ListaEsperaService } from '../lista-espera/lista-espera.service';
import { SupabaseService } from '../../common/services/supabase.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

@Injectable()
export class TurnosService {
  private readonly logger = new Logger(TurnosService.name);

  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(HistorialMedico)
    private readonly historialRepository: Repository<HistorialMedico>,
    @InjectRepository(Tratamiento)
    private readonly tratamientoRepository: Repository<Tratamiento>,
    private readonly webhookService: WebhookService,
    private readonly notificacionesService: NotificacionesService,
    private readonly listaEsperaService: ListaEsperaService,
    private readonly configService: ConfigService,
    private readonly supabaseService: SupabaseService,
  ) {}

  async findAll(
    clinicaId: string,
    filters?: {
      fecha?: string;
      fecha_desde?: string;
      fecha_hasta?: string;
      estado?: EstadoTurno;
      user_id?: string;
    },
  ): Promise<Turno[]> {
    const qb = this.turnoRepository
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.paciente', 'paciente')
      .leftJoinAndSelect('t.user', 'user')
      .where('t.clinica_id = :clinicaId', { clinicaId });

    if (filters?.fecha_desde && filters?.fecha_hasta) {
      const start = new Date(filters.fecha_desde);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.fecha_hasta);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('t.start_time BETWEEN :start AND :end', { start, end });
    } else if (filters?.fecha) {
      const start = new Date(filters.fecha);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.fecha);
      end.setHours(23, 59, 59, 999);
      qb.andWhere('t.start_time BETWEEN :start AND :end', { start, end });
    }

    if (filters?.estado) {
      qb.andWhere('t.estado = :estado', { estado: filters.estado });
    }

    if (filters?.user_id) {
      qb.andWhere('t.user_id = :userId', { userId: filters.user_id });
    }

    qb.select([
      't.id', 't.clinica_id', 't.paciente_id', 't.user_id',
      't.start_time', 't.end_time', 't.estado', 't.source',
      't.tipo_tratamiento', 't.notas', 't.created_at',
      't.fue_reprogramado', 't.es_reprogramacion',
      'paciente.id', 'paciente.nombre', 'paciente.apellido', 'paciente.dni', 'paciente.cel',
      'user.id', 'user.nombre', 'user.apellido', 'user.email',
    ]);

    return qb.orderBy('t.start_time', 'ASC').getMany();
  }

  async findOne(id: string, clinicaId: string): Promise<Turno> {
    const turno = await this.turnoRepository.findOne({
      where: { id, clinica_id: clinicaId },
      relations: ['paciente', 'user'],
    });
    if (!turno) {
      throw new NotFoundException('Turno no encontrado');
    }
    return turno;
  }

  async create(
    clinicaId: string,
    createTurnoDto: CreateTurnoDto,
  ): Promise<Turno> {
    const startTime = new Date(createTurnoDto.start_time);
    const endTime = new Date(createTurnoDto.end_time);

    if (endTime <= startTime) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio',
      );
    }

    await this.checkOverlap(
      clinicaId,
      createTurnoDto.user_id,
      startTime,
      endTime,
    );

    const turno = this.turnoRepository.create({
      paciente_id: createTurnoDto.paciente_id,
      user_id: createTurnoDto.user_id,
      clinica_id: clinicaId,
      start_time: startTime,
      end_time: endTime,
      estado: EstadoTurno.PENDIENTE,
      source: createTurnoDto.source,
      tipo_tratamiento: createTurnoDto.tipo_tratamiento,
      notas: createTurnoDto.notas,
      es_reprogramacion: createTurnoDto.es_reprogramacion || false,
    });

    const saved = await this.turnoRepository.save(turno);

    // Auto-generar pago pendiente si el tratamiento tiene precio
    if (createTurnoDto.tipo_tratamiento) {
      try {
        const tratamiento = await this.tratamientoRepository.findOne({
          where: {
            nombre: createTurnoDto.tipo_tratamiento,
            clinica_id: clinicaId,
            activo: true,
          },
        });
        if (tratamiento?.precio_base && Number(tratamiento.precio_base) > 0) {
          const pagoExistente = await this.pagoRepository.findOne({
            where: { turno_id: saved.id },
          });
          if (!pagoExistente) {
            const pago = this.pagoRepository.create({
              turno_id: saved.id,
              total: tratamiento.precio_base,
              estado: EstadoPago.PENDIENTE,
            });
            await this.pagoRepository.save(pago);
          }
        }
      } catch (err) {
        this.logger.warn(`No se pudo auto-generar pago para turno ${saved.id}: ${err.message}`);
      }
    }

    const full = await this.findOne(saved.id, clinicaId);
    this.fireWebhook(clinicaId, 'pendiente', full);
    return full;
  }

  async update(
    id: string,
    clinicaId: string,
    updateTurnoDto: UpdateTurnoDto,
  ): Promise<Turno> {
    const turno = await this.findOne(id, clinicaId);

    if (
      turno.estado === EstadoTurno.CANCELADO ||
      turno.estado === EstadoTurno.COMPLETADO
    ) {
      throw new BadRequestException(
        'No se puede modificar un turno cancelado o completado',
      );
    }

    const startTime = updateTurnoDto.start_time
      ? new Date(updateTurnoDto.start_time)
      : turno.start_time;
    const endTime = updateTurnoDto.end_time
      ? new Date(updateTurnoDto.end_time)
      : turno.end_time;
    const userId = updateTurnoDto.user_id || turno.user_id;

    if (endTime <= startTime) {
      throw new BadRequestException(
        'La hora de fin debe ser posterior a la hora de inicio',
      );
    }

    if (
      updateTurnoDto.start_time ||
      updateTurnoDto.end_time ||
      updateTurnoDto.user_id
    ) {
      await this.checkOverlap(clinicaId, userId, startTime, endTime, id);
    }

    const estadoAnterior = turno.estado;
    Object.assign(turno, updateTurnoDto);
    if (updateTurnoDto.start_time) turno.start_time = startTime;
    if (updateTurnoDto.end_time) turno.end_time = endTime;

    await this.turnoRepository.save(turno);
    const full = await this.findOne(id, clinicaId);

    // Disparar webhook y notificación si el estado cambió
    if (updateTurnoDto.estado && updateTurnoDto.estado !== estadoAnterior) {
      this.fireWebhook(clinicaId, updateTurnoDto.estado, full);
      const pacNombre = `${full.paciente?.nombre || ''} ${full.paciente?.apellido || ''}`.trim();
      this.notificacionesService.notificarCambioEstadoTurno(
        clinicaId,
        updateTurnoDto.estado as EstadoTurno,
        pacNombre,
        full.id,
        full.user_id,
      ).catch(() => {});

      // Al cancelar, notificar al primero de la lista de espera
      if (updateTurnoDto.estado === EstadoTurno.CANCELADO) {
        const profNombre = full.user
          ? `${full.user.nombre} ${full.user.apellido}`
          : '';
        this.listaEsperaService.notificarSlotLibre(
          clinicaId,
          full.user_id,
          { fecha: full.start_time.toISOString(), profesionalNombre: profNombre },
        ).catch(() => {});
      }
    }

    return full;
  }

  async reprogramar(
    id: string,
    clinicaId: string,
  ): Promise<void> {
    const turno = await this.findOne(id, clinicaId);

    if (turno.estado !== EstadoTurno.PERDIDO) {
      throw new BadRequestException(
        'Solo se pueden reprogramar turnos con estado perdido',
      );
    }

    turno.fue_reprogramado = true;
    await this.turnoRepository.save(turno);
  }

  async getPagosCount(id: string, clinicaId: string): Promise<{ count: number; total: number }> {
    await this.findOne(id, clinicaId);
    const result = await this.pagoRepository
      .createQueryBuilder('p')
      .where('p.turno_id = :id', { id })
      .select('COUNT(p.id)', 'count')
      .addSelect('COALESCE(SUM(p.total), 0)', 'total')
      .getRawOne();
    return {
      count: parseInt(result.count),
      total: parseFloat(result.total),
    };
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const turno = await this.findOne(id, clinicaId);
    await this.historialRepository.delete({ turno_id: id });
    await this.pagoRepository.delete({ turno_id: id });
    await this.turnoRepository.remove(turno);
  }

  async countToday(clinicaId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.turnoRepository.count({
      where: {
        clinica_id: clinicaId,
        start_time: Between(today, tomorrow),
      },
    });
  }

  /**
   * Cron: cada 10 minutos marca como "perdido" los turnos confirmados
   * cuyo start_time haya pasado hace más de 1 hora.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async marcarTurnosPerdidos(): Promise<void> {
    const unaHoraAtras = new Date();
    unaHoraAtras.setHours(unaHoraAtras.getHours() - 1);

    const result = await this.turnoRepository
      .createQueryBuilder()
      .update(Turno)
      .set({ estado: EstadoTurno.PERDIDO })
      .where('estado = :estado', { estado: EstadoTurno.CONFIRMADO })
      .andWhere('start_time <= :limite', { limite: unaHoraAtras })
      .execute();

    if (result.affected && result.affected > 0) {
      this.logger.log(
        `Marcados ${result.affected} turno(s) como perdido(s)`,
      );
    }
  }

  /**
   * Cron: cada 10 minutos revisa turnos confirmados que necesitan recordatorio.
   * Busca turnos donde: start_time - recordatorio_horas_antes <= ahora
   * y recordatorio_enviado = false.
   * Agrupa por clínica para respetar la config de cada una.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async enviarRecordatorios(): Promise<void> {
    try {
      // Obtener todas las clínicas con recordatorio configurado
      // Para cada una, buscar turnos confirmados pendientes de recordatorio
      const turnosPendientes = await this.turnoRepository
        .createQueryBuilder('t')
        .leftJoinAndSelect('t.paciente', 'paciente')
        .leftJoinAndSelect('t.user', 'user')
        .leftJoinAndSelect('t.clinica', 'clinica')
        .where('t.estado = :estado', { estado: EstadoTurno.CONFIRMADO })
        .andWhere('t.recordatorio_enviado = false')
        .andWhere('t.start_time > NOW()')
        .andWhere('clinica.recordatorio_horas_antes IS NOT NULL')
        .andWhere(
          "t.start_time <= NOW() + (clinica.recordatorio_horas_antes || ' hours')::interval",
        )
        .getMany();

      if (turnosPendientes.length === 0) return;

      this.logger.log(
        `Enviando recordatorios para ${turnosPendientes.length} turno(s)`,
      );

      for (const turno of turnosPendientes) {
        const enviado = await this.webhookService.dispararRecordatorio(
          turno.clinica_id,
          {
            horario: {
              start_time: turno.start_time?.toISOString(),
              end_time: turno.end_time?.toISOString(),
            },
            paciente: {
              nombre: turno.paciente?.nombre || '',
              apellido: turno.paciente?.apellido || '',
              cel: turno.paciente?.cel || null,
              dni: turno.paciente?.dni || '',
            },
            tratamiento: turno.tipo_tratamiento || null,
            estado_turno: 'confirmado',
            estado_pago: 'pendiente',
            profesional: {
              nombre: turno.user?.nombre || '',
              apellido: turno.user?.apellido || '',
              email: turno.user?.email || '',
            },
            clinica: turno.clinica?.nombre || '',
            recordatorio_horas_antes: turno.clinica?.recordatorio_horas_antes ?? null,
            tipo: 'recordatorio',
          },
        );

        if (enviado) {
          await this.turnoRepository.update(turno.id, {
            recordatorio_enviado: true,
          });
        }
      }

      this.logger.log(
        `Recordatorios procesados: ${turnosPendientes.length}`,
      );
    } catch (err) {
      this.logger.error(`Error en cron de recordatorios: ${err.message}`);
    }
  }

  /**
   * Cron: cada 10 minutos envía encuesta NPS a turnos completados hace >2h
   * que aún no recibieron la encuesta.
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async enviarEncuestasNps(): Promise<void> {
    try {
      const dosHorasAtras = new Date();
      dosHorasAtras.setHours(dosHorasAtras.getHours() - 2);

      const turnos = await this.turnoRepository.find({
        where: {
          estado: EstadoTurno.COMPLETADO,
          encuesta_enviada: false,
          end_time: LessThanOrEqual(dosHorasAtras),
        },
        relations: ['paciente', 'user'],
      });

      if (turnos.length === 0) return;

      const backendUrl = this.configService.get<string>('BACKEND_URL') || '';

      for (const turno of turnos) {
        const callbackUrl = `${backendUrl}/turnos/${turno.id}/nps`;
        const enviado = await this.webhookService.dispararNpsEncuesta(turno.clinica_id, {
          turno_id: turno.id,
          paciente: {
            nombre: turno.paciente?.nombre || '',
            apellido: turno.paciente?.apellido || '',
            cel: turno.paciente?.cel || null,
          },
          profesional: {
            nombre: turno.user?.nombre || '',
            apellido: turno.user?.apellido || '',
          },
          fecha_turno: turno.end_time.toISOString(),
          callback_url: callbackUrl,
        });

        if (enviado) {
          await this.turnoRepository.update(turno.id, { encuesta_enviada: true });
        }
      }

      this.logger.log(`Encuestas NPS procesadas: ${turnos.length}`);
    } catch (err) {
      this.logger.error(`Error en cron NPS: ${err.message}`);
    }
  }

  async registrarNps(turnoId: string, score: number): Promise<{ ok: boolean }> {
    const turno = await this.turnoRepository.findOne({ where: { id: turnoId } });
    if (!turno) throw new NotFoundException('Turno no encontrado');
    await this.turnoRepository.update(turnoId, { nps_score: score });
    return { ok: true };
  }

  private async checkOverlap(
    clinicaId: string,
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.turnoRepository
      .createQueryBuilder('t')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('t.user_id = :userId', { userId })
      .andWhere('t.estado NOT IN (:...excludedEstados)', {
        excludedEstados: [EstadoTurno.CANCELADO, EstadoTurno.PERDIDO],
      })
      .andWhere('t.start_time < :endTime', { endTime })
      .andWhere('t.end_time > :startTime', { startTime });

    if (excludeId) {
      qb.andWhere('t.id != :excludeId', { excludeId });
    }

    const overlap = await qb.getOne();

    if (overlap) {
      throw new ConflictException(
        'El profesional ya tiene un turno en ese horario',
      );
    }
  }

  async generarConsentimiento(
    turnoId: string,
    clinicaId: string,
  ): Promise<{ url: string; storage_path: string }> {
    const turno = await this.turnoRepository.findOne({
      where: { id: turnoId, clinica_id: clinicaId },
      relations: ['paciente', 'user', 'clinica'],
    });
    if (!turno) throw new NotFoundException('Turno no encontrado');

    const pdfBuffer = await this.buildConsentimientoPdf(turno);

    const supabase = this.supabaseService.getClient();
    const storagePath = `${clinicaId}/${turnoId}/consentimiento.pdf`;

    const { error } = await supabase.storage
      .from('consentimientos')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw new BadRequestException(`Error al subir PDF: ${error.message}`);
    }

    const EXPIRY = 60 * 60 * 24 * 7; // 7 días
    const { data: signedData, error: signedError } = await supabase.storage
      .from('consentimientos')
      .createSignedUrl(storagePath, EXPIRY);

    if (signedError) {
      throw new BadRequestException(`Error al generar URL: ${signedError.message}`);
    }

    await this.turnoRepository.update(
      { id: turnoId, clinica_id: clinicaId },
      { consentimiento_enviado: true, consentimiento_url: signedData.signedUrl },
    );

    this.webhookService.dispararWebhook(clinicaId, 'consentimiento_enviado', {
      turno_id: turnoId,
      horario: {
        start_time: turno.start_time?.toISOString(),
        end_time: turno.end_time?.toISOString(),
      },
      paciente: {
        nombre: turno.paciente?.nombre || '',
        apellido: turno.paciente?.apellido || '',
        cel: turno.paciente?.cel || null,
        dni: turno.paciente?.dni || '',
      },
      tratamiento: turno.tipo_tratamiento || null,
      estado_turno: turno.estado,
      estado_pago: 'pendiente',
      profesional: {
        nombre: turno.user?.nombre || '',
        apellido: turno.user?.apellido || '',
        email: turno.user?.email || '',
      },
      clinica: turno.clinica?.nombre || '',
      recordatorio_horas_antes: null,
      consentimiento_url: signedData.signedUrl,
    });

    return { url: signedData.signedUrl, storage_path: storagePath };
  }

  async aceptarConsentimiento(turnoId: string): Promise<{ ok: boolean }> {
    const turno = await this.turnoRepository.findOne({ where: { id: turnoId } });
    if (!turno) throw new NotFoundException('Turno no encontrado');

    await this.turnoRepository.update(
      { id: turnoId },
      { consentimiento_aceptado: true, consentimiento_aceptado_at: new Date() },
    );

    return { ok: true };
  }

  private buildConsentimientoPdf(turno: Turno): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const clinicaNombre = turno.clinica?.nombre || 'Clínica';
      const paciente = turno.paciente;
      const profesional = turno.user;
      const fecha = new Date(turno.start_time).toLocaleDateString('es-AR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
      const tratamiento = turno.tipo_tratamiento || 'Tratamiento médico';

      doc.fontSize(18).font('Helvetica-Bold').text(clinicaNombre, { align: 'center' });
      doc.fontSize(13).font('Helvetica').text('CONSENTIMIENTO INFORMADO', { align: 'center' });
      doc.moveDown(1.5);

      doc.fontSize(11).font('Helvetica-Bold').text('Datos del paciente:');
      doc.font('Helvetica').text(`Nombre: ${paciente?.nombre || ''} ${paciente?.apellido || ''}`);
      doc.text(`DNI: ${paciente?.dni || 'No registrado'}`);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('Datos del turno:');
      doc.font('Helvetica').text(`Fecha: ${fecha}`);
      doc.text(`Tratamiento: ${tratamiento}`);
      if (profesional) {
        doc.text(`Profesional: ${profesional.nombre} ${profesional.apellido}`);
      }
      doc.moveDown(1.5);

      doc.font('Helvetica-Bold').text('Declaración de consentimiento:');
      doc.moveDown(0.5);
      doc.font('Helvetica').fontSize(10).text(
        `Yo, ${paciente?.nombre || ''} ${paciente?.apellido || ''}, DNI ${paciente?.dni || ''}, en pleno uso de mis facultades mentales, declaro que he sido informado/a por el profesional tratante sobre el procedimiento de ${tratamiento}, sus beneficios, riesgos posibles, alternativas disponibles y el pronóstico esperado.\n\nEntiendo que tengo el derecho de revocar este consentimiento en cualquier momento antes de la realización del procedimiento, sin que ello conlleve perjuicio alguno en mi atención médica.\n\nPor la presente, autorizo al equipo de ${clinicaNombre} a realizar el procedimiento mencionado y los procedimientos complementarios que fueran necesarios según el criterio del profesional tratante.`,
        { align: 'justify', lineGap: 4 }
      );
      doc.moveDown(2);

      doc.fontSize(11).font('Helvetica-Bold').text(
        'Para confirmar su aceptación, responda este mensaje con la palabra: ACEPTO',
        { align: 'center' }
      );
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#666666').text(
        `Documento generado el ${new Date().toLocaleDateString('es-AR')} · Turno ID: ${turno.id}`,
        { align: 'center' }
      );

      doc.end();
    });
  }

  private fireWebhook(clinicaId: string, estado: string, turno: Turno): void {
    const pagosTotal = turno.pagos?.reduce((s, p) => s + Number(p.total || 0), 0) || 0;
    const tienePagos = pagosTotal > 0;
    this.webhookService.dispararWebhook(clinicaId, estado, {
      horario: {
        start_time: turno.start_time?.toISOString(),
        end_time: turno.end_time?.toISOString(),
      },
      paciente: {
        nombre: turno.paciente?.nombre || '',
        apellido: turno.paciente?.apellido || '',
        cel: turno.paciente?.cel || null,
        dni: turno.paciente?.dni || '',
      },
      tratamiento: turno.tipo_tratamiento || null,
      estado_turno: estado,
      estado_pago: tienePagos ? 'pagado' : 'pendiente',
      profesional: {
        nombre: turno.user?.nombre || '',
        apellido: turno.user?.apellido || '',
        email: turno.user?.email || '',
      },
      clinica: '',
      recordatorio_horas_antes: null,
    });
  }
}
