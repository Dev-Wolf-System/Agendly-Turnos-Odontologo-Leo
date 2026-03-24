import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Clinica } from '../../clinicas/entities/clinica.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';

@Entity('proveedor')
export class Proveedor extends TenantBaseEntity {
  @Column({ type: 'text', nullable: true })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  contacto: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  cel: string;

  @ManyToOne(() => Clinica, (clinica) => clinica.proveedores)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;

  @OneToMany(() => Inventario, (inventario) => inventario.proveedor)
  inventario: Inventario[];
}
