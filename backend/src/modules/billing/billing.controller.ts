import { Controller, Post, Get, Delete, Body, Headers, SetMetadata, Req, HttpCode, Param, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { Public, CurrentClinica } from '../../common/decorators';
import { IS_WRITE_OPERATION } from '../../common/guards/subscription.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @SetMetadata(IS_WRITE_OPERATION, false)
  @Post('checkout')
  createCheckout(
    @CurrentClinica() clinicaId: string,
    @Body() body: { planId?: string },
  ) {
    return this.billingService.createCheckout(clinicaId, body?.planId);
  }

  /** Checkout público para clínicas recién registradas con plan pago (sin JWT) */
  @Public()
  @Post('checkout-registro')
  createCheckoutRegistro(@Body() body: { clinica_id: string; plan_id: string; email: string }) {
    if (!body?.clinica_id || !body?.plan_id || !body?.email) {
      throw new BadRequestException('clinica_id, plan_id y email son requeridos');
    }
    return this.billingService.createCheckoutRegistro(body.clinica_id, body.plan_id, body.email);
  }

  @Public()
  @Get('webhook')
  webhookHealthCheck() {
    return { ok: true };
  }

  /** Webhook para pagos de suscripción (usa token global del SaaS) */
  @Public()
  @HttpCode(200)
  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Req() _req: Request,
  ) {
    await this.billingService.processWebhook(body, signature, requestId);
    return { ok: true };
  }

  /** Webhook para pagos de turnos (usa token de la clínica) */
  @Public()
  @Get('webhook/clinica/:clinicaId')
  webhookClinicaHealthCheck() {
    return { ok: true };
  }

  @Public()
  @HttpCode(200)
  @Post('webhook/clinica/:clinicaId')
  async handleWebhookClinica(
    @Param('clinicaId', ParseUUIDPipe) clinicaId: string,
    @Body() body: any,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
  ) {
    await this.billingService.processWebhookClinica(body, signature, requestId, clinicaId);
    return { ok: true };
  }

  @SetMetadata(IS_WRITE_OPERATION, false)
  @Get('link-pago/turno/:turnoId')
  getLinkPagoTurno(
    @Param('turnoId', ParseUUIDPipe) turnoId: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.billingService.getLinkPagoTurno(turnoId, clinicaId);
  }

  @SetMetadata(IS_WRITE_OPERATION, false)
  @Get('link-pago/:pagoId')
  getLinkPagoPago(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.billingService.getLinkPagoPago(pagoId, clinicaId);
  }

  @SetMetadata(IS_WRITE_OPERATION, false)
  @Delete('subscribe')
  cancelSubscription(@CurrentClinica() clinicaId: string) {
    return this.billingService.cancelSubscription(clinicaId);
  }

  @Get('portal')
  getPortal(@CurrentClinica() clinicaId: string) {
    return this.billingService.getPortal(clinicaId);
  }
}
