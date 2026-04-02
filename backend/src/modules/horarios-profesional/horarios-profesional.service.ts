import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HorarioProfesional } from './entities/horario-profesional.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { UpsertHorarioProfesionalDto } from './dto/upsert-horario-profesional.dto';

@Injectable()
export class HorarioProfesionalService {
  constructor(
    @InjectRepository(HorarioProfesional)
    private readonly horarioProfRepo: Repository<HorarioProfesional>,
    @InjectRepository(Clinica)
    private readonly clinicaRepo: Repository<Clinica>,
  ) {}

  async findByClinica(clinicaId: string): Promise<HorarioProfesional[]> {
    return this.horarioProfRepo.find({
      where: { clinica_id: clinicaId },
      order: { created_at: 'ASC' },
    });
  }

  async findByUser(
    clinicaId: string,
    userId: string,
  ): Promise<HorarioProfesional | null> {
    return this.horarioProfRepo.findOne({
      where: { clinica_id: clinicaId, user_id: userId },
    });
  }

  async upsert(
    clinicaId: string,
    dto: UpsertHorarioProfesionalDto,
  ): Promise<HorarioProfesional> {
    let registro = await this.horarioProfRepo.findOne({
      where: { clinica_id: clinicaId, user_id: dto.user_id },
    });

    if (registro) {
      registro.horarios = dto.horarios;
    } else {
      registro = this.horarioProfRepo.create({
        clinica_id: clinicaId,
        user_id: dto.user_id,
        horarios: dto.horarios,
      });
    }

    return this.horarioProfRepo.save(registro);
  }

  async remove(clinicaId: string, userId: string): Promise<void> {
    const registro = await this.horarioProfRepo.findOne({
      where: { clinica_id: clinicaId, user_id: userId },
    });
    if (!registro) {
      throw new NotFoundException(
        'No se encontró horario personalizado para este profesional',
      );
    }
    await this.horarioProfRepo.remove(registro);
  }

  async getHorariosEfectivos(
    clinicaId: string,
    userId: string,
  ): Promise<Record<string, {
    manana: { apertura: string; cierre: string; activo: boolean };
    tarde: { apertura: string; cierre: string; activo: boolean };
  }> | null> {
    // Primero intentar con horarios personalizados del profesional
    const registro = await this.horarioProfRepo.findOne({
      where: { clinica_id: clinicaId, user_id: userId },
    });

    if (registro) {
      return registro.horarios;
    }

    // Fallback: horarios de la clínica
    const clinica = await this.clinicaRepo.findOne({
      where: { id: clinicaId },
      select: ['id', 'horarios'],
    });

    return clinica?.horarios ?? null;
  }
}
