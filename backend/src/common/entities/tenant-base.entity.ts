import { Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class TenantBaseEntity extends BaseEntity {
  @Column({ name: 'clinica_id', type: 'uuid', nullable: true })
  @Index()
  clinica_id: string;
}
