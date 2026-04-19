import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Clinica } from '../../clinicas/entities/clinica.entity';
import { Turno } from '../../turnos/entities/turno.entity';
import { HistorialMedico } from '../../historial-medico/entities/historial-medico.entity';

@Entity('pacientes')
export class Paciente extends TenantBaseEntity {
  @Column({ type: 'text', unique: true, nullable: true })
  @Index('idx_pacientes_dni')
  dni: string;

  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text' })
  apellido: string;

  @Column({ type: 'text', nullable: true })
  cel: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'date', nullable: true })
  fecha_nacimiento: string;

  @Column({ type: 'text', nullable: true })
  obra_social: string;

  @Column({ type: 'text', nullable: true })
  nro_afiliado: string;

  @Column({ type: 'text', nullable: true })
  plan_os: string;

  @ManyToOne(() => Clinica, (clinica) => clinica.pacientes)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;

  @OneToMany(() => Turno, (turno) => turno.paciente)
  turnos: Turno[];

  @OneToMany(() => HistorialMedico, (historial) => historial.paciente)
  historial_medico: HistorialMedico[];
}
