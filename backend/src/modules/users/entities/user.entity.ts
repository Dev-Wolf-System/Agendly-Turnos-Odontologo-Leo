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

  @Column({ type: 'uuid', nullable: true, unique: true })
  supabase_uid: string | null;

  @Column({ type: 'text' })
  role: UserRole;

  @Column({ type: 'text', nullable: true })
  especialidad: string | null;

  /**
   * Permite que un usuario admin sea considerado también profesional.
   * Cuando es true, el admin puede asignarse turnos como profesional y
   * usar el conmutador de vista para ver el dashboard como médico.
   */
  @Column({ type: 'boolean', default: false })
  also_professional: boolean;

  @ManyToOne(() => Clinica, (clinica) => clinica.users)
  @JoinColumn({ name: 'clinica_id' })
  clinica: Clinica;

  @OneToMany(() => Turno, (turno) => turno.user)
  turnos: Turno[];
}
