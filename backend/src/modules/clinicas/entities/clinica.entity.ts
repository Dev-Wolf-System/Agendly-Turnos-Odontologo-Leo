import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';
import { Turno } from '../../turnos/entities/turno.entity';
import { Inventario } from '../../inventario/entities/inventario.entity';
import { Proveedor } from '../../proveedores/entities/proveedor.entity';

@Entity('clinicas')
export class Clinica extends BaseEntity {
  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  nombre_propietario: string;

  @Column({ type: 'text', nullable: true })
  cel: string;

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
