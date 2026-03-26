import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { HistorialMedico } from '../historial-medico/entities/historial-medico.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { TurnosService } from './turnos.service';
import { TurnosController } from './turnos.controller';
import { WebhookService } from '../../common/services/webhook.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Turno, Pago, HistorialMedico, Clinica]),
    NotificacionesModule,
  ],
  controllers: [TurnosController],
  providers: [TurnosService, WebhookService],
  exports: [TurnosService],
})
export class TurnosModule {}
