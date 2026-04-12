import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Subscription } from './entities/subscription.entity';
import { User } from '../users/entities/user.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { EstadoSubscription } from '../../common/enums';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Paciente)
    private readonly pacienteRepository: Repository<Paciente>,
  ) {}

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionRepository.find({
      relations: ['clinica', 'plan'],
      order: { created_at: 'DESC' },
    });
  }

  async findByClinica(clinicaId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { clinica_id: clinicaId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Subscription> {
    const sub = await this.subscriptionRepository.findOne({
      where: { id },
      relations: ['clinica', 'plan'],
    });
    if (!sub) {
      throw new NotFoundException('Suscripción no encontrada');
    }
    return sub;
  }

  async create(data: Partial<Subscription>): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create(data);
    return this.subscriptionRepository.save(subscription);
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    const sub = await this.findOne(id);
    Object.assign(sub, data);
    return this.subscriptionRepository.save(sub);
  }

  async createTrialForClinica(
    clinicaId: string,
    planId: string,
    trialDays = 14,
  ): Promise<Subscription> {
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + trialDays);

    return this.create({
      clinica_id: clinicaId,
      plan_id: planId,
      estado: EstadoSubscription.ACTIVA,
      fecha_inicio: now,
      fecha_fin: trialEnd,
      trial_ends_at: trialEnd,
    });
  }

  async getUsage(clinicaId: string) {
    const sub = await this.findByClinica(clinicaId);
    const [currentUsuarios, currentPacientes] = await Promise.all([
      this.userRepository.count({ where: { clinica_id: clinicaId } }),
      this.pacienteRepository.count({ where: { clinica_id: clinicaId } }),
    ]);

    return {
      plan: sub?.plan ?? null,
      estado: sub?.estado ?? null,
      maxUsuarios: sub?.plan?.max_usuarios ?? 0,
      maxPacientes: sub?.plan?.max_pacientes ?? null,
      currentUsuarios,
      currentPacientes,
      canAddUsuario: sub?.plan?.max_usuarios ? currentUsuarios < sub.plan.max_usuarios : true,
      canAddPaciente: sub?.plan?.max_pacientes ? currentPacientes < sub.plan.max_pacientes : true,
    };
  }

  /**
   * Cron: marca como vencidas las suscripciones expiradas
   * Se ejecuta todos los días a las 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async marcarVencidas(): Promise<void> {
    const hoy = new Date();

    await this.subscriptionRepository
      .createQueryBuilder()
      .update(Subscription)
      .set({ estado: EstadoSubscription.VENCIDA })
      .where('estado = :estado', {
        estado: EstadoSubscription.ACTIVA,
      })
      .andWhere('fecha_fin < :hoy', { hoy })
      .execute();
  }
}
