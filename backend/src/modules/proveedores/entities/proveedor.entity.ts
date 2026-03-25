import { Entity, Column, ManyToOne, OneToMany, ManyToMany, JoinTable, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Clinica } from '../../clinicas/entities/clinica.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';

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

  @ManyToMany(() => Categoria, { eager: true })
  @JoinTable({
    name: 'proveedor_categorias',
    joinColumn: { name: 'proveedor_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoria_id', referencedColumnName: 'id' },
  })
  categorias: Categoria[];
}
