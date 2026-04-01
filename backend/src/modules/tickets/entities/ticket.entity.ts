import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CategoriaTicket {
  TECNICO = 'tecnico',
  FACTURACION = 'facturacion',
  CONSULTA = 'consulta',
  OTRO = 'otro',
}

export enum PrioridadTicket {
  BAJA = 'baja',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente',
}

export enum EstadoTicket {
  ABIERTO = 'abierto',
  EN_PROGRESO = 'en_progreso',
  ESPERANDO_RESPUESTA = 'esperando_respuesta',
  RESUELTO = 'resuelto',
  CERRADO = 'cerrado',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('idx_tickets_clinica')
  clinica_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'varchar' })
  asunto: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: CategoriaTicket,
    default: CategoriaTicket.CONSULTA,
  })
  categoria: CategoriaTicket;

  @Column({
    type: 'enum',
    enum: PrioridadTicket,
    default: PrioridadTicket.MEDIA,
  })
  prioridad: PrioridadTicket;

  @Column({
    type: 'enum',
    enum: EstadoTicket,
    default: EstadoTicket.ABIERTO,
  })
  @Index('idx_tickets_estado')
  estado: EstadoTicket;

  @Column({ type: 'text', nullable: true })
  respuesta_admin: string;

  @Column({ type: 'uuid', nullable: true })
  respondido_por: string;

  @Column({ type: 'timestamp', nullable: true })
  respondido_at: Date;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
