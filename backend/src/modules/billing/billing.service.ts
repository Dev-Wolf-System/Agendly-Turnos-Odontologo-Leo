import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import * as crypto from 'crypto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PlansService } from '../plans/plans.service';
import { EstadoSubscription } from '../../common/enums';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly mp: MercadoPagoConfig;

  constructor(
    private readonly config: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
  ) {
    this.mp = new MercadoPagoConfig({
      accessToken: this.config.getOrThrow<string>('MP_ACCESS_TOKEN'),
    });
  }

  async createCheckout(clinicaId: string, planId?: string): Promise<{ checkout_url: string }> {
    const sub = await this.subscriptionsService.findByClinica(clinicaId);
    if (!sub) throw new BadRequestException('No se encontró suscripción para esta clínica');

    // Usar planId recibido, o el del plan actual si ya tiene uno no-trial
    const targetPlanId = planId ?? (sub.plan?.is_default_trial ? null : sub.plan_id);
    if (!targetPlanId) {
      throw new BadRequestException('Seleccioná un plan para continuar');
    }

    const plan = planId ? await this.plansService.findOne(targetPlanId) : sub.plan;
    if (!plan) throw new BadRequestException('Plan no encontrado');

    const precio = Number(plan.precio_mensual);
    if (precio <= 0) throw new BadRequestException('El plan seleccionado no tiene un precio válido');

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const backendUrl = this.config.get<string>('BACKEND_URL', 'https://api.avaxhealth.com/api');

    // Codificar planId en external_reference para actualizarlo al pagar
    const externalRef = `sub_${sub.id}_plan_${targetPlanId}`;

    const preference = new Preference(this.mp);
    const result = await preference.create({
      body: {
        items: [
          {
            id: targetPlanId,
            title: `Suscripción ${plan.nombre} — Avax Health`,
            quantity: 1,
            unit_price: precio,
            currency_id: 'ARS',
          },
        ],
        external_reference: externalRef,
        back_urls: {
          success: `${frontendUrl}/billing/success`,
          failure: `${frontendUrl}/billing/failure`,
          pending: `${frontendUrl}/billing/success`,
        },
        auto_return: 'approved',
        notification_url: `${backendUrl}/billing/webhook`,
      },
    });

    const isProduction = this.config.get('NODE_ENV') === 'production';
    const url = (isProduction ? result.init_point : result.sandbox_init_point) ?? result.init_point ?? '';

    return { checkout_url: url };
  }

  async processWebhook(body: any, signature: string, requestId: string): Promise<void> {
    const secret = this.config.get<string>('MP_WEBHOOK_SECRET');

    if (secret && signature) {
      const parts = signature.split(',').reduce<Record<string, string>>((acc, part) => {
        const [k, v] = part.split('=');
        if (k && v) acc[k.trim()] = v.trim();
        return acc;
      }, {});

      const { ts, v1 } = parts;
      if (ts && v1) {
        const dataId = body?.data?.id ?? '';
        const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
        const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
        if (expected !== v1) {
          this.logger.warn('Webhook MP: firma inválida, ignorando');
          return;
        }
      }
    }

    if (body.type !== 'payment') return;

    const dataId = body?.data?.id;
    if (!dataId) return;

    try {
      const payment = new Payment(this.mp);
      const paymentData = await payment.get({ id: String(dataId) });

      if (paymentData.status !== 'approved') {
        this.logger.log(`Webhook MP: pago ${dataId} con estado ${paymentData.status}, ignorando`);
        return;
      }

      const externalRef = paymentData.external_reference ?? '';
      // Formato: sub_{subId}_plan_{planId}
      const subMatch = externalRef.match(/^sub_([^_]+(?:_[^_]+)*?)_plan_(.+)$/);
      if (!subMatch) {
        this.logger.warn(`Webhook MP: external_reference inválido: ${externalRef}`);
        return;
      }

      const [, subId, newPlanId] = subMatch;
      const sub = await this.subscriptionsService.findOne(subId);

      const base = new Date(sub.fecha_fin) > new Date() ? new Date(sub.fecha_fin) : new Date();
      const newFechaFin = new Date(base);
      newFechaFin.setMonth(newFechaFin.getMonth() + 1);

      await this.subscriptionsService.update(subId, {
        estado: EstadoSubscription.ACTIVA,
        fecha_fin: newFechaFin,
        trial_ends_at: null as any,
        plan_id: newPlanId,
        external_reference: String(paymentData.id),
      });

      this.logger.log(`Sub ${subId} → plan ${newPlanId}, renovada hasta ${newFechaFin.toISOString().slice(0, 10)}`);
    } catch (err) {
      this.logger.error('Error procesando webhook MP', err);
    }
  }

  async getPortal(clinicaId: string) {
    const sub = await this.subscriptionsService.findByClinica(clinicaId);
    if (!sub) return null;

    const isTrial = !!sub.trial_ends_at && new Date(sub.trial_ends_at) >= new Date();
    const endDate = isTrial ? sub.trial_ends_at : sub.fecha_fin;
    const remaining = Math.max(
      0,
      Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000),
    );

    return {
      estado: sub.estado,
      plan: sub.plan,
      fecha_fin: sub.fecha_fin,
      trial_ends_at: sub.trial_ends_at,
      auto_renew: sub.auto_renew,
      remaining_days: remaining,
      needs_renewal: remaining <= 7,
      is_trial: isTrial,
    };
  }
}
