import { Entity, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Clinica } from '../../clinicas/entities/clinica.entity';
import { Proveedor } from '../../proveedores/entities/proveedor.entity';
import { Categoria } from '../../categorias/entities/categoria.entity';

@Entity('inventario')
export class Inventario extends TenantBaseEntity {
  @Column({ type: 'text', nullable: true })
  nombre: string;

  @Column({ type: 'integer', nullable: true })
  cantidad: number;

  @Column({ type: 'integer', nullable: true })
  stock_min: number;

  @Column({ name: 'proveedor_id', type: 'uuid', nullable: true })
  proveedor_id: string;

  @Column({ name: 'categoria_id', type: 'uuid', nullable: true })
  categoria_id: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  @ManyToOne(() => Clinica, (clinica) => clinica.inventario)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;

  @ManyToOne(() => Proveedor, (proveedor) => proveedor.inventario)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @ManyToOne(() => Categoria, { nullable: true })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;
}
