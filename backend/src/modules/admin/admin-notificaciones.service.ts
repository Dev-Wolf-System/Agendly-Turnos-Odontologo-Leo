import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminNotificacion } from './entities/admin-notificacion.entity';
import { TipoAdminNotificacion } from '../../common/enums';

@Injectable()
export class AdminNotificacionesService {
  constructor(
    @InjectRepository(AdminNotificacion)
    private readonly repo: Repository<AdminNotificacion>,
  ) {}

  findAll(): Promise<AdminNotificacion[]> {
    return this.repo.find({ order: { created_at: 'DESC' }, take: 100 });
  }

  countUnread(): Promise<number> {
    return this.repo.count({ where: { leida: false } });
  }

  async markAsRead(id: string): Promise<void> {
    await this.repo.update(id, { leida: true });
  }

  async markAllAsRead(): Promise<void> {
    await this.repo.update({ leida: false }, { leida: true });
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async crear(
    tipo: TipoAdminNotificacion,
    titulo: string,
    mensaje: string,
    metadata?: Record<string, unknown>,
  ): Promise<AdminNotificacion> {
    const notif = this.repo.create({ tipo, titulo, mensaje, metadata: metadata ?? null });
    return this.repo.save(notif);
  }
}
