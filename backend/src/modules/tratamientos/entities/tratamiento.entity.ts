import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Clinica } from '../../clinicas/entities/clinica.entity';

@Entity('tratamientos')
export class Tratamiento extends TenantBaseEntity {
  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio_base: number;

  @Column({ type: 'integer', nullable: true })
  duracion_min: number;

  @Column({ type: 'text', nullable: true })
  color: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'integer', default: 0 })
  orden: number;

  @ManyToOne(() => Clinica)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;
}
