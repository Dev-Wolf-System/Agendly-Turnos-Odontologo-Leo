import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('plans')
export class Plan extends BaseEntity {
  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_mensual: number;

  @Column({ type: 'int' })
  max_usuarios: number;

  @Column({ type: 'int', nullable: true })
  max_pacientes: number;

  @Column({ type: 'int', nullable: true })
  max_sucursales: number;

  @Column({ type: 'jsonb', default: {} })
  features: Record<string, boolean>;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'boolean', default: false })
  is_highlighted: boolean;

  @Column({ type: 'boolean', default: false })
  is_default_trial: boolean;

  @Column({ type: 'int', default: 0 })
  orden: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: true })
  show_in_landing: boolean;

  @Column({ type: 'text', default: 'admin' })
  default_role: string;

  @OneToMany(() => Subscription, (sub) => sub.plan)
  subscriptions: Subscription[];
}
