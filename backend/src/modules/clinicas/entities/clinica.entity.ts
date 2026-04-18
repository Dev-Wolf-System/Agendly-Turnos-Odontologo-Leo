import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Turno } from '../../turnos/entities/turno.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Proveedor } from '../../proveedores/entities/proveedor.entity';
import { Subscription } from '../../subscriptions/entities/subscription.entity';

@Entity('clinicas')
export class Clinica extends BaseEntity {
  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  nombre_propietario: string;

  @Column({ type: 'text', nullable: true })
  cel: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  direccion: string;

  @Column({ type: 'text', nullable: true })
  logo_url: string;

  @Column({ type: 'text', nullable: true, default: 'Medicina General' })
  especialidad: string;

  @Column({ type: 'text', nullable: true, default: 'Paciente' })
  label_paciente: string;

  @Column({ type: 'text', nullable: true, default: 'Profesional' })
  label_profesional: string;

  @Column({ type: 'jsonb', nullable: true })
  horarios: Record<string, {
    manana: { apertura: string; cierre: string; activo: boolean };
    tarde: { apertura: string; cierre: string; activo: boolean };
  }>;

  @Column({ type: 'integer', nullable: true, default: 30 })
  duracion_turno_default: number;

  @Column({ type: 'jsonb', nullable: true })
  webhooks: Record<string, { url: string; activo: boolean }>;

  @Column({ type: 'integer', nullable: true })
  recordatorio_horas_antes: number;

  @Column({ type: 'text', nullable: true })
  evolution_instance: string;

  @Column({ type: 'text', nullable: true })
  evolution_api_key: string;

  @Column({ type: 'boolean', default: false })
  agent_habilitado: boolean;

  @Column({ type: 'text', nullable: true, default: 'Avax Health' })
  agent_nombre: string;

  @Column({ type: 'text', nullable: true })
  agent_instrucciones: string;

  @Column({ type: 'jsonb', nullable: true })
  kpi_visibility: Record<string, Record<string, boolean>>;

  @Column({ type: 'boolean', default: false })
  onboarding_completado: boolean;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text', default: 'Pendiente' })
  estado_aprobacion: 'Pendiente' | 'Aprobado' | 'Rechazado';

  @OneToMany(() => Subscription, (sub) => sub.clinica)
  subscriptions: Subscription[];

  @OneToMany(() => User, (user) => user.clinica)
  users: User[];

  @OneToMany(() => Paciente, (paciente) => paciente.clinica)
  pacientes: Paciente[];

  @OneToMany(() => Turno, (turno) => turno.clinica)
  turnos: Turno[];

  @OneToMany(() => Inventario, (inventario) => inventario.clinica)
  inventario: Inventario[];

  @OneToMany(() => Proveedor, (proveedor) => proveedor.clinica)
  proveedores: Proveedor[];
}
