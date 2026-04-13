import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TenantBaseEntity } from '../../../common/entities/tenant-base.entity';
import { Paciente } from '../../pacientes/entities/paciente.entity';

@Entity('archivos_medicos')
export class ArchivoMedico extends TenantBaseEntity {
  @Column({ type: 'uuid' })
  paciente_id: string;

  @Column({ type: 'uuid' })
  subido_por: string;

  @Column({ type: 'text' })
  nombre_archivo: string;

  @Column({ type: 'text' })
  storage_path: string;

  @Column({ type: 'text', nullable: true })
  tipo_mime: string;

  @Column({ type: 'integer', default: 0 })
  tamano_bytes: number;

  @Column({ type: 'text', nullable: true })
  categoria: string;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @ManyToOne(() => Paciente, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paciente_id' })
  paciente: Paciente;
}
