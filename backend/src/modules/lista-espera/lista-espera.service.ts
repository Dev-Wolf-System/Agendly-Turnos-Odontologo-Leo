import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListaEspera } from './entities/lista-espera.entity';
import { CreateListaEsperaDto } from './dto/create-lista-espera.dto';
import { UpdateListaEsperaDto } from './dto/update-lista-espera.dto';
import { WebhookService } from '../../common/services/webhook.service';

@Injectable()
export class ListaEsperaService {
  constructor(
    @InjectRepository(ListaEspera)
    private readonly repo: Repository<ListaEspera>,
    private readonly webhookService: WebhookService,
  ) {}

  private baseQuery(clinicaId: string) {
    return this.repo
      .createQueryBuilder('le')
      .leftJoinAndMapOne('le.paciente', 'pacientes', 'pac', 'pac.id = le.paciente_id')
      .leftJoinAndMapOne('le.profesional', 'users', 'prof', 'prof.id = le.profesional_id')
      .where('le.clinica_id = :clinicaId', { clinicaId })
      .orderBy('le.created_at', 'ASC');
  }

  async findAll(clinicaId: string, estado?: string): Promise<ListaEspera[]> {
    const qb = this.baseQuery(clinicaId);
    if (estado && estado !== 'all') {
      qb.andWhere('le.estado = :estado', { estado });
    }
    return qb.getMany();
  }

  async create(clinicaId: string, dto: CreateListaEsperaDto): Promise<ListaEspera> {
    const entry = this.repo.create({
      clinica_id: clinicaId,
      paciente_id: dto.paciente_id,
      profesional_id: dto.profesional_id ?? null,
      fecha_preferida: dto.fecha_preferida ?? null,
      notas: dto.notas ?? null,
      estado: 'activa',
    });
    const saved = await this.repo.save(entry);
    const [full] = await this.baseQuery(clinicaId)
      .andWhere('le.id = :id', { id: saved.id })
      .getMany();
    return full;
  }

  async update(clinicaId: string, id: string, dto: UpdateListaEsperaDto): Promise<ListaEspera> {
    const entry = await this.repo.findOne({ where: { id, clinica_id: clinicaId } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    Object.assign(entry, dto);
    await this.repo.save(entry);
    const [full] = await this.baseQuery(clinicaId)
      .andWhere('le.id = :id', { id })
      .getMany();
    return full;
  }

  async delete(clinicaId: string, id: string): Promise<void> {
    const entry = await this.repo.findOne({ where: { id, clinica_id: clinicaId } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    await this.repo.remove(entry);
  }

  async notificarSlotLibre(
    clinicaId: string,
    profesionalId: string | null,
    turnoInfo: { fecha: string; profesionalNombre: string },
  ): Promise<void> {
    const qb = this.repo
      .createQueryBuilder('le')
      .leftJoinAndMapOne('le.paciente', 'pacientes', 'pac', 'pac.id = le.paciente_id')
      .where('le.clinica_id = :clinicaId', { clinicaId })
      .andWhere("le.estado = 'activa'")
      .orderBy('le.created_at', 'ASC')
      .limit(1);

    if (profesionalId) {
      qb.andWhere('(le.profesional_id = :pid OR le.profesional_id IS NULL)', { pid: profesionalId });
    }

    const [primera] = await qb.getMany();
    if (!primera) return;

    await this.repo.update(primera.id, { estado: 'notificada' });

    const paciente = primera.paciente as any;
    try {
      await this.webhookService.dispararWebhook(clinicaId, {
        event: 'lista_espera_slot_libre',
        paciente_id: primera.paciente_id,
        paciente_nombre: paciente ? `${paciente.nombre} ${paciente.apellido}` : '',
        paciente_cel: paciente?.cel ?? '',
        profesional: turnoInfo.profesionalNombre,
        fecha_turno_liberado: turnoInfo.fecha,
        lista_espera_id: primera.id,
      });
    } catch {
      // Webhook optional — no falla el flujo
    }
  }
}
