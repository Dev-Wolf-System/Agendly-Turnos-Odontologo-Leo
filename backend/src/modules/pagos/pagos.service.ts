import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { FilterPagosDto } from './dto/filter-pagos.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { EstadoPago } from '../../common/enums';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(Pago)
    private readonly pagoRepository: Repository<Pago>,
    @InjectRepository(Turno)
    private readonly turnoRepository: Repository<Turno>,
  ) {}

  private baseQuery(clinicaId: string) {
    return this.pagoRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.turno', 'turno')
      .leftJoinAndSelect('turno.paciente', 'paciente')
      .leftJoinAndSelect('turno.user', 'user')
      .where('turno.clinica_id = :clinicaId', { clinicaId });
  }

  async findByTurno(clinicaId: string, turnoId: string): Promise<Pago[]> {
    return this.baseQuery(clinicaId)
      .andWhere('p.turno_id = :turnoId', { turnoId })
      .orderBy('p.created_at', 'DESC')
      .getMany();
  }

  async findAll(
    clinicaId: string,
    filters?: FilterPagosDto,
    pagination?: PaginationDto,
  ): Promise<PaginatedResponse<Pago>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const sortBy = pagination?.sortBy || 'created_at';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';

    const allowedSortFields = ['created_at', 'total', 'estado', 'method'];
    const safeSort = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    const qb = this.baseQuery(clinicaId);

    if (filters?.estado) {
      qb.andWhere('p.estado = :estado', { estado: filters.estado });
    }
    if (filters?.method) {
      qb.andWhere('p.method = :method', { method: filters.method });
    }
    if (filters?.desde) {
      qb.andWhere('p.created_at >= :desde', { desde: filters.desde });
    }
    if (filters?.hasta) {
      qb.andWhere('p.created_at <= :hasta', { hasta: `${filters.hasta}T23:59:59` });
    }

    const total = await qb.getCount();

    qb.orderBy(`p.${safeSort}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const data = await qb.getMany();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getResumen(clinicaId: string, filters?: FilterPagosDto) {
    const baseQb = () => this.pagoRepository
      .createQueryBuilder('p')
      .leftJoin('p.turno', 'turno')
      .where('turno.clinica_id = :clinicaId', { clinicaId })
      .andWhere('p.estado = :aprobado', { aprobado: EstadoPago.APROBADO })
      .andWhere(filters?.desde ? 'p.created_at >= :desde' : '1=1', { desde: filters?.desde })
      .andWhere(filters?.hasta ? 'p.created_at <= :hasta' : '1=1', { hasta: filters?.hasta ? `${filters.hasta}T23:59:59` : undefined });

    // Balance particular (excluye obra social)
    const resParticular = await baseQb()
      .andWhere("p.fuente_pago = 'particular'")
      .select('COALESCE(SUM(p.total), 0)', 'total')
      .addSelect('COUNT(p.id)', 'cantidad')
      .getRawOne();

    // Obra social (caja aparte)
    const resOS = await baseQb()
      .andWhere("p.fuente_pago = 'obra_social'")
      .select('COALESCE(SUM(p.total), 0)', 'total')
      .addSelect('COUNT(p.id)', 'cantidad')
      .getRawOne();

    const porMetodo = await baseQb()
      .andWhere("p.fuente_pago = 'particular'")
      .select('p.method', 'method')
      .addSelect('COALESCE(SUM(p.total), 0)', 'total')
      .addSelect('COUNT(p.id)', 'cantidad')
      .groupBy('p.method')
      .getRawMany();

    const porObraSocial = await baseQb()
      .andWhere("p.fuente_pago = 'obra_social'")
      .select('p.obra_social_nombre', 'obra_social_nombre')
      .addSelect('COALESCE(SUM(p.total), 0)', 'total')
      .addSelect('COUNT(p.id)', 'cantidad')
      .groupBy('p.obra_social_nombre')
      .getRawMany();

    return {
      total: parseFloat(resParticular.total),
      cantidad: parseInt(resParticular.cantidad),
      total_obra_social: parseFloat(resOS.total),
      cantidad_obra_social: parseInt(resOS.cantidad),
      por_metodo: porMetodo.map((r: { method: string; total: string; cantidad: string }) => ({
        method: r.method || 'sin_definir',
        total: parseFloat(r.total),
        cantidad: parseInt(r.cantidad),
      })),
      por_obra_social: porObraSocial.map((r: { obra_social_nombre: string | null; total: string; cantidad: string }) => ({
        obra_social: r.obra_social_nombre || 'Sin nombre',
        total: parseFloat(r.total),
        cantidad: parseInt(r.cantidad),
      })),
    };
  }

  async findOne(id: string, clinicaId: string): Promise<Pago> {
    const pago = await this.baseQuery(clinicaId)
      .andWhere('p.id = :id', { id })
      .getOne();

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }
    return pago;
  }

  async create(clinicaId: string, dto: CreatePagoDto): Promise<Pago> {
    const turno = await this.turnoRepository.findOne({
      where: { id: dto.turno_id, clinica_id: clinicaId },
    });
    if (!turno) {
      throw new BadRequestException('El turno no existe o no pertenece a tu clínica');
    }

    // Verificar si ya existe un pago pendiente o aprobado para este turno
    const pagoExistente = await this.pagoRepository
      .createQueryBuilder('p')
      .where('p.turno_id = :turnoId', { turnoId: dto.turno_id })
      .andWhere('p.estado IN (:...estados)', {
        estados: [EstadoPago.PENDIENTE, EstadoPago.APROBADO],
      })
      .getOne();
    if (pagoExistente) {
      const msg = pagoExistente.estado === EstadoPago.APROBADO
        ? 'Este turno ya tiene un pago aprobado. No se puede cobrar dos veces.'
        : 'Este turno ya tiene un pago pendiente. Apruébalo o recházalo antes de crear otro.';
      throw new BadRequestException(msg);
    }

    const pago = this.pagoRepository.create({
      ...dto,
      estado: EstadoPago.PENDIENTE,
    });
    const saved = await this.pagoRepository.save(pago);
    return this.findOne(saved.id, clinicaId);
  }

  async update(
    id: string,
    clinicaId: string,
    dto: UpdatePagoDto,
  ): Promise<Pago> {
    const pago = await this.findOne(id, clinicaId);
    Object.assign(pago, dto);
    await this.pagoRepository.save(pago);
    return this.findOne(id, clinicaId);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const pago = await this.findOne(id, clinicaId);
    pago.estado = EstadoPago.PENDIENTE;
    await this.pagoRepository.save(pago);
  }
}
