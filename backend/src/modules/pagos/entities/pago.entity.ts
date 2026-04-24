import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EstadoPago } from '../../../common/enums';
import { Turno } from '../../turnos/entities/turno.entity';

@Entity('pagos')
export class Pago extends BaseEntity {
  @Column({ name: 'turno_id', type: 'uuid', nullable: true })
  turno_id: string | null;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  total: number;

  @Column({ type: 'text', default: EstadoPago.PENDIENTE })
  @Index('idx_pagos_status')
  estado: EstadoPago;

  @Column({ type: 'text', nullable: true })
  method: string;

  @Column({ type: 'text', nullable: true })
  external_reference: string;

  @Column({ type: 'text', default: 'particular' })
  fuente_pago: 'particular' | 'obra_social';

  @Column({ type: 'text', nullable: true })
  obra_social_nombre: string | null;

  @Column({ name: 'obra_social_id', type: 'uuid', nullable: true })
  obra_social_id: string | null;

  @Column({ type: 'text', nullable: true })
  codigo_prestacion: string | null;

  @Column({ type: 'text', nullable: true })
  nro_autorizacion: string | null;

  @ManyToOne(() => Turno, (turno) => turno.pagos)
  @JoinColumn({ name: 'turno_id' })
  turno: Turno;
}
