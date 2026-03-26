import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Inventario } from './entities/inventario.entity';
import { CreateInventarioDto } from './dto/create-inventario.dto';
import { UpdateInventarioDto } from './dto/update-inventario.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class InventarioService {
  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
  ) {}

  async findAll(
    clinicaId: string,
    pagination?: PaginationDto,
  ): Promise<PaginatedResponse<Inventario>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const sortBy = pagination?.sortBy || 'nombre';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC';

    const allowedSortFields = ['nombre', 'cantidad', 'stock_min', 'precio', 'created_at'];
    const safeSort = allowedSortFields.includes(sortBy) ? sortBy : 'nombre';

    const qb = this.inventarioRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.proveedor', 'proveedor')
      .leftJoinAndSelect('i.categoria', 'categoria')
      .where('i.clinica_id = :clinicaId', { clinicaId });

    const total = await qb.getCount();

    qb.orderBy(`i.${safeSort}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const data = await qb.getMany();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findLowStock(clinicaId: string): Promise<Inventario[]> {
    return this.inventarioRepository
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.proveedor', 'proveedor')
      .leftJoinAndSelect('i.categoria', 'categoria')
      .where('i.clinica_id = :clinicaId', { clinicaId })
      .andWhere('i.cantidad <= i.stock_min')
      .orderBy('i.cantidad', 'ASC')
      .getMany();
  }

  async findOne(id: string, clinicaId: string): Promise<Inventario> {
    const item = await this.inventarioRepository.findOne({
      where: { id, clinica_id: clinicaId },
      relations: ['proveedor', 'categoria'],
    });
    if (!item) {
      throw new NotFoundException('Ítem de inventario no encontrado');
    }
    return item;
  }

  async create(
    clinicaId: string,
    dto: CreateInventarioDto,
  ): Promise<Inventario> {
    const item = this.inventarioRepository.create({
      ...dto,
      clinica_id: clinicaId,
    });
    const saved = await this.inventarioRepository.save(item);
    return this.findOne(saved.id, clinicaId);
  }

  async update(
    id: string,
    clinicaId: string,
    dto: UpdateInventarioDto,
  ): Promise<Inventario> {
    const item = await this.findOne(id, clinicaId);
    Object.assign(item, dto);
    await this.inventarioRepository.save(item);
    return this.findOne(id, clinicaId);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const item = await this.findOne(id, clinicaId);
    await this.inventarioRepository.remove(item);
  }
}
