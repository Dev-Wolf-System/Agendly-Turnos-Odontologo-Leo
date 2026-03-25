import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { Categoria } from '../categorias/entities/categoria.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
    @InjectRepository(Categoria)
    private readonly categoriaRepository: Repository<Categoria>,
  ) {}

  async findAll(clinicaId: string): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: { clinica_id: clinicaId },
      relations: ['inventario', 'categorias'],
      order: { nombre: 'ASC' },
    });
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
    await this.proveedorRepository.remove(proveedor);
  }
}
