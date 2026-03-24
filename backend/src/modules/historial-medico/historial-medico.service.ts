import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorialMedico } from './entities/historial-medico.entity';
import { CreateHistorialMedicoDto } from './dto/create-historial-medico.dto';
import { UpdateHistorialMedicoDto } from './dto/update-historial-medico.dto';

@Injectable()
export class HistorialMedicoService {
  constructor(
    @InjectRepository(HistorialMedico)
    private readonly historialRepository: Repository<HistorialMedico>,
  ) {}

  async findByPaciente(
    clinicaId: string,
    pacienteId: string,
  ): Promise<HistorialMedico[]> {
    return this.historialRepository
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.turno', 'turno')
      .leftJoinAndSelect('h.paciente', 'paciente')
      .where('paciente.clinica_id = :clinicaId', { clinicaId })
      .andWhere('h.paciente_id = :pacienteId', { pacienteId })
      .orderBy('h.created_at', 'DESC')
      .getMany();
  }

  async findOne(
    id: string,
    clinicaId: string,
  ): Promise<HistorialMedico> {
    const historial = await this.historialRepository
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.turno', 'turno')
      .leftJoinAndSelect('h.paciente', 'paciente')
      .where('h.id = :id', { id })
      .andWhere('paciente.clinica_id = :clinicaId', { clinicaId })
      .getOne();

    if (!historial) {
      throw new NotFoundException('Registro de historial no encontrado');
    }
    return historial;
  }

  async create(
    clinicaId: string,
    dto: CreateHistorialMedicoDto,
  ): Promise<HistorialMedico> {
    const historial = this.historialRepository.create(dto);
    const saved = await this.historialRepository.save(historial);
    return this.findOne(saved.id, clinicaId);
  }

  async update(
    id: string,
    clinicaId: string,
    dto: UpdateHistorialMedicoDto,
  ): Promise<HistorialMedico> {
    const historial = await this.findOne(id, clinicaId);
    Object.assign(historial, dto);
    await this.historialRepository.save(historial);
    return this.findOne(id, clinicaId);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const historial = await this.findOne(id, clinicaId);
    await this.historialRepository.remove(historial);
  }
}
