import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminNotificacion } from './entities/admin-notificacion.entity';
import { AdminNotificacionesService } from './admin-notificaciones.service';
import { AdminNotificacionesController } from './admin-notificaciones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AdminNotificacion])],
  controllers: [AdminNotificacionesController],
  providers: [AdminNotificacionesService],
  exports: [AdminNotificacionesService],
})
export class AdminNotificacionesModule {}
