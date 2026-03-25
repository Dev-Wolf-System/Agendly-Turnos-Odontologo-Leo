import { Entity, Column, ManyToOne, ManyToMany, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Clinica } from '../../clinicas/entities/clinica.entity';

@Entity('categorias')
export class Categoria extends TenantBaseEntity {
  @Column({ type: 'text' })
  nombre: string;

  @ManyToOne(() => Clinica)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;
}
