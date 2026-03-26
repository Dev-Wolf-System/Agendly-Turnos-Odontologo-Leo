import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
  ) {}

  async findAll(
    clinicaId: string,
    pagination?: PaginationDto,
  ): Promise<PaginatedResponse<Proveedor>> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 20;
    const sortBy = pagination?.sortBy || 'nombre';
    const sortOrder = (pagination?.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC';

    const allowedSortFields = ['nombre', 'contacto', 'email', 'created_at'];
    const safeSort = allowedSortFields.includes(sortBy) ? sortBy : 'nombre';

    const qb = this.proveedorRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.inventario', 'inventario')
      .leftJoinAndSelect('p.categorias', 'categorias')
      .where('p.clinica_id = :clinicaId', { clinicaId });

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

  async findOne(id: string, clinicaId: string): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id, clinica_id: clinicaId },
      relations: ['inventario', 'categorias'],
    });
    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }
    return proveedor;
  }

  async create(
    clinicaId: string,
    dto: CreateProveedorDto,
  ): Promise<Proveedor> {
    const { categoria_ids, ...rest } = dto;
    const proveedor = this.proveedorRepository.create({
      ...rest,
      clinica_id: clinicaId,
    });

    if (categoria_ids?.length) {
      proveedor.categorias = await this.categoriaRepository.findBy({
        id: In(categoria_ids),
      });
    }

    const saved = await this.proveedorRepository.save(proveedor);
    return this.findOne(saved.id, clinicaId);
  }

  async update(
    id: string,
    clinicaId: string,
    dto: UpdateProveedorDto,
  ): Promise<Proveedor> {
    const proveedor = await this.findOne(id, clinicaId);
    const { categoria_ids, ...rest } = dto;
    Object.assign(proveedor, rest);

    if (categoria_ids !== undefined) {
      proveedor.categorias = categoria_ids.length
        ? await this.categoriaRepository.findBy({ id: In(categoria_ids) })
        : [];
    }

    await this.proveedorRepository.save(proveedor);
    return this.findOne(id, clinicaId);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const proveedor = await this.findOne(id, clinicaId);

    // Desvincular insumos del proveedor (no eliminarlos)
    await this.inventarioRepository
      .createQueryBuilder()
      .update()
      .set({ proveedor_id: () => 'NULL' })
      .where('proveedor_id = :id', { id })
      .execute();

    await this.proveedorRepository.remove(proveedor);
  }
}
