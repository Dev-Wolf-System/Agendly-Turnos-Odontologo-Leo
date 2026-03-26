import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { EstadoTurno, SourceTurno } from '../../../common/enums';
import { Clinica } from '../../clinicas/entities/clinica.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { User } from '../../users/entities/user.entity';
import { HistorialMedico } from '../../historial-medico/entities/historial-medico.entity';
import { Pago } from '../../pagos/entities/pago.entity';

@Entity('turnos')
export class Turno extends TenantBaseEntity {
  @Column({ name: 'paciente_id', type: 'uuid' })
  paciente_id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @Column({ type: 'timestamp' })
  @Index('idx_turnos_date')
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;

  @Column({ type: 'text', default: EstadoTurno.PENDIENTE })
  estado: EstadoTurno;

  @Column({ type: 'text', nullable: true })
  source: SourceTurno;

  @Column({ type: 'text', nullable: true })
  tipo_tratamiento: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @Column({ type: 'boolean', default: false })
  fue_reprogramado: boolean;

  @Column({ type: 'boolean', default: false })
  es_reprogramacion: boolean;

  @Column({ type: 'boolean', default: false })
  recordatorio_enviado: boolean;

  @ManyToOne(() => Clinica, (clinica) => clinica.turnos)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;

  @ManyToOne(() => Paciente, (paciente) => paciente.turnos)
  @JoinColumn({ name: 'paciente_id' })
  @Index('idx_turnos_paciente')
  paciente: Paciente;

  @ManyToOne(() => User, (user) => user.turnos)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => HistorialMedico, (historial) => historial.turno)
  historial_medico: HistorialMedico[];

  @OneToMany(() => Pago, (pago) => pago.turno)
  pagos: Pago[];
}
