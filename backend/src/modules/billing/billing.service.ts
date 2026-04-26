import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Preference, Payment, PreApproval } from 'mercadopago';
import * as crypto from 'crypto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PlansService } from '../plans/plans.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { ClinicaMpService } from '../clinica-mp/clinica-mp.service';
import { Pago } from '../pagos/entities/pago.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { EstadoSubscription, EstadoPago, TipoNotificacion } from '../../common/enums';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly mp: MercadoPagoConfig;

  constructor(
    private readonly config: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly plansService: PlansService,
    private readonly notificacionesService: NotificacionesService,
    private readonly clinicaMpService: ClinicaMpService,
    @InjectRepository(Pago)
    private readonly pagoRepo: Repository<Pago>,
    @InjectRepository(Turno)
    private readonly turnoRepo: Repository<Turno>,
    @InjectRepository(Tratamiento)
    private readonly tratamientoRepo: Repository<Tratamiento>,
    @InjectRepository(Clinica)
    private readonly clinicaRepo: Repository<Clinica>,
  ) {
    this.mp = new MercadoPagoConfig({
      accessToken: this.config.getOrThrow<string>('MP_ACCESS_TOKEN'),
    });
  }

  private getMpForClinica(accessToken: string): MercadoPagoConfig {
    return new MercadoPagoConfig({ accessToken });
  }

  async createCheckout(clinicaId: string, planId?: string): Promise<{ checkout_url: string }> {
    const sub = await this.subscriptionsService.findByClinica(clinicaId);
    if (!sub) throw new BadRequestException('No se encontró suscripción para esta clínica');

    const targetPlanId = planId ?? (sub.plan?.is_default_trial ? null : sub.plan_id);
    if (!targetPlanId) {
      throw new BadRequestException('Seleccioná un plan para continuar');
    }

    const plan = planId ? await this.plansService.findOne(targetPlanId) : sub.plan;
    if (!plan) throw new BadRequestException('Plan no encontrado');

    const precio = Number(plan.precio_mensual);
    if (precio <= 0) throw new BadRequestException('El plan seleccionado no tiene un precio válido');

    // Cancelar preapproval anterior si existe
    if (sub.preapproval_id) {
      await this.cancelPreapprovalInMp(sub.preapproval_id);
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const backendUrl = this.config.get<string>('BACKEND_URL', 'https://api.avaxhealth.com/api');

    const externalRef = `sub_${sub.id}_plan_${targetPlanId}`;

    const preapproval = new PreApproval(this.mp);
    const result = await preapproval.create({
      body: {
        reason: `Suscripción ${plan.nombre} — Avax Health`,
        external_reference: externalRef,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: precio,
          currency_id: 'ARS',
        },
        back_url: `${frontendUrl}/billing/success`,
      },
    });

    if (result.id) {
      await this.subscriptionsService.update(sub.id, {
        preapproval_id: result.id,
        auto_renew: true,
      });
    }

    return { checkout_url: result.init_point ?? '' };
  }

  /** Checkout público para clínicas recién registradas (sin JWT) — solo estado Pendiente */
  async createCheckoutRegistro(clinicaId: string, planId: string, payerEmail: string): Promise<{ checkout_url: string }> {
    const clinica = await this.clinicaRepo.findOne({ where: { id: clinicaId } });
    if (!clinica) throw new NotFoundException('Clínica no encontrada');
    if (clinica.estado_aprobacion !== 'Pendiente') {
      throw new BadRequestException('Este endpoint es solo para clínicas pendientes de activación');
    }

    const plan = await this.plansService.findOne(planId);
    if (!plan) throw new BadRequestException('Plan no encontrado');

    const precio = Number(plan.precio_mensual);
    if (precio <= 0) throw new BadRequestException('El plan seleccionado no tiene un precio válido');

    const sub = await this.subscriptionsService.findByClinica(clinicaId);
    if (!sub) throw new BadRequestException('No se encontró suscripción para esta clínica');

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');

    const preapproval = new PreApproval(this.mp);
    let result;
    try {
      result = await preapproval.create({
        body: {
          reason: `Suscripción ${plan.nombre} — Avax Health`,
          external_reference: `sub_${sub.id}_plan_${planId}`,
          payer_email: payerEmail,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: precio,
            currency_id: 'ARS',
          },
          back_url: `${frontendUrl}/bienvenida?status=success`,
        },
      });
    } catch (err: any) {
      const mpError = err?.cause ?? err;
      this.logger.error(`Error creando PreApproval en MP: ${JSON.stringify(mpError)}`);
      throw new BadRequestException(
        `MP error: ${mpError?.message ?? JSON.stringify(mpError)}`,
      );
    }

    if (!result.init_point) {
      throw new BadRequestException('Mercado Pago no devolvió una URL de pago válida.');
    }

    // Guardar preapproval_id de forma no bloqueante — la columna puede no existir aún
    if (result.id) {
      this.subscriptionsService.update(sub.id, {
        preapproval_id: result.id,
        auto_renew: true,
      }).catch((err) => this.logger.warn(`No se pudo guardar preapproval_id: ${err?.message}`));
    }

    return { checkout_url: result.init_point };
  }

  async getLinkPagoPago(
    pagoId: string,
    clinicaId: string,
  ): Promise<{ checkout_url: string; pago_id: string; monto: number }> {
    const pago = await this.pagoRepo.findOne({
      where: { id: pagoId },
      relations: ['turno'],
    });

    if (!pago) throw new NotFoundException('Pago no encontrado');
    if (pago.turno?.clinica_id !== clinicaId) throw new ForbiddenException('No autorizado');
    if (pago.estado !== EstadoPago.PENDIENTE) {
      throw new BadRequestException('El pago no está en estado pendiente');
    }

    const monto = Number(pago.total);
    if (!monto || monto <= 0) throw new BadRequestException('El pago no tiene un monto válido');

    const mpConfig = await this.clinicaMpService.findByClinica(clinicaId);
    if (!mpConfig) throw new BadRequestException('La clínica no tiene Mercado Pago configurado');

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const backendUrl = this.config.get<string>('BACKEND_URL', 'https://api.avaxhealth.com/api');

    const preference = new Preference(this.getMpForClinica(mpConfig.access_token));
    const result = await preference.create({
      body: {
        items: [
          {
            id: pago.id,
            title: 'Pago de turno — Avax Health',
            quantity: 1,
            unit_price: monto,
            currency_id: 'ARS',
          },
        ],
        external_reference: `pago_${pago.id}`,
        back_urls: {
          success: `${frontendUrl}/billing/success`,
          failure: `${frontendUrl}/billing/failure`,
          pending: `${frontendUrl}/billing/success`,
        },
        auto_return: 'approved',
        notification_url: `${backendUrl}/billing/webhook/clinica/${clinicaId}`,
      },
    });

    const isProduction = this.config.get('NODE_ENV') === 'production';
    const url = (isProduction ? result.init_point : result.sandbox_init_point) ?? result.init_point ?? '';

    return { checkout_url: url, pago_id: pago.id, monto };
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

    // ── Preapproval autorizado (el usuario aceptó el débito automático en MP) ──
    if (body.type === 'subscription_preapproval') {
      const preapprovalId = body?.data?.id;
      if (preapprovalId) {
        try {
          const preapproval = new PreApproval(this.mp);
          const pa = await preapproval.get({ id: String(preapprovalId) });

          const extRef = pa.external_reference ?? '';
          const subMatch = extRef.match(/^sub_([^_]+(?:_[^_]+)*?)_plan_(.+)$/);
          if (!subMatch) {
            this.logger.warn(`subscription_preapproval: external_reference inválido: ${extRef}`);
            return;
          }

          const [, subId, planId] = subMatch;

          // Siempre persistir el preapproval_id
          await this.subscriptionsService.update(subId, { preapproval_id: String(preapprovalId) });

          // Activar suscripción y auto-aprobar clínica cuando MP confirma autorización
          if (pa.status === 'authorized') {
            const now = new Date();
            const fechaFin = new Date(now);
            fechaFin.setMonth(fechaFin.getMonth() + 1);

            await this.subscriptionsService.update(subId, {
              estado: EstadoSubscription.ACTIVA,
              plan_id: planId,
              fecha_inicio: now,
              fecha_fin: fechaFin,
              trial_ends_at: null as any,
              auto_renew: true,
            });

            const sub = await this.subscriptionsService.findOne(subId);
            const clinicaId = (sub as any).clinica_id;
            if (clinicaId) {
              const clinica = await this.clinicaRepo.findOne({ where: { id: clinicaId } });
              if (clinica?.estado_aprobacion === 'Pendiente') {
                await this.clinicaRepo.update(clinicaId, { estado_aprobacion: 'Aprobado' });
                this.logger.log(`Clínica ${clinicaId} auto-aprobada — preapproval ${preapprovalId} autorizado`);
              }
            }

            this.logger.log(`Sub ${subId} activada — preapproval ${preapprovalId} authorized`);
          }
        } catch (err) {
          this.logger.warn(`Error procesando subscription_preapproval: ${err}`);
        }
      }
      return;
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

      // ── Pago de turno ──
      if (externalRef.startsWith('pago_')) {
        const pagoId = externalRef.replace('pago_', '');
        await this.pagoRepo.update(pagoId, {
          estado: EstadoPago.APROBADO,
          external_reference: String(paymentData.id),
        });

        const pagoCompleto = await this.pagoRepo.findOne({
          where: { id: pagoId },
          relations: ['turno'],
        });
        if (pagoCompleto?.turno?.clinica_id) {
          const paciente = (pagoCompleto.turno as any)?.paciente;
          const nombrePaciente = paciente
            ? `${paciente.nombre} ${paciente.apellido}`
            : 'Paciente';
          await this.notificacionesService.crear(
            pagoCompleto.turno.clinica_id,
            TipoNotificacion.PAGO_APROBADO,
            'Pago aprobado',
            `${nombrePaciente} — $${Number(pagoCompleto.total).toLocaleString('es-AR')} aprobado vía Mercado Pago`,
            { pago_id: pagoCompleto.id, turno_id: pagoCompleto.turno_id },
          );
        }

        this.logger.log(`Pago de turno ${pagoId} aprobado — MP ID ${paymentData.id}`);
        return;
      }

      // ── Pago de suscripción ── formato: sub_{subId}_plan_{planId}
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

      const clinicaId = (sub as any).clinica_id;

      // Auto-aprobar clínica si estaba pendiente (registro con pago directo)
      if (clinicaId) {
        const clinica = await this.clinicaRepo.findOne({ where: { id: clinicaId } });
        if (clinica?.estado_aprobacion === 'Pendiente') {
          await this.clinicaRepo.update(clinicaId, { estado_aprobacion: 'Aprobado' });
          this.logger.log(`Clínica ${clinicaId} auto-aprobada tras pago de suscripción`);
        }
      }

      if (clinicaId) {
        const plan = await this.plansService.findOne(newPlanId).catch(() => null);
        await this.notificacionesService.crear(
          clinicaId,
          TipoNotificacion.INFO,
          'Suscripción renovada',
          `Plan ${plan?.nombre ?? newPlanId} activo hasta ${newFechaFin.toLocaleDateString('es-AR')}`,
          { sub_id: subId },
        );
      }

      this.logger.log(`Sub ${subId} → plan ${newPlanId}, renovada hasta ${newFechaFin.toISOString().slice(0, 10)}`);
    } catch (err) {
      this.logger.error('Error procesando webhook MP', err);
    }
  }

  /** Webhook para pagos de turnos — verifica con el token de la clínica */
  async processWebhookClinica(
    body: any,
    signature: string,
    requestId: string,
    clinicaId: string,
  ): Promise<void> {
    if (body.type !== 'payment') return;

    const dataId = body?.data?.id;
    if (!dataId) return;

    try {
      const mpConfig = await this.clinicaMpService.findByClinica(clinicaId);
      if (!mpConfig) {
        this.logger.warn(`Webhook clinica ${clinicaId}: sin config MP, ignorando`);
        return;
      }

      const payment = new Payment(this.getMpForClinica(mpConfig.access_token));
      const paymentData = await payment.get({ id: String(dataId) });

      if (paymentData.status !== 'approved') {
        this.logger.log(`Webhook clinica ${clinicaId}: pago ${dataId} con estado ${paymentData.status}, ignorando`);
        return;
      }

      const externalRef = paymentData.external_reference ?? '';
      if (!externalRef.startsWith('pago_')) {
        this.logger.warn(`Webhook clinica: external_reference inesperado: ${externalRef}`);
        return;
      }

      const pagoId = externalRef.replace('pago_', '');
      await this.pagoRepo.update(pagoId, {
        estado: EstadoPago.APROBADO,
        external_reference: String(paymentData.id),
      });

      const pagoCompleto = await this.pagoRepo.findOne({
        where: { id: pagoId },
        relations: ['turno'],
      });

      if (pagoCompleto?.turno?.clinica_id) {
        const paciente = (pagoCompleto.turno as any)?.paciente;
        const nombrePaciente = paciente
          ? `${paciente.nombre} ${paciente.apellido}`
          : 'Paciente';
        await this.notificacionesService.crear(
          pagoCompleto.turno.clinica_id,
          TipoNotificacion.PAGO_APROBADO,
          'Pago aprobado',
          `${nombrePaciente} — $${Number(pagoCompleto.total).toLocaleString('es-AR')} aprobado vía Mercado Pago`,
          { pago_id: pagoCompleto.id, turno_id: pagoCompleto.turno_id },
        );
      }

      this.logger.log(`Webhook clinica ${clinicaId}: pago turno ${pagoId} aprobado — MP ID ${paymentData.id}`);
    } catch (err) {
      this.logger.error(`Error procesando webhook clinica ${clinicaId}`, err);
    }
  }

  async getLinkPagoTurno(
    turnoId: string,
    clinicaId: string,
  ): Promise<{ checkout_url: string; pago_id: string; monto: number }> {
    const turno = await this.turnoRepo.findOne({
      where: { id: turnoId, clinica_id: clinicaId },
      relations: ['paciente', 'pagos'],
    });
    if (!turno) throw new NotFoundException('Turno no encontrado');

    let pago = turno.pagos?.find((p) => p.estado === EstadoPago.PENDIENTE) ?? null;

    if (!pago) {
      let precio: number | null = null;
      if (turno.tipo_tratamiento) {
        const tratamiento = await this.tratamientoRepo.findOne({
          where: { clinica_id: clinicaId, nombre: turno.tipo_tratamiento, activo: true },
          select: ['precio_base'],
        });
        if (tratamiento?.precio_base) precio = Number(tratamiento.precio_base);
      }
      if (!precio || precio <= 0) {
        throw new BadRequestException(
          'El turno no tiene un precio asociado. Asigná un tratamiento con precio primero.',
        );
      }
      pago = this.pagoRepo.create({ turno_id: turnoId, total: precio, estado: EstadoPago.PENDIENTE, method: 'mercadopago' });
      pago = await this.pagoRepo.save(pago);
    }

    if (!pago.total || Number(pago.total) <= 0) {
      throw new BadRequestException('El pago no tiene un monto válido');
    }

    const mpConfig = await this.clinicaMpService.findByClinica(clinicaId);
    if (!mpConfig) {
      throw new BadRequestException('La clínica no tiene Mercado Pago configurado. Configuralo en Ajustes → Pagos.');
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const backendUrl = this.config.get<string>('BACKEND_URL', 'https://api.avaxhealth.com/api');
    const pacienteNombre = turno.paciente
      ? `${turno.paciente.nombre} ${turno.paciente.apellido}`
      : 'Paciente';

    const preference = new Preference(this.getMpForClinica(mpConfig.access_token));
    const result = await preference.create({
      body: {
        items: [{
          id: turnoId,
          title: `Turno — ${turno.tipo_tratamiento ?? 'Consulta'} — ${pacienteNombre}`,
          quantity: 1,
          unit_price: Number(pago.total),
          currency_id: 'ARS',
        }],
        external_reference: `pago_${pago.id}`,
        back_urls: {
          success: `${frontendUrl}/billing/success`,
          failure: `${frontendUrl}/billing/failure`,
          pending: `${frontendUrl}/billing/success`,
        },
        auto_return: 'approved',
        notification_url: `${backendUrl}/billing/webhook/clinica/${clinicaId}`,
      },
    });

    const isProduction = this.config.get('NODE_ENV') === 'production';
    const checkout_url =
      (isProduction ? result.init_point : result.sandbox_init_point) ?? result.init_point ?? '';

    this.logger.log(`Link de pago (turno) generado — turno ${turnoId}, pago ${pago.id}`);

    if (mpConfig.webhook_activo && mpConfig.webhook_url) {
      fetch(mpConfig.webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turno_id: turnoId,
          pago_id: pago.id,
          paciente: pacienteNombre,
          tratamiento: turno.tipo_tratamiento ?? 'Consulta',
          monto: Number(pago.total),
          link_pago: checkout_url,
        }),
      }).catch((err) => this.logger.warn(`Webhook pago fallido: ${err.message}`));
    }

    return { checkout_url, pago_id: pago.id, monto: Number(pago.total) };
  }

  async cancelSubscription(clinicaId: string): Promise<void> {
    const sub = await this.subscriptionsService.findByClinica(clinicaId);
    if (!sub) throw new NotFoundException('No se encontró suscripción');

    if (sub.preapproval_id) {
      await this.cancelPreapprovalInMp(sub.preapproval_id);
    }

    await this.subscriptionsService.update(sub.id, {
      estado: EstadoSubscription.CANCELADA,
      preapproval_id: null as any,
      auto_renew: false,
    });

    this.logger.log(`Suscripción ${sub.id} cancelada — clínica ${clinicaId}`);
  }

  private async cancelPreapprovalInMp(preapprovalId: string): Promise<void> {
    try {
      const preapproval = new PreApproval(this.mp);
      await preapproval.update({ id: preapprovalId, body: { status: 'cancelled' } });
      this.logger.log(`PreApproval ${preapprovalId} cancelado en MP`);
    } catch (err) {
      this.logger.warn(`No se pudo cancelar PreApproval ${preapprovalId} en MP: ${err}`);
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
