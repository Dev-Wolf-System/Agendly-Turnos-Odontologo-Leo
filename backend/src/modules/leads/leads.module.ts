import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { AdminNotificacionesModule } from '../admin/admin-notificaciones.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), AdminNotificacionesModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
