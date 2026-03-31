import { Controller, Get, Patch, Body } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicasService } from './clinicas.service';
import { CurrentClinica } from '../../common/decorators';
import { Roles } from '../../common/decorators';
import { UserRole, EstadoSubscription } from '../../common/enums';
import { UpdateClinicaDto } from './dto/update-clinica.dto';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { FeatureFlagService } from '../../common/services/feature-flag.service';

@Controller('clinicas')
export class ClinicasController {
  constructor(
    private readonly clinicasService: ClinicasService,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  @Get('me')
  getMyClinica(@CurrentClinica() clinicaId: string) {
    return this.clinicasService.findOne(clinicaId);
  }

  @Get('me/subscription-status')
  async getSubscriptionStatus(@CurrentClinica() clinicaId: string) {
    const subscription = await this.subscriptionRepo.findOne({
      where: { clinica_id: clinicaId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    if (!subscription) {
      return { level: 'full', estado: null, plan: null };
    }

    const estado = subscription.estado;
    const base = {
      estado,
      plan: subscription.plan
        ? { nombre: subscription.plan.nombre, precio_mensual: subscription.plan.precio_mensual }
        : null,
      fecha_fin: subscription.fecha_fin,
      trial_ends_at: subscription.trial_ends_at,
      grace_period_ends_at: subscription.grace_period_ends_at,
      auto_renew: subscription.auto_renew,
    };

    switch (estado) {
      case EstadoSubscription.ACTIVA:
      case EstadoSubscription.TRIAL:
        return { ...base, level: 'full' };

      case EstadoSubscription.PAST_DUE:
        return {
          ...base,
          level: 'full',
          severity: 'warning',
          mensaje: 'Tu pago está pendiente. Por favor, actualizá tu método de pago para evitar interrupciones.',
        };

      case EstadoSubscription.GRACIA:
        return {
          ...base,
          level: 'read_only',
          severity: 'error',
          mensaje: 'Tu cuenta está en período de gracia. No se pueden crear nuevos registros hasta que regularices tu pago.',
        };

      case EstadoSubscription.SUSPENDIDA:
        return {
          ...base,
          level: 'read_only',
          severity: 'critical',
          mensaje: 'Tu suscripción está suspendida. Contactá al equipo de Avax Health para reactivarla.',
        };

      case EstadoSubscription.VENCIDA:
        return {
          ...base,
          level: 'read_only',
          severity: 'critical',
          mensaje: 'Tu suscripción ha vencido. Renová tu plan para continuar usando Avax Health.',
        };

      case EstadoSubscription.CANCELADA:
        return {
          ...base,
          level: 'blocked',
          severity: 'critical',
          mensaje: 'Tu suscripción fue cancelada. Contactá al equipo de Avax Health.',
        };

      default:
        return { ...base, level: 'full' };
    }
  }

  @Get('me/features')
  async getMyFeatures(@CurrentClinica() clinicaId: string) {
    return this.featureFlagService.getFeaturesForClinica(clinicaId);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  updateMyClinica(
    @CurrentClinica() clinicaId: string,
    @Body() updateClinicaDto: UpdateClinicaDto,
  ) {
    return this.clinicasService.update(clinicaId, updateClinicaDto);
  }
}
