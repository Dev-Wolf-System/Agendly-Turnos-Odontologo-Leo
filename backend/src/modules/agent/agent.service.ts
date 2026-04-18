import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, MoreThanOrEqual, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { User } from '../users/entities/user.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { HorarioProfesional } from '../horarios-profesional/entities/horario-profesional.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { EstadoTurno, EstadoPago, SourceTurno, UserRole } from '../../common/enums';
import { WebhookService } from '../../common/services/webhook.service';
import { ClinicaMpService } from '../clinica-mp/clinica-mp.service';

@Injectable()
export class AgentService {
  private readonly logger = new Logger(AgentService.name);

  constructor(
    @InjectRepository(Clinica)
    private readonly clinicaRepo: Repository<Clinica>,
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tratamiento)
    private readonly tratamientoRepo: Repository<Tratamiento>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(HorarioProfesional)
    private readonly horarioProfesionalRepo: Repository<HorarioProfesional>,
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
    @InjectRepository(Inventario)
    private readonly inventarioRepo: Repository<Inventario>,
    private readonly webhookService: WebhookService,
    private readonly config: ConfigService,
    private readonly clinicaMpService: ClinicaMpService,
  ) {}

  /* ─────────────────────────────────────────────
   * 1. Buscar clínica por instancia de Evolution
   * ───────────────────────────────────────────── */
  async findClinicaByInstance(instanceName: string) {
    const clinica = await this.clinicaRepo.findOne({
      where: { evolution_instance: instanceName, is_active: true },
    });
    if (!clinica) {
      throw new NotFoundException(
        `No se encontró clínica activa con instancia "${instanceName}"`,
      );
    }

    // Gate: si el agente no está habilitado por la clínica, cortar el flujo en n8n
    if (!clinica.agent_habilitado) {
      return {
        disabled: true,
        clinicaId: clinica.id,
        nombre: clinica.nombre,
      };
    }

    // Verificar suscripción
    const subscription = await this.subscriptionRepo.findOne({
      where: { clinica_id: clinica.id },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    return {
      disabled: false,
      clinicaId: clinica.id,
      nombre: clinica.nombre,
      especialidad: clinica.especialidad,
      evolution_instance: clinica.evolution_instance,
      evolution_api_key: clinica.evolution_api_key,
      subscription: subscription
        ? { estado: subscription.estado, plan: subscription.plan?.nombre }
        : null,
    };
  }

  /* ─────────────────────────────────────────────
   * 2. Info pública de clínica (para el agente)
   * ───────────────────────────────────────────── */
  async getClinicaInfo(clinicaId: string) {
    const clinica = await this.clinicaRepo.findOne({
      where: { id: clinicaId },
    });
    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    // Obtener profesionales (solo médicos, no admin/assistant)
    const profesionales = await this.userRepo.find({
      where: { clinica_id: clinicaId, role: UserRole.PROFESSIONAL },
      select: ['id', 'nombre', 'apellido', 'role'],
    });

    // Traer horarios individuales de cada profesional
    const horariosProfesionales = profesionales.length
      ? await this.horarioProfesionalRepo.find({
          where: {
            clinica_id: clinicaId,
            user_id: In(profesionales.map((p) => p.id)),
          },
        })
      : [];
    const horariosByUser = new Map(
      horariosProfesionales.map((h) => [h.user_id, h.horarios]),
    );

    // Obtener tratamientos activos
    const tratamientos = await this.tratamientoRepo.find({
      where: { clinica_id: clinicaId, activo: true },
      select: ['id', 'nombre', 'precio_base', 'duracion_min'],
      order: { orden: 'ASC', nombre: 'ASC' },
    });

    return {
      clinicaId: clinica.id,
      nombre: clinica.nombre,
      nombre_propietario: clinica.nombre_propietario,
      especialidad: clinica.especialidad,
      direccion: clinica.direccion,
      cel: clinica.cel,
      email: clinica.email,
      horarios: clinica.horarios,
      duracion_turno_default: clinica.duracion_turno_default,
      agent_nombre: clinica.agent_nombre ?? 'Zoe',
      agent_instrucciones: clinica.agent_instrucciones,
      profesionales: profesionales.map((p) => ({
        id: p.id,
        nombre: `${p.nombre} ${p.apellido}`,
        role: p.role,
        horarios: horariosByUser.get(p.id) ?? null,
      })),
      tratamientos: tratamientos.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        precio: t.precio_base ? Number(t.precio_base) : null,
        duracion_min: t.duracion_min,
      })),
    };
  }

  /* ─────────────────────────────────────────────
   * 3. Buscar paciente por teléfono
   * ───────────────────────────────────────────── */
  async findPacienteByPhone(clinicaId: string, phone: string) {
    // Normalizar: quitar @s.whatsapp.net, espacios, guiones
    const normalized = phone.replace(/\D/g, '');

    const paciente = await this.pacienteRepo.findOne({
      where: { clinica_id: clinicaId, cel: normalized },
    });

    if (!paciente) {
      return { existe: false, paciente: null };
    }

    return {
      existe: true,
      paciente: {
        id: paciente.id,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        dni: paciente.dni,
        cel: paciente.cel,
        email: paciente.email,
        fecha_nacimiento: paciente.fecha_nacimiento,
      },
    };
  }

  /* ─────────────────────────────────────────────
   * 4. Buscar paciente por DNI
   * ───────────────────────────────────────────── */
  async findPacienteByDni(clinicaId: string, dni: string) {
    const paciente = await this.pacienteRepo.findOne({
      where: { clinica_id: clinicaId, dni },
    });

    if (!paciente) {
      return { existe: false, paciente: null };
    }

    return {
      existe: true,
      paciente: {
        id: paciente.id,
        nombre: paciente.nombre,
        apellido: paciente.apellido,
        dni: paciente.dni,
        cel: paciente.cel,
        email: paciente.email,
        fecha_nacimiento: paciente.fecha_nacimiento,
      },
    };
  }

  /* ─────────────────────────────────────────────
   * 5. Turnos disponibles (próximos N días)
   * ───────────────────────────────────────────── */
  async getTurnosDisponibles(
    clinicaId: string,
    dias: number = 3,
    profesionalId?: string,
  ) {
    const clinica = await this.clinicaRepo.findOne({
      where: { id: clinicaId },
      select: ['id', 'horarios', 'duracion_turno_default'],
    });
    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }

    const duracion = clinica.duracion_turno_default || 30;

    // Obtener profesional (solo médicos; si no se especifica, usar el primero disponible)
    let userId = profesionalId;
    if (!userId) {
      const prof = await this.userRepo.findOne({
        where: { clinica_id: clinicaId, role: UserRole.PROFESSIONAL },
        select: ['id'],
      });
      if (!prof) {
        return { disponibles: [], mensaje: 'No hay profesionales registrados' };
      }
      userId = prof.id;
    }

    // Preferir horarios del profesional si están configurados; si no, usar los de la clínica
    const horarioProf = await this.horarioProfesionalRepo.findOne({
      where: { clinica_id: clinicaId, user_id: userId },
    });
    const horarios = horarioProf?.horarios ?? clinica.horarios;
    if (!horarios) {
      return { disponibles: [], mensaje: 'No hay horarios configurados' };
    }

    // Calcular rango de fechas
    const ahora = new Date();
    const resultado: Array<{ fecha: string; dia: string; horarios: string[] }> = [];

    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

    for (let d = 0; d < dias + 7 && resultado.length < dias; d++) {
      const fecha = new Date(ahora);
      fecha.setDate(fecha.getDate() + d);
      const diaSemana = diasSemana[fecha.getDay()];
      const config = horarios[diaSemana];

      if (!config) continue;

      const slots: string[] = [];

      // Generar slots de mañana
      if (config.manana?.activo) {
        const slotsManana = this.generarSlots(
          fecha,
          config.manana.apertura,
          config.manana.cierre,
          duracion,
          ahora,
        );
        slots.push(...slotsManana);
      }

      // Generar slots de tarde
      if (config.tarde?.activo) {
        const slotsTarde = this.generarSlots(
          fecha,
          config.tarde.apertura,
          config.tarde.cierre,
          duracion,
          ahora,
        );
        slots.push(...slotsTarde);
      }

      if (slots.length === 0) continue;

      // Obtener turnos existentes para este día y profesional
      const inicioDelDia = new Date(fecha);
      inicioDelDia.setHours(0, 0, 0, 0);
      const finDelDia = new Date(fecha);
      finDelDia.setHours(23, 59, 59, 999);

      const turnosOcupados = await this.turnoRepo.find({
        where: {
          clinica_id: clinicaId,
          user_id: userId,
          start_time: Between(inicioDelDia, finDelDia),
          estado: Not(In([EstadoTurno.CANCELADO, EstadoTurno.PERDIDO])),
        },
        select: ['start_time', 'end_time'],
      });

      // Filtrar slots ocupados
      const slotsLibres = slots.filter((slot) => {
        const [h, m] = slot.split(':').map(Number);
        const slotStart = new Date(fecha);
        slotStart.setHours(h, m, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + duracion);

        return !turnosOcupados.some((t) => {
          const tStart = new Date(t.start_time);
          const tEnd = new Date(t.end_time);
          return slotStart < tEnd && slotEnd > tStart;
        });
      });

      if (slotsLibres.length > 0) {
        resultado.push({
          fecha: fecha.toISOString().split('T')[0],
          dia: diaSemana,
          horarios: slotsLibres,
        });
      }
    }

    return { disponibles: resultado, profesionalId: userId };
  }

  /* ─────────────────────────────────────────────
   * 6. Verificar si un paciente tiene turno activo
   * ───────────────────────────────────────────── */
  async verificarTurnoExistente(clinicaId: string, pacienteId: string) {
    const turno = await this.turnoRepo.findOne({
      where: {
        clinica_id: clinicaId,
        paciente_id: pacienteId,
        estado: Not(In([EstadoTurno.CANCELADO, EstadoTurno.PERDIDO, EstadoTurno.COMPLETADO])),
        start_time: MoreThanOrEqual(new Date()),
      },
      relations: ['user'],
      order: { start_time: 'ASC' },
    });

    if (!turno) {
      return { tiene_turno: false, turno: null };
    }

    return {
      tiene_turno: true,
      turno: {
        id: turno.id,
        start_time: turno.start_time,
        end_time: turno.end_time,
        estado: turno.estado,
        tipo_tratamiento: turno.tipo_tratamiento,
        notas: turno.notas,
        profesional: turno.user
          ? `${turno.user.nombre} ${turno.user.apellido}`
          : null,
      },
    };
  }

  /* ─────────────────────────────────────────────
   * 7. Crear turno (desde el agente)
   * ───────────────────────────────────────────── */
  async crearTurno(
    clinicaId: string,
    data: {
      paciente_id: string;
      user_id: string;
      start_time: string;
      end_time: string;
      tipo_tratamiento?: string;
      notas?: string;
    },
  ) {
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);

    if (endTime <= startTime) {
      return { error: 'La hora de fin debe ser posterior a la de inicio' };
    }

    // Check overlap
    const overlap = await this.turnoRepo
      .createQueryBuilder('t')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('t.user_id = :userId', { userId: data.user_id })
      .andWhere('t.estado NOT IN (:...excluded)', {
        excluded: [EstadoTurno.CANCELADO, EstadoTurno.PERDIDO],
      })
      .andWhere('t.start_time < :endTime', { endTime })
      .andWhere('t.end_time > :startTime', { startTime })
      .getOne();

    if (overlap) {
      return { error: 'El profesional ya tiene un turno en ese horario' };
    }

    const turno = this.turnoRepo.create({
      clinica_id: clinicaId,
      paciente_id: data.paciente_id,
      user_id: data.user_id,
      start_time: startTime,
      end_time: endTime,
      estado: EstadoTurno.PENDIENTE,
      source: SourceTurno.WHATSAPP,
      tipo_tratamiento: data.tipo_tratamiento,
      notas: data.notas,
    });

    const saved = await this.turnoRepo.save(turno);

    // Cargar relaciones para el webhook
    const full = await this.turnoRepo.findOne({
      where: { id: saved.id },
      relations: ['paciente', 'user'],
    });

    // Disparar webhook
    if (full) {
      this.webhookService.dispararWebhook(clinicaId, 'pendiente', {
        horario: {
          start_time: full.start_time?.toISOString(),
          end_time: full.end_time?.toISOString(),
        },
        paciente: {
          nombre: full.paciente?.nombre || '',
          apellido: full.paciente?.apellido || '',
          cel: full.paciente?.cel || null,
          dni: full.paciente?.dni || '',
        },
        tratamiento: full.tipo_tratamiento || null,
        estado_turno: 'pendiente',
        estado_pago: 'pendiente',
        profesional: {
          nombre: full.user?.nombre || '',
          apellido: full.user?.apellido || '',
          email: full.user?.email || '',
        },
        clinica: '',
        recordatorio_horas_antes: null,
      });
    }

    return {
      success: true,
      turno: {
        id: saved.id,
        start_time: saved.start_time,
        end_time: saved.end_time,
        estado: saved.estado,
        tipo_tratamiento: saved.tipo_tratamiento,
      },
    };
  }

  /* ─────────────────────────────────────────────
   * 8. Registrar paciente (desde el agente)
   * ───────────────────────────────────────────── */
  async registrarPaciente(
    clinicaId: string,
    data: {
      nombre: string;
      apellido: string;
      dni?: string;
      cel?: string;
      email?: string;
      fecha_nacimiento?: string;
    },
  ) {
    // Check duplicado por DNI
    if (data.dni) {
      const existente = await this.pacienteRepo.findOne({
        where: { clinica_id: clinicaId, dni: data.dni },
      });
      if (existente) {
        return {
          success: false,
          error: 'Ya existe un paciente con ese DNI',
          paciente: {
            id: existente.id,
            nombre: existente.nombre,
            apellido: existente.apellido,
          },
        };
      }
    }

    // Check duplicado por teléfono
    if (data.cel) {
      const existenteCel = await this.pacienteRepo.findOne({
        where: { clinica_id: clinicaId, cel: data.cel.replace(/\D/g, '') },
      });
      if (existenteCel) {
        return {
          success: false,
          error: 'Ya existe un paciente con ese teléfono',
          paciente: {
            id: existenteCel.id,
            nombre: existenteCel.nombre,
            apellido: existenteCel.apellido,
          },
        };
      }
    }

    const paciente = this.pacienteRepo.create({
      clinica_id: clinicaId,
      nombre: data.nombre,
      apellido: data.apellido,
      dni: data.dni,
      cel: data.cel?.replace(/\D/g, ''),
      email: data.email,
      fecha_nacimiento: data.fecha_nacimiento,
    });

    const saved = await this.pacienteRepo.save(paciente);

    return {
      success: true,
      paciente: {
        id: saved.id,
        nombre: saved.nombre,
        apellido: saved.apellido,
        dni: saved.dni,
        cel: saved.cel,
      },
    };
  }

  /* ─────────────────────────────────────────────
   * 9. Actualizar estado de turno
   * ───────────────────────────────────────────── */
  async actualizarEstadoTurno(
    clinicaId: string,
    turnoId: string,
    estado: EstadoTurno,
  ) {
    const turno = await this.turnoRepo.findOne({
      where: { id: turnoId, clinica_id: clinicaId },
      relations: ['paciente', 'user'],
    });

    if (!turno) {
      return { success: false, error: 'Turno no encontrado' };
    }

    if (
      turno.estado === EstadoTurno.CANCELADO ||
      turno.estado === EstadoTurno.COMPLETADO
    ) {
      return {
        success: false,
        error: `No se puede modificar un turno ${turno.estado}`,
      };
    }

    turno.estado = estado;
    await this.turnoRepo.save(turno);

    // Disparar webhook
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
      estado_pago: 'pendiente',
      profesional: {
        nombre: turno.user?.nombre || '',
        apellido: turno.user?.apellido || '',
        email: turno.user?.email || '',
      },
      clinica: '',
      recordatorio_horas_antes: null,
    });

    return { success: true, estado };
  }

  /* ─────────────────────────────────────────────
   * 10. Turnos próximos (para recordatorios)
   * ───────────────────────────────────────────── */
  async getTurnosProximos(horas: number = 24) {
    const ahora = new Date();
    const limite = new Date(ahora);
    limite.setHours(limite.getHours() + horas);

    return this.turnoRepo.find({
      where: {
        estado: Not(In([EstadoTurno.CANCELADO, EstadoTurno.PERDIDO])),
        start_time: Between(ahora, limite),
        recordatorio_enviado: false,
      },
      relations: ['paciente', 'user', 'clinica'],
      order: { start_time: 'ASC' },
    });
  }

  /* ─────────────────────────────────────────────
   * 11. Emitir evento webhook genérico
   * ───────────────────────────────────────────── */
  async emitWebhookEvent(
    clinicaId: string,
    event: string,
    data: Record<string, unknown>,
  ) {
    const clinica = await this.clinicaRepo.findOne({
      where: { id: clinicaId },
    });
    if (!clinica) {
      return { success: false, error: 'Clínica no encontrada' };
    }

    const config = clinica.webhooks?.[event];
    if (!config?.activo || !config?.url) {
      return { success: false, error: `Webhook "${event}" no configurado o inactivo` };
    }

    // Enviar async
    fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        clinicaId,
        clinica: clinica.nombre,
        timestamp: new Date().toISOString(),
        data,
      }),
    }).catch((err) => {
      this.logger.warn(`Webhook [${event}] falló: ${err.message}`);
    });

    return { success: true, event };
  }

  /* ─────────────────────────────────────────────
   * 12. Routing por teléfono: identificar quién escribe
   * ───────────────────────────────────────────── */
  async quienEscribe(clinicaId: string, phone: string) {
    const normalized = phone.replace(/\D/g, '');

    const paciente = await this.pacienteRepo.findOne({
      where: { clinica_id: clinicaId, cel: normalized },
      select: ['id', 'nombre', 'apellido'],
    });
    if (paciente) {
      return {
        tipo: 'paciente',
        pacienteId: paciente.id,
        nombre: `${paciente.nombre} ${paciente.apellido}`,
      };
    }

    return { tipo: 'desconocido' };
  }

  /* ─────────────────────────────────────────────
   * 13. Resumen de clínica (para admin vía WhatsApp)
   * ───────────────────────────────────────────── */
  async resumenClinica(clinicaId: string) {
    const hoy = new Date();
    const inicioHoy = new Date(hoy);
    inicioHoy.setHours(0, 0, 0, 0);
    const finHoy = new Date(hoy);
    finHoy.setHours(23, 59, 59, 999);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      turnosHoyTotal,
      turnosHoyPendientes,
      turnosHoyConfirmados,
      turnosHoyCompletados,
      ingresosMes,
      stockBajo,
      totalPacientes,
      pacientesNuevosMes,
      proximosTurnos,
    ] = await Promise.all([
      this.turnoRepo.count({
        where: {
          clinica_id: clinicaId,
          start_time: Between(inicioHoy, finHoy),
          estado: Not(In([EstadoTurno.CANCELADO, EstadoTurno.PERDIDO])),
        },
      }),
      this.turnoRepo.count({
        where: {
          clinica_id: clinicaId,
          start_time: Between(inicioHoy, finHoy),
          estado: EstadoTurno.PENDIENTE,
        },
      }),
      this.turnoRepo.count({
        where: {
          clinica_id: clinicaId,
          start_time: Between(inicioHoy, finHoy),
          estado: EstadoTurno.CONFIRMADO,
        },
      }),
      this.turnoRepo.count({
        where: {
          clinica_id: clinicaId,
          start_time: Between(inicioHoy, finHoy),
          estado: EstadoTurno.COMPLETADO,
        },
      }),
      this.pagoRepo
        .createQueryBuilder('p')
        .innerJoin('p.turno', 't')
        .where('t.clinica_id = :clinicaId', { clinicaId })
        .andWhere('p.estado = :estado', { estado: EstadoPago.APROBADO })
        .andWhere('p.created_at BETWEEN :inicio AND :fin', {
          inicio: inicioMes,
          fin: finHoy,
        })
        .select('COALESCE(SUM(p.total), 0)', 'total')
        .getRawOne<{ total: string }>(),
      this.inventarioRepo
        .createQueryBuilder('i')
        .where('i.clinica_id = :clinicaId', { clinicaId })
        .andWhere('i.cantidad <= i.stock_min')
        .getCount(),
      this.pacienteRepo.count({ where: { clinica_id: clinicaId } }),
      this.pacienteRepo.count({
        where: {
          clinica_id: clinicaId,
          created_at: MoreThanOrEqual(inicioMes),
        },
      }),
      this.turnoRepo.find({
        where: {
          clinica_id: clinicaId,
          start_time: MoreThanOrEqual(new Date()),
          estado: Not(In([EstadoTurno.CANCELADO, EstadoTurno.PERDIDO])),
        },
        relations: ['paciente', 'user'],
        order: { start_time: 'ASC' },
        take: 5,
      }),
    ]);

    return {
      turnos_hoy: {
        total: turnosHoyTotal,
        pendientes: turnosHoyPendientes,
        confirmados: turnosHoyConfirmados,
        completados: turnosHoyCompletados,
      },
      ingresos_mes: Number(ingresosMes?.total ?? 0),
      alertas_stock: stockBajo,
      pacientes: {
        total: totalPacientes,
        nuevos_mes: pacientesNuevosMes,
      },
      proximos_turnos: proximosTurnos.map((t) => ({
        id: t.id,
        start_time: t.start_time,
        paciente: t.paciente
          ? `${t.paciente.nombre} ${t.paciente.apellido}`
          : null,
        profesional: t.user
          ? `${t.user.nombre} ${t.user.apellido}`
          : null,
        estado: t.estado,
      })),
    };
  }

  /* ─────────────────────────────────────────────
   * 14. Finanzas por periodo
   * ───────────────────────────────────────────── */
  async finanzas(
    clinicaId: string,
    periodo: 'hoy' | 'semana' | 'mes' = 'mes',
  ) {
    const ahora = new Date();
    let inicio: Date;
    if (periodo === 'hoy') {
      inicio = new Date(ahora);
      inicio.setHours(0, 0, 0, 0);
    } else if (periodo === 'semana') {
      inicio = new Date(ahora);
      inicio.setDate(inicio.getDate() - 7);
    } else {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    }

    const qb = this.pagoRepo
      .createQueryBuilder('p')
      .innerJoin('p.turno', 't')
      .where('t.clinica_id = :clinicaId', { clinicaId })
      .andWhere('p.created_at >= :inicio', { inicio });

    const [ingresosAprobados, ingresosPendientes, porMetodo] =
      await Promise.all([
        qb
          .clone()
          .andWhere('p.estado = :estado', { estado: EstadoPago.APROBADO })
          .select('COALESCE(SUM(p.total), 0)', 'total')
          .addSelect('COUNT(p.id)', 'cantidad')
          .getRawOne<{ total: string; cantidad: string }>(),
        qb
          .clone()
          .andWhere('p.estado = :estado', { estado: EstadoPago.PENDIENTE })
          .select('COALESCE(SUM(p.total), 0)', 'total')
          .addSelect('COUNT(p.id)', 'cantidad')
          .getRawOne<{ total: string; cantidad: string }>(),
        qb
          .clone()
          .andWhere('p.estado = :estado', { estado: EstadoPago.APROBADO })
          .groupBy('p.method')
          .select('p.method', 'method')
          .addSelect('COALESCE(SUM(p.total), 0)', 'total')
          .addSelect('COUNT(p.id)', 'cantidad')
          .getRawMany<{ method: string; total: string; cantidad: string }>(),
      ]);

    return {
      periodo,
      desde: inicio.toISOString(),
      hasta: ahora.toISOString(),
      aprobados: {
        total: Number(ingresosAprobados?.total ?? 0),
        cantidad: Number(ingresosAprobados?.cantidad ?? 0),
      },
      pendientes: {
        total: Number(ingresosPendientes?.total ?? 0),
        cantidad: Number(ingresosPendientes?.cantidad ?? 0),
      },
      por_metodo: porMetodo.map((m) => ({
        method: m.method || 'sin_especificar',
        total: Number(m.total),
        cantidad: Number(m.cantidad),
      })),
    };
  }

  /* ─────────────────────────────────────────────
   * 15. Alertas de inventario (stock bajo)
   * ───────────────────────────────────────────── */
  async inventarioAlertas(clinicaId: string) {
    const items = await this.inventarioRepo
      .createQueryBuilder('i')
      .where('i.clinica_id = :clinicaId', { clinicaId })
      .andWhere('i.cantidad <= i.stock_min')
      .orderBy('i.cantidad', 'ASC')
      .getMany();

    return {
      total: items.length,
      items: items.map((i) => ({
        id: i.id,
        nombre: i.nombre,
        cantidad: i.cantidad,
        stock_min: i.stock_min,
      })),
    };
  }

  /* ─────────────────────────────────────────────
   * 16. Stats de pacientes
   * ───────────────────────────────────────────── */
  async pacientesStats(clinicaId: string) {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const [total, nuevosMes] = await Promise.all([
      this.pacienteRepo.count({ where: { clinica_id: clinicaId } }),
      this.pacienteRepo.count({
        where: {
          clinica_id: clinicaId,
          created_at: MoreThanOrEqual(inicioMes),
        },
      }),
    ]);

    return { total, nuevos_mes: nuevosMes };
  }

  /* ─────────────────────────────────────────────
   * 17. Equipo de la clínica
   * ───────────────────────────────────────────── */
  async equipo(clinicaId: string) {
    const miembros = await this.userRepo.find({
      where: { clinica_id: clinicaId },
      select: ['id', 'nombre', 'apellido', 'email', 'role'],
      order: { role: 'ASC', apellido: 'ASC' },
    });

    return {
      total: miembros.length,
      miembros: miembros.map((u) => ({
        id: u.id,
        nombre: `${u.nombre} ${u.apellido}`,
        email: u.email,
        role: u.role,
      })),
    };
  }

  /* ─────────────────────────────────────────────
   * 18. Turnos del profesional (mis turnos)
   * ───────────────────────────────────────────── */
  async misTurnos(
    clinicaId: string,
    userId: string,
    periodo: 'hoy' | 'semana' | 'pendientes' = 'hoy',
  ) {
    const ahora = new Date();
    let inicio: Date;
    let fin: Date;

    if (periodo === 'hoy') {
      inicio = new Date(ahora);
      inicio.setHours(0, 0, 0, 0);
      fin = new Date(ahora);
      fin.setHours(23, 59, 59, 999);
    } else if (periodo === 'semana') {
      inicio = new Date(ahora);
      inicio.setHours(0, 0, 0, 0);
      fin = new Date(ahora);
      fin.setDate(fin.getDate() + 7);
      fin.setHours(23, 59, 59, 999);
    } else {
      inicio = ahora;
      fin = new Date(ahora);
      fin.setFullYear(fin.getFullYear() + 1);
    }

    const where: Parameters<typeof this.turnoRepo.find>[0] = {
      where: {
        clinica_id: clinicaId,
        user_id: userId,
        start_time: Between(inicio, fin),
        estado:
          periodo === 'pendientes'
            ? In([EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO])
            : Not(In([EstadoTurno.CANCELADO, EstadoTurno.PERDIDO])),
      },
      relations: ['paciente'],
      order: { start_time: 'ASC' },
    };

    const turnos = await this.turnoRepo.find(where);

    return {
      periodo,
      total: turnos.length,
      turnos: turnos.map((t) => ({
        id: t.id,
        start_time: t.start_time,
        end_time: t.end_time,
        estado: t.estado,
        tipo_tratamiento: t.tipo_tratamiento,
        paciente: t.paciente
          ? {
              nombre: `${t.paciente.nombre} ${t.paciente.apellido}`,
              cel: t.paciente.cel,
            }
          : null,
      })),
    };
  }

  /* ─────────────────────────────────────────────
   * 19. Generar link de pago para un turno (MP Checkout Pro)
   * ───────────────────────────────────────────── */
  async generarLinkPagoTurno(clinicaId: string, turnoId: string) {
    const turno = await this.turnoRepo.findOne({
      where: { id: turnoId, clinica_id: clinicaId },
      relations: ['paciente', 'pagos'],
    });
    if (!turno) throw new NotFoundException('Turno no encontrado');

    // Buscar pago pendiente existente para este turno
    let pago = turno.pagos?.find((p) => p.estado === EstadoPago.PENDIENTE) ?? null;

    // Si no hay pago, crearlo usando el precio del tratamiento
    if (!pago) {
      let precio: number | null = null;

      if (turno.tipo_tratamiento) {
        const tratamiento = await this.tratamientoRepo.findOne({
          where: { clinica_id: clinicaId, nombre: turno.tipo_tratamiento, activo: true },
          select: ['precio_base'],
        });
        if (tratamiento?.precio_base) precio = Number(tratamiento.precio_base);
      }

      if (!precio || precio <= 0) {
        throw new BadRequestException(
          'El turno no tiene un precio asociado. Asigná un tratamiento con precio primero.',
        );
      }

      pago = this.pagoRepo.create({
        turno_id: turnoId,
        total: precio,
        estado: EstadoPago.PENDIENTE,
        method: 'mercadopago',
      });
      pago = await this.pagoRepo.save(pago);
    }

    if (!pago.total || Number(pago.total) <= 0) {
      throw new BadRequestException('El pago no tiene un monto válido');
    }

    const mpConfig = await this.clinicaMpService.findByClinica(clinicaId);
    if (!mpConfig) {
      throw new BadRequestException('La clínica no tiene Mercado Pago configurado. Configuralo en Ajustes → Pagos.');
    }
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const backendUrl = this.config.get<string>('BACKEND_URL', 'https://api.avaxhealth.com/api');

    const mp = new MercadoPagoConfig({ accessToken: mpConfig.access_token });
    const preference = new Preference(mp);

    const pacienteNombre = turno.paciente
      ? `${turno.paciente.nombre} ${turno.paciente.apellido}`
      : 'Paciente';

    const result = await preference.create({
      body: {
        items: [
          {
            id: turnoId,
            title: `Turno — ${turno.tipo_tratamiento ?? 'Consulta'} — ${pacienteNombre}`,
            quantity: 1,
            unit_price: Number(pago.total),
            currency_id: 'ARS',
          },
        ],
        external_reference: `pago_${pago.id}`,
        back_urls: {
          success: `${frontendUrl}/billing/success`,
          failure: `${frontendUrl}/billing/failure`,
          pending: `${frontendUrl}/billing/success`,
        },
        auto_return: 'approved',
        notification_url: `${backendUrl}/billing/webhook`,
      },
    });

    const isProduction = this.config.get('NODE_ENV') === 'production';
    const checkout_url =
      (isProduction ? result.init_point : result.sandbox_init_point) ??
      result.init_point ??
      '';

    this.logger.log(`Link de pago generado para turno ${turnoId} — pago ${pago.id}`);

    // Disparar webhook de la clínica si está configurado y activo
    if (mpConfig.webhook_activo && mpConfig.webhook_url) {
      const pacienteNombreWh = turno.paciente
        ? `${turno.paciente.nombre} ${turno.paciente.apellido}`
        : 'Paciente';
      fetch(mpConfig.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turno_id: turnoId,
          pago_id: pago.id,
          paciente: pacienteNombreWh,
          tratamiento: turno.tipo_tratamiento ?? 'Consulta',
          monto: Number(pago.total),
          link_pago: checkout_url,
        }),
      }).catch((err) => this.logger.warn(`Webhook pago fallido: ${err.message}`));
    }

    return {
      checkout_url,
      pago_id: pago.id,
      monto: Number(pago.total),
      turno_id: turnoId,
    };
  }

  /* ─── Helpers ─── */

  private generarSlots(
    fecha: Date,
    apertura: string,
    cierre: string,
    duracion: number,
    ahora: Date,
  ): string[] {
    const slots: string[] = [];
    const [aH, aM] = apertura.split(':').map(Number);
    const [cH, cM] = cierre.split(':').map(Number);

    let current = aH * 60 + aM;
    const end = cH * 60 + cM;

    while (current + duracion <= end) {
      const h = Math.floor(current / 60);
      const m = current % 60;

      // Si es hoy, solo mostrar slots futuros (con 30min de margen)
      const slotDate = new Date(fecha);
      slotDate.setHours(h, m, 0, 0);
      if (slotDate > new Date(ahora.getTime() + 30 * 60 * 1000)) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }

      current += duracion;
    }

    return slots;
  }
}
