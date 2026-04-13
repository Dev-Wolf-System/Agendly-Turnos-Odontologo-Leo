import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In, MoreThanOrEqual, Between } from 'typeorm';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { User } from '../users/entities/user.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { HorarioProfesional } from '../horarios-profesional/entities/horario-profesional.entity';
import { EstadoTurno, SourceTurno, UserRole } from '../../common/enums';
import { WebhookService } from '../../common/services/webhook.service';

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
    private readonly webhookService: WebhookService,
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

    // Verificar suscripción
    const subscription = await this.subscriptionRepo.findOne({
      where: { clinica_id: clinica.id },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    return {
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
