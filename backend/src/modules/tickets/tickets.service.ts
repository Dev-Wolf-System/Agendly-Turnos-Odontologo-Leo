import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, EstadoTicket } from './entities/ticket.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { RespondTicketDto } from './dto/respond-ticket.dto';
import { AdminNotificacionesService } from '../admin/admin-notificaciones.service';
import { TipoAdminNotificacion } from '../../common/enums';

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly adminNotif: AdminNotificacionesService,
  ) {}

  async create(
    clinicaId: string,
    userId: string,
    dto: CreateTicketDto,
  ): Promise<Ticket> {
    const ticket = this.ticketRepository.create({
      clinica_id: clinicaId,
      user_id: userId,
      ...dto,
    });
    const saved = await this.ticketRepository.save(ticket);

    const esUrgente = saved.prioridad === 'urgente' || saved.prioridad === 'alta';
    await this.adminNotif.crear(
      esUrgente ? TipoAdminNotificacion.TICKET_URGENTE : TipoAdminNotificacion.TICKET_NUEVO,
      esUrgente ? `Ticket ${saved.prioridad} — ${saved.asunto}` : `Nuevo ticket — ${saved.asunto}`,
      `Categoría: ${saved.categoria}. Clínica: ${clinicaId}`,
      { ticket_id: saved.id, clinica_id: clinicaId, prioridad: saved.prioridad },
    );

    return saved;
  }

  async findAllByClinica(clinicaId: string): Promise<Ticket[]> {
    return this.ticketRepository.find({
      where: { clinica_id: clinicaId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string, clinicaId: string): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id, clinica_id: clinicaId },
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    return ticket;
  }

  async findAllAdmin(filters?: {
    estado?: EstadoTicket;
    categoria?: string;
    clinica_id?: string;
  }): Promise<any[]> {
    const qb = this.ticketRepository
      .createQueryBuilder('t')
      .leftJoin('clinicas', 'c', 'c.id = t.clinica_id')
      .leftJoin('users', 'u', 'u.id = t.user_id')
      .select([
        't.*',
        'c.nombre AS clinica_nombre',
        'u.nombre AS user_nombre',
        'u.email AS user_email',
      ]);

    if (filters?.estado) {
      qb.andWhere('t.estado = :estado', { estado: filters.estado });
    }
    if (filters?.categoria) {
      qb.andWhere('t.categoria = :categoria', { categoria: filters.categoria });
    }
    if (filters?.clinica_id) {
      qb.andWhere('t.clinica_id = :clinicaId', { clinicaId: filters.clinica_id });
    }

    qb.orderBy('t.created_at', 'DESC');
    return qb.getRawMany();
  }

  async respond(
    id: string,
    adminUserId: string,
    dto: RespondTicketDto,
  ): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    ticket.respuesta_admin = dto.respuesta_admin;
    ticket.respondido_por = adminUserId;
    ticket.respondido_at = new Date();
    ticket.estado = dto.estado ?? EstadoTicket.ESPERANDO_RESPUESTA;

    return this.ticketRepository.save(ticket);
  }

  async updateEstado(id: string, estado: EstadoTicket): Promise<Ticket> {
    const ticket = await this.ticketRepository.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    ticket.estado = estado;
    return this.ticketRepository.save(ticket);
  }

  async getStats(): Promise<Record<string, number>> {
    const results = await this.ticketRepository
      .createQueryBuilder('t')
      .select('t.estado', 'estado')
      .addSelect('COUNT(t.id)', 'count')
      .groupBy('t.estado')
      .getRawMany();

    const stats: Record<string, number> = {};
    for (const row of results) {
      stats[row.estado] = parseInt(row.count);
    }
    return stats;
  }
}
