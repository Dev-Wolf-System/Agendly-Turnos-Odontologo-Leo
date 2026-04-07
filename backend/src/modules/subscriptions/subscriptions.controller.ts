import { Controller, Get } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentClinica } from '../../common/decorators';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('mi-suscripcion')
  findMiSuscripcion(@CurrentClinica() clinicaId: string) {
    return this.subscriptionsService.findByClinica(clinicaId);
  }

  @Get('usage')
  getUsage(@CurrentClinica() clinicaId: string) {
    return this.subscriptionsService.getUsage(clinicaId);
  }
}
