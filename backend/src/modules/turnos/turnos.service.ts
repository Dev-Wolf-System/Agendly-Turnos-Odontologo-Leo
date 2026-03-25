import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan, Not } from 'typeorm';
import { Turno } from './entities/turno.entity';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { EstadoTurno } from '../../common/enums';

@Injectable()
export class TurnosService {
  constructor(
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
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
    });

    const saved = await this.turnoRepository.save(turno);
    return this.findOne(saved.id, clinicaId);
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

    Object.assign(turno, updateTurnoDto);
    if (updateTurnoDto.start_time) turno.start_time = startTime;
    if (updateTurnoDto.end_time) turno.end_time = endTime;

    await this.turnoRepository.save(turno);
    return this.findOne(id, clinicaId);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const turno = await this.findOne(id, clinicaId);
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
        excludedEstados: [EstadoTurno.CANCELADO],
      })
      .andWhere('t.start_time < :endTime', { endTime })
      .andWhere('t.end_time > :startTime', { startTime });

    if (excludeId) {
      qb.andWhere('t.id != :excludeId', { excludeId });
    }

    const overlap = await qb.getOne();

    if (overlap) {
      throw new ConflictException(
        'El odontólogo ya tiene un turno en ese horario',
      );
    }
  }
}
