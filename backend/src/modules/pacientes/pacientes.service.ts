import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThanOrEqual } from 'typeorm';
import { Paciente } from './entities/paciente.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { HistorialMedico } from '../historial-medico/entities/historial-medico.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { EstadoPago } from '../../common/enums';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
    @InjectRepository(HistorialMedico)
    private readonly historialRepository: Repository<HistorialMedico>,
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
  ) {}

  async findAll(
    clinicaId: string,
    search?: string,
    pagination?: PaginationDto,
  ): Promise<PaginatedResponse<Paciente>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const sortBy = pagination?.sortBy || 'apellido';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC';

    const allowedSortFields = ['nombre', 'apellido', 'dni', 'email', 'cel', 'created_at'];
    const safeSort = allowedSortFields.includes(sortBy) ? sortBy : 'apellido';

    const qb = this.pacienteRepository
      .createQueryBuilder('p')
      .where('p.clinica_id = :clinicaId', { clinicaId });

    if (search) {
      qb.andWhere(
        '(p.nombre ILIKE :search OR p.apellido ILIKE :search OR p.dni ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await qb.getCount();

    qb.orderBy(`p.${safeSort}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const data = await qb.getMany();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, clinicaId: string): Promise<Paciente> {
    const paciente = await this.pacienteRepository.findOne({
      where: { id, clinica_id: clinicaId },
    });
    if (!paciente) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return paciente;
  }

  async findByDni(dni: string, clinicaId: string): Promise<Paciente | null> {
    return this.pacienteRepository.findOne({
      where: { dni, clinica_id: clinicaId },
    });
  }

  async create(
    clinicaId: string,
    createPacienteDto: CreatePacienteDto,
  ): Promise<Paciente> {
    if (createPacienteDto.dni) {
      const existing = await this.findByDni(createPacienteDto.dni, clinicaId);
      if (existing) {
        throw new ConflictException('Ya existe un paciente con ese DNI');
      }
    }

    const paciente = this.pacienteRepository.create({
      ...createPacienteDto,
      clinica_id: clinicaId,
    });

    return this.pacienteRepository.save(paciente);
  }

  async update(
    id: string,
    clinicaId: string,
    updatePacienteDto: UpdatePacienteDto,
  ): Promise<Paciente> {
    const paciente = await this.findOne(id, clinicaId);

    if (updatePacienteDto.dni && updatePacienteDto.dni !== paciente.dni) {
      const existing = await this.findByDni(updatePacienteDto.dni, clinicaId);
      if (existing) {
        throw new ConflictException('Ya existe un paciente con ese DNI');
      }
    }

    Object.assign(paciente, updatePacienteDto);
    return this.pacienteRepository.save(paciente);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const paciente = await this.findOne(id, clinicaId);
    await this.pacienteRepository.remove(paciente);
  }

  async count(clinicaId: string): Promise<number> {
    return this.pacienteRepository.count({
      where: { clinica_id: clinicaId },
    });
  }

  async getFicha(id: string, clinicaId: string) {
    const paciente = await this.findOne(id, clinicaId);

    const now = new Date();

    const [proximosTurnos, turnosPasados] = await Promise.all([
      this.turnoRepository.find({
        where: {
          paciente_id: id,
          clinica_id: clinicaId,
          start_time: MoreThanOrEqual(now),
        },
        relations: ['user'],
        order: { start_time: 'ASC' },
      }),
      this.turnoRepository.find({
        where: {
          paciente_id: id,
          clinica_id: clinicaId,
        },
        relations: ['user'],
        order: { start_time: 'DESC' },
      }),
    ]);

    // Separar pasados (excluir los próximos)
    const proximosIds = new Set(proximosTurnos.map((t) => t.id));
    const historialTurnos = turnosPasados.filter((t) => !proximosIds.has(t.id));

    const historialMedico = await this.historialRepository.find({
      where: { paciente_id: id },
      relations: ['turno'],
      order: { created_at: 'DESC' },
    });

    // Pagos: obtener todos los turnos del paciente y luego sus pagos
    const turnoIds = turnosPasados.map((t) => t.id);
    let pagos: Pago[] = [];
    if (turnoIds.length > 0) {
      pagos = await this.pagoRepository
        .createQueryBuilder('pago')
        .leftJoinAndSelect('pago.turno', 'turno')
        .where('pago.turno_id IN (:...turnoIds)', { turnoIds })
        .orderBy('pago.created_at', 'DESC')
        .getMany();
    }

    // KPIs
    const totalTurnos = turnosPasados.length;
    const ultimoTurno = historialTurnos.length > 0 ? historialTurnos[0].start_time : null;
    const totalPagado = pagos
      .filter((p) => p.estado === EstadoPago.APROBADO)
      .reduce((sum, p) => sum + Number(p.total || 0), 0);
    const saldoPendiente = pagos
      .filter((p) => p.estado === EstadoPago.PENDIENTE)
      .reduce((sum, p) => sum + Number(p.total || 0), 0);

    return {
      paciente,
      proximosTurnos: proximosTurnos.map((t) => ({
        id: t.id,
        start_time: t.start_time,
        end_time: t.end_time,
        estado: t.estado,
        notas: t.notas,
        odontologo: t.user ? { id: t.user.id, nombre: t.user.nombre, apellido: t.user.apellido } : null,
      })),
      historialTurnos: historialTurnos.map((t) => ({
        id: t.id,
        start_time: t.start_time,
        end_time: t.end_time,
        estado: t.estado,
        notas: t.notas,
        odontologo: t.user ? { id: t.user.id, nombre: t.user.nombre, apellido: t.user.apellido } : null,
      })),
      historialMedico: historialMedico.map((h) => ({
        id: h.id,
        diagnostico: h.diagnostico,
        tratamiento: h.tratamiento,
        observaciones: h.observaciones,
        fecha: h.created_at,
        turno_id: h.turno_id,
      })),
      pagos: pagos.map((p) => ({
        id: p.id,
        total: Number(p.total),
        estado: p.estado,
        method: p.method,
        fecha: p.created_at,
        turno_id: p.turno_id,
      })),
      kpis: {
        totalTurnos,
        ultimoTurno,
        totalPagado,
        saldoPendiente,
      },
    };
  }
}
