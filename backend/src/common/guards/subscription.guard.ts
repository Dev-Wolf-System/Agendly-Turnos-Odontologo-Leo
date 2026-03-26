import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IS_PUBLIC_KEY } from '../decorators';
import { UserRole, EstadoSubscription } from '../enums';
import { Subscription } from '../../modules/subscriptions/entities/subscription.entity';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Deja que JwtAuthGuard maneje esto
    }

    // Superadmin opera a nivel plataforma, no necesita suscripción
    if (user.role === UserRole.SUPERADMIN) {
      return true;
    }

    if (!user.clinicaId) {
      throw new ForbiddenException('No se pudo determinar la clínica');
    }

    const subscription = await this.subscriptionRepository.findOne({
      where: { clinica_id: user.clinicaId },
      order: { created_at: 'DESC' },
    });

    if (!subscription) {
      throw new ForbiddenException(
        'Tu clínica no tiene una suscripción activa. Contactá al equipo de Agendly.',
      );
    }

    const estadosPermitidos = [
      EstadoSubscription.ACTIVA,
      EstadoSubscription.TRIAL,
    ];

    if (!estadosPermitidos.includes(subscription.estado)) {
      const mensajes: Record<string, string> = {
        [EstadoSubscription.SUSPENDIDA]:
          'Tu suscripción está suspendida. Contactá al equipo de Agendly para reactivarla.',
        [EstadoSubscription.VENCIDA]:
          'Tu suscripción ha vencido. Renová tu plan para continuar usando Agendly.',
        [EstadoSubscription.CANCELADA]:
          'Tu suscripción fue cancelada. Contactá al equipo de Agendly.',
      };

      throw new ForbiddenException(
        mensajes[subscription.estado] || 'Suscripción no válida.',
      );
    }

    // Verificar si el trial expiró
    if (
      subscription.estado === EstadoSubscription.TRIAL &&
      subscription.trial_ends_at &&
      new Date(subscription.trial_ends_at) < new Date()
    ) {
      throw new ForbiddenException(
        'Tu periodo de prueba ha finalizado. Elegí un plan para continuar usando Agendly.',
      );
    }

    // Verificar si la suscripción activa venció
    if (
      subscription.estado === EstadoSubscription.ACTIVA &&
      subscription.fecha_fin &&
      new Date(subscription.fecha_fin) < new Date()
    ) {
      throw new ForbiddenException(
        'Tu suscripción ha vencido. Renová tu plan para continuar usando Agendly.',
      );
    }

    return true;
  }
}
