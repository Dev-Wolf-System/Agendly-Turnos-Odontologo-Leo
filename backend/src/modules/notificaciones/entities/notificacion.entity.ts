import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { TipoNotificacion } from '../../../common/enums';

@Entity('notificaciones')
export class Notificacion extends TenantBaseEntity {
  @Column({
    type: 'enum',
    enum: TipoNotificacion,
  })
  tipo: TipoNotificacion;

  @Column({ type: 'text' })
  titulo: string;

  @Column({ type: 'text' })
  mensaje: string;

  @Column({ type: 'boolean', default: false })
  @Index()
  leida: boolean;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;
}
