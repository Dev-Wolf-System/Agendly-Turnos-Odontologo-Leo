import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead, EstadoLead } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AdminNotificacionesService } from '../admin/admin-notificaciones.service';
import { TipoAdminNotificacion } from '../../common/enums';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
    private readonly adminNotif: AdminNotificacionesService,
  ) {}

  async create(dto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadRepository.create(dto);
    const saved = await this.leadRepository.save(lead);

    await this.adminNotif.crear(
      TipoAdminNotificacion.LEAD_NUEVO,
      `Nuevo prospecto — ${saved.nombre}`,
      `${saved.email}${saved.empresa ? ` · ${saved.empresa}` : ''}${saved.plan_interes ? ` · Plan: ${saved.plan_interes}` : ''}`,
      { lead_id: saved.id, email: saved.email },
    );

    return saved;
  }

  async findAll(estado?: EstadoLead): Promise<Lead[]> {
    const where = estado ? { estado } : {};
    return this.leadRepository.find({ where, order: { created_at: 'DESC' } });
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({ where: { id } });
    if (!lead) throw new NotFoundException('Lead no encontrado');
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);
    Object.assign(lead, dto);
    return this.leadRepository.save(lead);
  }

  async remove(id: string): Promise<void> {
    const lead = await this.findOne(id);
    await this.leadRepository.remove(lead);
  }

  async getStats() {
    const total = await this.leadRepository.count();
    const byEstado = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.estado', 'estado')
      .addSelect('COUNT(*)', 'cantidad')
      .groupBy('lead.estado')
      .getRawMany();

    const estadoMap: Record<string, number> = {};
    byEstado.forEach((r) => { estadoMap[r.estado] = Number(r.cantidad); });

    return {
      total,
      nuevos: estadoMap[EstadoLead.NUEVO] || 0,
      contactados: estadoMap[EstadoLead.CONTACTADO] || 0,
      en_negociacion: estadoMap[EstadoLead.EN_NEGOCIACION] || 0,
      convertidos: estadoMap[EstadoLead.CONVERTIDO] || 0,
      descartados: estadoMap[EstadoLead.DESCARTADO] || 0,
    };
  }
}
