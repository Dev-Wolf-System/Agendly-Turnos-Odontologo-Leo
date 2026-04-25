import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Turno } from './entities/turno.entity';
import { Pago } from '../pagos/entities/pago.entity';
import { HistorialMedico } from '../historial-medico/entities/historial-medico.entity';
import { Clinica } from '../clinicas/entities/clinica.entity';
import { Tratamiento } from '../tratamientos/entities/tratamiento.entity';
import { TurnosService } from './turnos.service';
import { TurnosController } from './turnos.controller';
import { WebhookService } from '../../common/services/webhook.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';
import { ListaEsperaModule } from '../lista-espera/lista-espera.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Turno, Pago, HistorialMedico, Clinica, Tratamiento]),
    NotificacionesModule,
    ListaEsperaModule,
  ],
  controllers: [TurnosController],
  providers: [TurnosService, WebhookService],
  exports: [TurnosService],
})
export class TurnosModule {}
