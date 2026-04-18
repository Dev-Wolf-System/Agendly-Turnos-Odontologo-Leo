import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PlansModule } from '../plans/plans.module';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [SubscriptionsModule, PlansModule],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
