import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { UserRole } from '../../../common/enums';
import { Clinica } from '../../clinicas/entities/clinica.entity';
import { Turno } from '../../turnos/entities/turno.entity';

@Entity('users')
export class User extends TenantBaseEntity {
  @Column({ type: 'text' })
  nombre: string;

  @Column({ type: 'text' })
  apellido: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  password: string;

  @Column({ type: 'text' })
  role: UserRole;

  @ManyToOne(() => Clinica, (clinica) => clinica.users)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;

  @OneToMany(() => Turno, (turno) => turno.user)
  turnos: Turno[];
}
