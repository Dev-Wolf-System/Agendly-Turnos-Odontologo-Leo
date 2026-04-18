import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { TipoAdminNotificacion } from '../../../common/enums';

@Entity('admin_notificaciones')
export class AdminNotificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  tipo: TipoAdminNotificacion;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'boolean', default: false })
  @Index('idx_admin_notif_leida')
  leida: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
