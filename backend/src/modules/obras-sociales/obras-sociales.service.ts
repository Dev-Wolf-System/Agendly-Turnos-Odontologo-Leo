import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObraSocial } from './entities/obra-social.entity';
import { CreateObraSocialDto } from './dto/create-obra-social.dto';
import { UpdateObraSocialDto } from './dto/update-obra-social.dto';

@Injectable()
export class ObrasSocialesService {
  constructor(
    @InjectRepository(ObraSocial)
    private readonly repo: Repository<ObraSocial>,
  ) {}

  findAll(clinicaId: string): Promise<ObraSocial[]> {
    return this.repo.find({
      where: { clinica_id: clinicaId },
      order: { orden: 'ASC', nombre: 'ASC' },
    });
  }

  findActive(clinicaId: string): Promise<ObraSocial[]> {
    return this.repo.find({
      where: { clinica_id: clinicaId, activo: true },
      order: { orden: 'ASC', nombre: 'ASC' },
    });
  }

  async findOne(id: string, clinicaId: string): Promise<ObraSocial> {
    const os = await this.repo.findOne({ where: { id, clinica_id: clinicaId } });
    if (!os) throw new NotFoundException('Obra social no encontrada');
    return os;
  }

  create(clinicaId: string, dto: CreateObraSocialDto): Promise<ObraSocial> {
    const os = this.repo.create({ ...dto, clinica_id: clinicaId });
    return this.repo.save(os);
  }

  async update(id: string, clinicaId: string, dto: UpdateObraSocialDto): Promise<ObraSocial> {
    const os = await this.findOne(id, clinicaId);
    Object.assign(os, dto);
    return this.repo.save(os);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const os = await this.findOne(id, clinicaId);
    await this.repo.remove(os);
  }
}
