import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinica } from './entities/clinica.entity';

@Injectable()
export class ClinicasService {
  constructor(
    @InjectRepository(Clinica)
    private readonly clinicaRepository: Repository<Clinica>,
  ) {}

  async findOne(id: string): Promise<Clinica> {
    const clinica = await this.clinicaRepository.findOne({ where: { id } });
    if (!clinica) {
      throw new NotFoundException('Clínica no encontrada');
    }
    return clinica;
  }

  async update(id: string, data: Partial<Clinica>): Promise<Clinica> {
    const clinica = await this.findOne(id);
    Object.assign(clinica, data);
    return this.clinicaRepository.save(clinica);
  }
}
