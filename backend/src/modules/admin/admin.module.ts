import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminClinicasController } from './admin-clinicas.controller';
import { AdminPlansController } from './admin-plans.controller';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { Subscription } from '../subscriptions/entities/subscription.entity';
import { Plan } from '../plans/entities/plan.entity';
import { User } from '../users/entities/user.entity';
import { Paciente } from '../pacientes/entities/paciente.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { PlansModule } from '../plans/plans.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Clinica, Subscription, Plan, User, Paciente, Turno]),
    PlansModule,
    SubscriptionsModule,
    BillingModule,
  ],
  controllers: [
    AdminClinicasController,
    AdminPlansController,
    AdminSubscriptionsController,
    AdminDashboardController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
