import { Controller, Post, Get, Body, Headers, SetMetadata, Req, HttpCode } from '@nestjs/common';
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

  @Get('portal')
  getPortal(@CurrentClinica() clinicaId: string) {
    return this.billingService.getPortal(clinicaId);
  }
}
