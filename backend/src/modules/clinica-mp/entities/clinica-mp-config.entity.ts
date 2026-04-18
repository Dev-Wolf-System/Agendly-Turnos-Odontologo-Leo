import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('clinica_mp_configs')
export class ClinicaMpConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  @Index('idx_clinica_mp_clinica_id')
  clinica_id: string;

  @Column({ type: 'text' })
  access_token: string;

  @Column({ type: 'text', nullable: true })
  public_key: string | null;

  @Column({ type: 'text', nullable: true })
  webhook_url: string | null;

  @Column({ type: 'boolean', default: false })
  webhook_activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
