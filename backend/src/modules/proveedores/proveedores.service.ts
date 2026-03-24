import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,
  ) {}

  async findAll(clinicaId: string): Promise<Proveedor[]> {
    return this.proveedorRepository.find({
      where: { clinica_id: clinicaId },
      relations: ['inventario'],
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string, clinicaId: string): Promise<Proveedor> {
    const proveedor = await this.proveedorRepository.findOne({
      where: { id, clinica_id: clinicaId },
      relations: ['inventario'],
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
    const proveedor = this.proveedorRepository.create({
      ...dto,
      clinica_id: clinicaId,
    });
    const saved = await this.proveedorRepository.save(proveedor);
    return this.findOne(saved.id, clinicaId);
  }

  async update(
    id: string,
    clinicaId: string,
    dto: UpdateProveedorDto,
  ): Promise<Proveedor> {
    const proveedor = await this.findOne(id, clinicaId);
    Object.assign(proveedor, dto);
    await this.proveedorRepository.save(proveedor);
    return this.findOne(id, clinicaId);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const proveedor = await this.findOne(id, clinicaId);
    await this.proveedorRepository.remove(proveedor);
  }
}
