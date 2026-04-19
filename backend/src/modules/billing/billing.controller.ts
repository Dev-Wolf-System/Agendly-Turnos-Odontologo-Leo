import { Controller, Post, Get, Body, Headers, SetMetadata, Req, HttpCode, Param, ParseUUIDPipe } from '@nestjs/common';
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
  @Get('link-pago/:pagoId')
  getLinkPagoPago(
    @Param('pagoId', ParseUUIDPipe) pagoId: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.billingService.getLinkPagoPago(pagoId, clinicaId);
  }

  @Get('portal')
  getPortal(@CurrentClinica() clinicaId: string) {
    return this.billingService.getPortal(clinicaId);
  }
}
