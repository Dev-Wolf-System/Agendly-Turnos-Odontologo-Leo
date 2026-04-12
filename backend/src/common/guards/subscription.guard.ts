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

/**
 * Metadata key para marcar endpoints como solo-lectura.
 * Los endpoints de escritura (POST, PATCH, DELETE de datos de negocio)
 * deben usar @SetMetadata('isWriteOperation', true).
 */
export const IS_WRITE_OPERATION = 'isWriteOperation';

/**
 * Niveles de acceso según estado de suscripción:
 *
 * | Estado     | Lectura | Escritura | Login |
 * |-----------|---------|-----------|-------|
 * | activa    | ✅      | ✅        | ✅    |
 * | inactiva  | ✅      | ❌        | ✅    | (read-only, suspendida por admin)
 * | vencida   | ✅      | ❌        | ✅    | (expiró, debe renovar)
 * | cancelada | ❌      | ❌        | ❌    | (solo exportar datos 30 días)
 */
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

    // Si no tiene suscripción, permitir acceso (modo gracia inicial)
    if (!subscription) {
      request.subscriptionStatus = { level: 'full', estado: null };
      return true;
    }

    // Verificar si el trial expiró (suscripción activa con trial_ends_at en el pasado)
    if (
      subscription.estado === EstadoSubscription.ACTIVA &&
      subscription.trial_ends_at &&
      new Date(subscription.trial_ends_at) < new Date()
    ) {
      throw new ForbiddenException(
        'Tu periodo de prueba ha finalizado. Elegí un plan para continuar usando Avax Health.',
      );
    }

    // Determinar nivel de acceso según estado
    const estado = subscription.estado;
    const isWriteOp = this.reflector.getAllAndOverride<boolean>(IS_WRITE_OPERATION, [
      context.getHandler(),
      context.getClass(),
    ]) ?? this.isWriteMethod(request.method);

    switch (estado) {
      case EstadoSubscription.ACTIVA:
        request.subscriptionStatus = { level: 'full', estado };
        return true;

      case EstadoSubscription.INACTIVA:
        request.subscriptionStatus = {
          level: 'read_only',
          estado,
          mensaje: 'Tu suscripción está suspendida. Contactá al equipo de Avax Health para reactivarla.',
        };
        if (isWriteOp) {
          throw new ForbiddenException(
            'Tu suscripción está suspendida. No se permiten modificaciones. Contactá al equipo de Avax Health.',
          );
        }
        return true;

      case EstadoSubscription.VENCIDA:
        request.subscriptionStatus = {
          level: 'read_only',
          estado,
          mensaje: 'Tu suscripción ha vencido. Renová tu plan para continuar usando Avax Health.',
        };
        if (isWriteOp) {
          throw new ForbiddenException(
            'Tu suscripción ha vencido. Renová tu plan para restaurar el acceso.',
          );
        }
        return true;

      case EstadoSubscription.CANCELADA:
        throw new ForbiddenException(
          'Tu suscripción fue cancelada. Contactá al equipo de Avax Health para recuperar tu cuenta.',
        );

      default:
        request.subscriptionStatus = { level: 'full', estado };
        return true;
    }
  }

  /**
   * Determina si el método HTTP implica una operación de escritura.
   * Se usa como fallback cuando no hay metadata explícita.
   */
  private isWriteMethod(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method?.toUpperCase());
  }
}
