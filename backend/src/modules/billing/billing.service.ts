import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import * as crypto from 'crypto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { EstadoSubscription } from '../../common/enums';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly mp: MercadoPagoConfig;

  constructor(
    private readonly config: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    this.mp = new MercadoPagoConfig({
      accessToken: this.config.getOrThrow<string>('MP_ACCESS_TOKEN'),
    });
  }

  async createCheckout(clinicaId: string): Promise<{ checkout_url: string }> {
    const sub = await this.subscriptionsService.findByClinica(clinicaId);
    if (!sub?.plan) throw new Error('Suscripción o plan no encontrado');

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const backendUrl = this.config.get<string>('BACKEND_URL', 'https://api.avaxhealth.com/api');

    const preference = new Preference(this.mp);
    const result = await preference.create({
      body: {
        items: [
          {
            id: sub.plan_id,
            title: `Suscripción ${sub.plan.nombre} — Avax Health`,
            quantity: 1,
            unit_price: Number(sub.plan.precio_mensual),
            currency_id: 'ARS',
          },
        ],
        external_reference: `sub_${sub.id}`,
        back_urls: {
          success: `${frontendUrl}/billing/success`,
          failure: `${frontendUrl}/billing/failure`,
          pending: `${frontendUrl}/billing/success`,
        },
        auto_return: 'approved',
        notification_url: `${backendUrl}/billing/webhook`,
      },
    });

    const url =
      (this.config.get('NODE_ENV') === 'production'
        ? result.init_point
        : result.sandbox_init_point) ?? result.init_point ?? '';

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
        const manifest = `id:${body.data?.id};request-id:${requestId};ts:${ts};`;
        const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
        if (expected !== v1) {
          this.logger.warn('Webhook MP: firma inválida, ignorando');
          return;
        }
      }
    }

    if (body.type !== 'payment') return;

    try {
      const payment = new Payment(this.mp);
      const paymentData = await payment.get({ id: body.data.id });

      if (paymentData.status !== 'approved') return;

      const externalRef = paymentData.external_reference;
      if (!externalRef?.startsWith('sub_')) return;

      const subId = externalRef.replace('sub_', '');
      const sub = await this.subscriptionsService.findOne(subId);

      // Extender desde fecha_fin actual si es futura, o desde hoy
      const base = new Date(sub.fecha_fin) > new Date() ? new Date(sub.fecha_fin) : new Date();
      const newFechaFin = new Date(base);
      newFechaFin.setMonth(newFechaFin.getMonth() + 1);

      await this.subscriptionsService.update(subId, {
        estado: EstadoSubscription.ACTIVA,
        fecha_fin: newFechaFin,
        trial_ends_at: undefined,
        external_reference: String(paymentData.id),
      });

      this.logger.log(`Sub ${subId} renovada hasta ${newFechaFin.toISOString().slice(0, 10)}`);
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
