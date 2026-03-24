import { Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class TenantBaseEntity extends BaseEntity {
  @Column({ name: 'clinica_id', type: 'uuid' })
  @Index()
  clinica_id: string;
}
