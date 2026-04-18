import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [SubscriptionsModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
