import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EstadoSubscription } from '../../../common/enums';
import { Clinica } from '../../clinicas/entities/clinica.entity';
import { Plan } from '../../plans/entities/plan.entity';

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column({ name: 'clinica_id', type: 'uuid' })
  clinica_id: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  plan_id: string;

  @Column({ type: 'text', default: EstadoSubscription.TRIAL })
  estado: EstadoSubscription;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({ type: 'date', nullable: true })
  trial_ends_at: Date;

  @Column({ type: 'boolean', default: false })
  auto_renew: boolean;

  @Column({ type: 'text', nullable: true })
  external_reference: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Clinica, (clinica) => clinica.subscriptions)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;

  @ManyToOne(() => Plan, (plan) => plan.subscriptions)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;
}
