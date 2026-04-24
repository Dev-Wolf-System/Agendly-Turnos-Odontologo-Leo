import { Entity, Column, ManyToOne, JoinColumn, Index, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type EstadoListaEspera = 'activa' | 'notificada' | 'vencida' | 'convertida';

@Entity('lista_espera')
export class ListaEspera extends BaseEntity {
  @Column({ name: 'clinica_id', type: 'uuid' })
  @Index('idx_lista_espera_clinica')
  clinica_id: string;

  @Column({ name: 'paciente_id', type: 'uuid' })
  paciente_id: string;

  @Column({ name: 'profesional_id', type: 'uuid', nullable: true })
  profesional_id: string | null;

  @Column({ name: 'fecha_preferida', type: 'date', nullable: true })
  fecha_preferida: string | null;

  @Column({ type: 'text', default: 'activa' })
  @Index('idx_lista_espera_estado')
  estado: EstadoListaEspera;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;

  // Relations (populated via joins)
  paciente?: { id: string; nombre: string; apellido: string; dni: string | null; cel: string | null };
  profesional?: { id: string; nombre: string; apellido: string } | null;
}
