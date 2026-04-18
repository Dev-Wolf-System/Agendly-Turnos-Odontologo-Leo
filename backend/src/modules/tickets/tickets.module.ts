import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './entities/ticket.entity';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { AdminNotificacionesModule } from '../admin/admin-notificaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), AdminNotificacionesModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
