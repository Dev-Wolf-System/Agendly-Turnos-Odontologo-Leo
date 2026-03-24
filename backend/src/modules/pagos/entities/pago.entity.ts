import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EstadoPago } from '../../../common/enums';
import { Turno } from '../../turnos/entities/turno.entity';

@Entity('pagos')
export class Pago extends BaseEntity {
  @Column({ name: 'turno_id', type: 'uuid' })
  turno_id: string;

  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true })
  total: number;

  @Column({ type: 'text', default: EstadoPago.PENDIENTE })
  @Index('idx_pagos_status')
  estado: EstadoPago;

  @Column({ type: 'text', nullable: true })
  method: string;

  @Column({ type: 'text', nullable: true })
  external_reference: string;

  @ManyToOne(() => Turno, (turno) => turno.pagos)
  @JoinColumn({ name: 'turno_id' })
  turno: Turno;
}
