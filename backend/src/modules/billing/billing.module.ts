import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PlansModule } from '../plans/plans.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { Pago } from '../pagos/entities/pago.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, Turno]),
    SubscriptionsModule,
    PlansModule,
    NotificacionesModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingModule {}
