import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EstadoLead {
  NUEVO = 'nuevo',
  CONTACTADO = 'contactado',
  EN_NEGOCIACION = 'en_negociacion',
  CONVERTIDO = 'convertido',
  DESCARTADO = 'descartado',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  empresa: string;

  @Column({ nullable: true })
  especialidad: string;

  @Column({ nullable: true })
  plan_interes: string;

  @Column({ nullable: true, type: 'text' })
  mensaje: string;

  @Column({ type: 'enum', enum: EstadoLead, default: EstadoLead.NUEVO })
  estado: EstadoLead;

  @Column({ nullable: true, type: 'text' })
  notas: string;

  @Column({ default: 'landing' })
  origen: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
