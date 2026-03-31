import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { User } from '../users/entities/user.entity';

// In-memory online tracking (per clinic)
const onlineUsers = new Map<string, Map<string, Date>>();
const ONLINE_THRESHOLD_MS = 30_000; // 30 seconds

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messageRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async sendMessage(
    clinicaId: string,
    senderId: string,
    dto: CreateMessageDto,
  ): Promise<ChatMessage> {
    const message = this.messageRepo.create({
      clinica_id: clinicaId,
      sender_id: senderId,
      receiver_id: dto.receiver_id ?? undefined,
      content: dto.content,
    });
    const saved = await this.messageRepo.save(message);
    // Return with sender info
    return this.messageRepo.findOne({
      where: { id: saved.id },
      relations: ['sender'],
    }) as Promise<ChatMessage>;
  }

  async getMessages(
    clinicaId: string,
    userId: string,
    otherUserId?: string,
    limit = 50,
    before?: string,
  ): Promise<ChatMessage[]> {
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .where('m.clinica_id = :clinicaId', { clinicaId });

    if (otherUserId) {
      qb.andWhere(
        '((m.sender_id = :userId AND m.receiver_id = :otherUserId) OR (m.sender_id = :otherUserId AND m.receiver_id = :userId))',
        { userId, otherUserId },
      );
    } else {
      qb.andWhere('m.receiver_id IS NULL');
    }

    if (before) {
      qb.andWhere('m.created_at < :before', { before });
    }

    qb.orderBy('m.created_at', 'DESC').take(limit);

    const messages = await qb.getMany();
    return messages.reverse();
  }

  async markAsRead(
    clinicaId: string,
    userId: string,
    messageIds: string[],
  ): Promise<void> {
    if (messageIds.length === 0) return;
    await this.messageRepo
      .createQueryBuilder()
      .update()
      .set({ read_at: new Date() })
      .where('clinica_id = :clinicaId', { clinicaId })
      .andWhere('receiver_id = :userId', { userId })
      .andWhere('id IN (:...messageIds)', { messageIds })
      .andWhere('read_at IS NULL')
      .execute();
  }

  async getUnreadCount(clinicaId: string, userId: string): Promise<number> {
    return this.messageRepo
      .createQueryBuilder('m')
      .where('m.clinica_id = :clinicaId', { clinicaId })
      .andWhere('m.receiver_id = :userId', { userId })
      .andWhere('m.read_at IS NULL')
      .getCount();
  }

  async getUnreadPerUser(
    clinicaId: string,
    userId: string,
  ): Promise<Record<string, number>> {
    const results = await this.messageRepo
      .createQueryBuilder('m')
      .select('m.sender_id', 'senderId')
      .addSelect('COUNT(*)', 'count')
      .where('m.clinica_id = :clinicaId', { clinicaId })
      .andWhere('m.receiver_id = :userId', { userId })
      .andWhere('m.read_at IS NULL')
      .groupBy('m.sender_id')
      .getRawMany();

    // Also count general channel unread
    const generalCount = await this.messageRepo
      .createQueryBuilder('m')
      .where('m.clinica_id = :clinicaId', { clinicaId })
      .andWhere('m.receiver_id IS NULL')
      .andWhere('m.sender_id != :userId', { userId })
      .andWhere('m.read_at IS NULL')
      .getCount();

    const map: Record<string, number> = {};
    for (const r of results) {
      map[r.senderId] = parseInt(r.count, 10);
    }
    if (generalCount > 0) {
      map['general'] = generalCount;
    }
    return map;
  }

  async getClinicUsers(clinicaId: string): Promise<User[]> {
    return this.userRepo.find({
      where: { clinica_id: clinicaId },
      select: ['id', 'nombre', 'apellido', 'role', 'email'],
      order: { nombre: 'ASC' },
    });
  }

  heartbeat(clinicaId: string, userId: string): { ok: true } {
    if (!onlineUsers.has(clinicaId)) {
      onlineUsers.set(clinicaId, new Map());
    }
    onlineUsers.get(clinicaId)!.set(userId, new Date());
    return { ok: true };
  }

  getOnlineUsers(clinicaId: string): string[] {
    const clinicMap = onlineUsers.get(clinicaId);
    if (!clinicMap) return [];
    const now = Date.now();
    const online: string[] = [];
    for (const [uid, lastSeen] of clinicMap) {
      if (now - lastSeen.getTime() < ONLINE_THRESHOLD_MS) {
        online.push(uid);
      } else {
        clinicMap.delete(uid);
      }
    }
    return online;
  }

  async clearChat(clinicaId: string, otherUserId?: string): Promise<{ deleted: number }> {
    const qb = this.messageRepo
      .createQueryBuilder()
      .delete()
      .from(ChatMessage)
      .where('clinica_id = :clinicaId', { clinicaId });

    if (otherUserId) {
      qb.andWhere(
        '((sender_id = :otherUserId OR receiver_id = :otherUserId))',
        { otherUserId },
      );
    } else {
      qb.andWhere('receiver_id IS NULL');
    }

    const result = await qb.execute();
    return { deleted: result.affected || 0 };
  }
}
