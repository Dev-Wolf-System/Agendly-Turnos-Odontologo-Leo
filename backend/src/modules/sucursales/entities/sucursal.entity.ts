import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Clinica } from '../../clinicas/entities/clinica.entity';

@Entity('sucursales')
export class Sucursal extends BaseEntity {
  @Column({ type: 'uuid' })
  clinica_padre_id: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'text', nullable: true })
  telefono: string;

  @Column({ type: 'text', nullable: true })
  especialidad: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @ManyToOne(() => Clinica, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinica_padre_id' })
  clinica_padre: Clinica;
}
