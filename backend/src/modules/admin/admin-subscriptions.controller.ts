import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { BillingService } from '../billing/billing.service';
import { EvolutionService } from '../evolution/evolution.service';
import { PlansService } from '../plans/plans.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Controller('admin/subscriptions')
@UseGuards(SuperAdminGuard)
export class AdminSubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly billingService: BillingService,
    private readonly evolutionService: EvolutionService,
    private readonly plansService: PlansService,
  ) {}

  @Get()
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subscriptionsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateSubscriptionDto) {
    // Si el plan asignado NO es el trial por defecto, limpiamos trial_ends_at.
    // Sin esto, queda colgada una fecha vieja que el SubscriptionGuard interpreta
    // como "trial vencido" y bloquea las operaciones de escritura aunque la sub
    // esté activa con un plan pago.
    const plan = await this.plansService.findOne(dto.plan_id);
    const trialEndsAt = plan?.is_default_trial
      ? dto.trial_ends_at
        ? new Date(dto.trial_ends_at)
        : undefined
      : null;

    const data = {
      ...dto,
      fecha_inicio: new Date(dto.fecha_inicio),
      fecha_fin: new Date(dto.fecha_fin),
      trial_ends_at: trialEndsAt as Date | null | undefined,
    };

    // Upsert: si la clínica ya tiene una suscripción, actualizarla en lugar de
    // crear una nueva (evita duplicados de suscripciones por clínica).
    const existing = await this.subscriptionsService.findByClinica(dto.clinica_id);
    const result = existing
      ? await this.subscriptionsService.update(existing.id, data)
      : await this.subscriptionsService.create(data);

    // Si el nuevo plan incluye WhatsApp, provisionar instancia (no bloquea).
    this.maybeProvisionWhatsApp(dto.clinica_id, dto.plan_id).catch(() => {});

    return result;
  }

  private async maybeProvisionWhatsApp(clinicaId: string, planId: string) {
    const plan = await this.plansService.findOne(planId);
    const features = plan?.features ?? {};
    if (features.whatsapp_agent || features.whatsapp_reminders) {
      await this.evolutionService.ensureInstanceForClinica(clinicaId);
    }
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    const data: Record<string, any> = { ...dto };
    if (dto.fecha_fin) data.fecha_fin = new Date(dto.fecha_fin);
    if (dto.trial_ends_at) data.trial_ends_at = new Date(dto.trial_ends_at);
    return this.subscriptionsService.update(id, data);
  }

  @Delete(':id/cancel')
  async cancelSubscription(@Param('id', ParseUUIDPipe) id: string) {
    const sub = await this.subscriptionsService.findOne(id);
    if (!sub) throw new NotFoundException('Suscripción no encontrada');
    await this.billingService.cancelSubscription(sub.clinica_id);
    return { success: true };
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const sub = await this.subscriptionsService.findOne(id);
    if (!sub) throw new NotFoundException('Suscripción no encontrada');

    // Si tiene débito automático en MP, cancelarlo primero para no dejarlo huérfano.
    if (sub.preapproval_id) {
      try {
        await this.billingService.cancelSubscription(sub.clinica_id);
      } catch {
        // Si MP falla, igual permitimos la eliminación del registro local.
      }
    }

    await this.subscriptionsService.remove(id);
    return { success: true };
  }
}
