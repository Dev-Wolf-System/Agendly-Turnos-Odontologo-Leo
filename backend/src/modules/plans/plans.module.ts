import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plan } from './entities/plan.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, Subscription])],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService, TypeOrmModule],
})
export class PlansModule {}
