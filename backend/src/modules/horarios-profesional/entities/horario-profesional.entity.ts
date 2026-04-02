import {
  Entity,
  Column,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('horarios_profesional')
@Unique('UQ_horarios_profesional_clinica_user', ['clinica_id', 'user_id'])
export class HorarioProfesional extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  clinica_id: string;

  @Column({ type: 'uuid' })
  @Index()
  user_id: string;

  @Column({ type: 'jsonb' })
  horarios: Record<string, {
    manana: { apertura: string; cierre: string; activo: boolean };
    tarde: { apertura: string; cierre: string; activo: boolean };
  }>;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
