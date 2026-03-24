import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Turno } from '../../turnos/entities/turno.entity';

@Entity('historial_medico')
export class HistorialMedico extends BaseEntity {
  @Column({ name: 'paciente_id', type: 'uuid' })
  paciente_id: string;

  @Column({ name: 'turno_id', type: 'uuid', nullable: true })
  turno_id: string;

  @Column({ type: 'text', nullable: true })
  diagnostico: string;

  @Column({ type: 'text', nullable: true })
  tratamiento: string;

  @Column({ type: 'text', nullable: true })
  observaciones: string;

  @ManyToOne(() => Paciente, (paciente) => paciente.historial_medico)
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;

  @ManyToOne(() => Turno, (turno) => turno.historial_medico)
  @JoinColumn({ name: 'turno_id' })
  turno: Turno;
}
