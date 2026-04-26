import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PlansModule } from '../plans/plans.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ClinicaMpModule } from '../clinica-mp/clinica-mp.module';
import { Pago } from '../pagos/entities/pago.entity';
import { Turno } from '../turnos/entities/turno.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { User } from '../users/entities/user.entity';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pago, Turno, Tratamiento, Clinica, User]),
    SubscriptionsModule,
    PlansModule,
    NotificacionesModule,
    ClinicaMpModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
