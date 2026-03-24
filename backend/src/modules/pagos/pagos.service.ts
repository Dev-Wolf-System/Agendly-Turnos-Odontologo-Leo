import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pago } from './entities/pago.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { FilterPagosDto } from './dto/filter-pagos.dto';
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

  async findAll(clinicaId: string, filters?: FilterPagosDto): Promise<Pago[]> {
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

    return qb.orderBy('p.created_at', 'DESC').getMany();
  }

  async getResumen(clinicaId: string, filters?: FilterPagosDto) {
    const qb = this.pagoRepository
      .createQueryBuilder('p')
      .leftJoin('p.turno', 'turno')
      .where('turno.clinica_id = :clinicaId', { clinicaId })
      .andWhere('p.estado = :aprobado', { aprobado: EstadoPago.APROBADO });

    if (filters?.desde) {
      qb.andWhere('p.created_at >= :desde', { desde: filters.desde });
    }
    if (filters?.hasta) {
      qb.andWhere('p.created_at <= :hasta', { hasta: `${filters.hasta}T23:59:59` });
    }

    const result = await qb
      .select('COALESCE(SUM(p.total), 0)', 'total')
      .addSelect('COUNT(p.id)', 'cantidad')
      .getRawOne();

    const porMetodo = await this.pagoRepository
      .createQueryBuilder('p')
      .leftJoin('p.turno', 'turno')
      .where('turno.clinica_id = :clinicaId', { clinicaId })
      .andWhere('p.estado = :aprobado', { aprobado: EstadoPago.APROBADO })
      .andWhere(filters?.desde ? 'p.created_at >= :desde' : '1=1', { desde: filters?.desde })
      .andWhere(filters?.hasta ? 'p.created_at <= :hasta' : '1=1', { hasta: filters?.hasta ? `${filters.hasta}T23:59:59` : undefined })
      .select('p.method', 'method')
      .addSelect('COALESCE(SUM(p.total), 0)', 'total')
      .addSelect('COUNT(p.id)', 'cantidad')
      .groupBy('p.method')
      .getRawMany();

    return {
      total: parseFloat(result.total),
      cantidad: parseInt(result.cantidad),
      por_metodo: porMetodo.map((r: { method: string; total: string; cantidad: string }) => ({
        method: r.method || 'sin_definir',
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
    await this.pagoRepository.remove(pago);
  }
}
