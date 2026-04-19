import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Clinica } from '../../clinicas/entities/clinica.entity';

@Entity('obras_sociales')
export class ObraSocial extends TenantBaseEntity {
  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  codigo: string;

  @Column({ type: 'text', nullable: true })
  url: string;

  @Column({ type: 'text', nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'integer', default: 0 })
  orden: number;

  @ManyToOne(() => Clinica)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;
}
