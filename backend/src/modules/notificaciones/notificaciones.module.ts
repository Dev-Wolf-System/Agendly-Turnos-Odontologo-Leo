import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesController } from './notificaciones.controller';
import { NotificacionesService } from './notificaciones.service';
import { Notificacion } from './entities/notificacion.entity';
import { Inventario } from '../inventario/entities/inventario.entity';
import { Turno } from '../turnos/entities/turno.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notificacion, Inventario, Turno])],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
