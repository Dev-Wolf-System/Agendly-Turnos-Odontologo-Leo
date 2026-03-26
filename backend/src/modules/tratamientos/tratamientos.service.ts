import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tratamiento } from './entities/tratamiento.entity';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';

@Injectable()
export class TratamientosService {
  constructor(
    @InjectRepository(Tratamiento)
    private readonly tratamientoRepository: Repository<Tratamiento>,
  ) {}

  async findAll(clinicaId: string): Promise<Tratamiento[]> {
    return this.tratamientoRepository.find({
      where: { clinica_id: clinicaId },
      order: { orden: 'ASC', nombre: 'ASC' },
    });
  }

  async findActive(clinicaId: string): Promise<Tratamiento[]> {
    return this.tratamientoRepository.find({
      where: { clinica_id: clinicaId, activo: true },
      order: { orden: 'ASC', nombre: 'ASC' },
    });
  }

  async findOne(id: string, clinicaId: string): Promise<Tratamiento> {
    const tratamiento = await this.tratamientoRepository.findOne({
      where: { id, clinica_id: clinicaId },
    });
    if (!tratamiento) {
      throw new NotFoundException('Tratamiento no encontrado');
    }
    return tratamiento;
  }

  async create(clinicaId: string, dto: CreateTratamientoDto): Promise<Tratamiento> {
    const tratamiento = this.tratamientoRepository.create({
      ...dto,
      clinica_id: clinicaId,
    });
    return this.tratamientoRepository.save(tratamiento);
  }

  async update(id: string, clinicaId: string, dto: UpdateTratamientoDto): Promise<Tratamiento> {
    const tratamiento = await this.findOne(id, clinicaId);
    Object.assign(tratamiento, dto);
    return this.tratamientoRepository.save(tratamiento);
  }

  async remove(id: string, clinicaId: string): Promise<void> {
    const tratamiento = await this.findOne(id, clinicaId);
    await this.tratamientoRepository.remove(tratamiento);
  }

  async seedDefaults(clinicaId: string, especialidad: string): Promise<void> {
    const existing = await this.tratamientoRepository.count({ where: { clinica_id: clinicaId } });
    if (existing > 0) return;

    const templates = ESPECIALIDAD_TEMPLATES[especialidad] || ESPECIALIDAD_TEMPLATES['general'];
    const tratamientos = templates.map((t, i) =>
      this.tratamientoRepository.create({
        ...t,
        clinica_id: clinicaId,
        orden: i,
        activo: true,
      }),
    );
    await this.tratamientoRepository.save(tratamientos);
  }
}

const ESPECIALIDAD_TEMPLATES: Record<string, Array<{ nombre: string; duracion_min?: number; color?: string }>> = {
  odontologia: [
    { nombre: 'Consulta', duracion_min: 30, color: '#3B82F6' },
    { nombre: 'Limpieza', duracion_min: 45, color: '#10B981' },
    { nombre: 'Extracción', duracion_min: 60, color: '#EF4444' },
    { nombre: 'Empaste', duracion_min: 45, color: '#F59E0B' },
    { nombre: 'Endodoncia', duracion_min: 90, color: '#8B5CF6' },
    { nombre: 'Ortodoncia', duracion_min: 30, color: '#EC4899' },
    { nombre: 'Implante', duracion_min: 120, color: '#6366F1' },
    { nombre: 'Blanqueamiento', duracion_min: 60, color: '#06B6D4' },
    { nombre: 'Prótesis', duracion_min: 60, color: '#14B8A6' },
    { nombre: 'Radiografía', duracion_min: 15, color: '#64748B' },
    { nombre: 'Cirugía', duracion_min: 120, color: '#DC2626' },
    { nombre: 'Control', duracion_min: 20, color: '#22C55E' },
    { nombre: 'Urgencia', duracion_min: 30, color: '#F97316' },
  ],
  kinesiologia: [
    { nombre: 'Evaluación inicial', duracion_min: 45, color: '#3B82F6' },
    { nombre: 'Rehabilitación', duracion_min: 50, color: '#10B981' },
    { nombre: 'Masoterapia', duracion_min: 40, color: '#8B5CF6' },
    { nombre: 'Electroterapia', duracion_min: 30, color: '#F59E0B' },
    { nombre: 'Ejercicio terapéutico', duracion_min: 50, color: '#EC4899' },
    { nombre: 'Drenaje linfático', duracion_min: 60, color: '#06B6D4' },
    { nombre: 'RPG', duracion_min: 50, color: '#14B8A6' },
    { nombre: 'Vendaje neuromuscular', duracion_min: 30, color: '#F97316' },
    { nombre: 'Control', duracion_min: 20, color: '#22C55E' },
  ],
  nutricion: [
    { nombre: 'Primera consulta', duracion_min: 60, color: '#3B82F6' },
    { nombre: 'Seguimiento', duracion_min: 30, color: '#10B981' },
    { nombre: 'Plan alimentario', duracion_min: 45, color: '#8B5CF6' },
    { nombre: 'Antropometría', duracion_min: 30, color: '#F59E0B' },
    { nombre: 'Educación nutricional', duracion_min: 40, color: '#EC4899' },
    { nombre: 'Control de peso', duracion_min: 20, color: '#22C55E' },
    { nombre: 'Consulta deportiva', duracion_min: 45, color: '#F97316' },
  ],
  medicina_general: [
    { nombre: 'Consulta general', duracion_min: 30, color: '#3B82F6' },
    { nombre: 'Control periódico', duracion_min: 20, color: '#10B981' },
    { nombre: 'Certificado médico', duracion_min: 15, color: '#64748B' },
    { nombre: 'Electrocardiograma', duracion_min: 30, color: '#8B5CF6' },
    { nombre: 'Curación', duracion_min: 30, color: '#F59E0B' },
    { nombre: 'Vacunación', duracion_min: 15, color: '#EC4899' },
    { nombre: 'Urgencia', duracion_min: 30, color: '#EF4444' },
    { nombre: 'Receta médica', duracion_min: 15, color: '#06B6D4' },
  ],
  psicologia: [
    { nombre: 'Primera entrevista', duracion_min: 60, color: '#3B82F6' },
    { nombre: 'Sesión individual', duracion_min: 50, color: '#8B5CF6' },
    { nombre: 'Sesión de pareja', duracion_min: 60, color: '#EC4899' },
    { nombre: 'Terapia grupal', duracion_min: 90, color: '#10B981' },
    { nombre: 'Evaluación psicológica', duracion_min: 60, color: '#F59E0B' },
    { nombre: 'Seguimiento', duracion_min: 30, color: '#22C55E' },
  ],
  general: [
    { nombre: 'Consulta', duracion_min: 30, color: '#3B82F6' },
    { nombre: 'Control', duracion_min: 20, color: '#10B981' },
    { nombre: 'Tratamiento', duracion_min: 45, color: '#8B5CF6' },
    { nombre: 'Urgencia', duracion_min: 30, color: '#EF4444' },
  ],
};
