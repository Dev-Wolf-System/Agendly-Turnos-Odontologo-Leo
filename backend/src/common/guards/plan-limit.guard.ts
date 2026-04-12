import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';
import { User } from '../../modules/users/entities/user.entity';
import { Paciente } from '../../modules/pacientes/entities/paciente.entity';
import { EstadoSubscription } from '../enums/estado-subscription.enum';

export const PLAN_LIMIT_KEY = 'plan_limit';
export type PlanLimitType = 'max_usuarios' | 'max_pacientes';

export const CheckPlanLimit = (limitType: PlanLimitType) =>
  Reflect.metadata(PLAN_LIMIT_KEY, limitType);

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Paciente)
    private readonly pacienteRepo: Repository<Paciente>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitType = this.reflector.getAllAndOverride<PlanLimitType>(
      PLAN_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!limitType) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.clinicaId) return true;
    if (user.role === 'superadmin') return true;

    const subscription = await this.subscriptionRepo.findOne({
      where: { clinica_id: user.clinicaId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    if (!subscription?.plan) return true;

    const estadosActivos = [
      EstadoSubscription.ACTIVA,
    ];
    if (!estadosActivos.includes(subscription.estado)) return true;

    const plan = subscription.plan;
    const clinicaId = user.clinicaId;

    if (limitType === 'max_usuarios') {
      const limit = plan.max_usuarios;
      if (!limit) return true;
      const count = await this.userRepo.count({ where: { clinica_id: clinicaId } });
      if (count >= limit) {
        throw new ForbiddenException(
          `Tu plan "${plan.nombre}" permite máximo ${limit} usuarios. Actualmente tenés ${count}. Mejorá tu plan para agregar más.`,
        );
      }
    }

    if (limitType === 'max_pacientes') {
      const limit = plan.max_pacientes;
      if (!limit) return true; // null = ilimitado
      const count = await this.pacienteRepo.count({ where: { clinica_id: clinicaId } });
      if (count >= limit) {
        throw new ForbiddenException(
          `Tu plan "${plan.nombre}" permite máximo ${limit} pacientes. Actualmente tenés ${count}. Mejorá tu plan para agregar más.`,
        );
      }
    }

    return true;
  }
}
