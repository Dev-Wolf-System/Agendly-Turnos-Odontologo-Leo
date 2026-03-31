import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('chat_messages')
export class ChatMessage extends BaseEntity {
  @Column({ type: 'uuid' })
  clinica_id: string;

  @Column({ type: 'uuid' })
  sender_id: string;

  @Column({ type: 'uuid', nullable: true })
  receiver_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;
}
