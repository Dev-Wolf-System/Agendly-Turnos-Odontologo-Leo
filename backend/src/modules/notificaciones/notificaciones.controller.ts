import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';
import { CurrentClinica } from '../../common/decorators';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(
    private readonly notificacionesService: NotificacionesService,
  ) {}

  @Get()
  findAll(@CurrentClinica() clinicaId: string) {
    return this.notificacionesService.findAll(clinicaId);
  }

  @Get('sin-leer')
  findUnread(@CurrentClinica() clinicaId: string) {
    return this.notificacionesService.findUnread(clinicaId);
  }

  @Get('count')
  async countUnread(@CurrentClinica() clinicaId: string) {
    const count = await this.notificacionesService.countUnread(clinicaId);
    return { count };
  }

  @Patch('leer-todas')
  markAllAsRead(@CurrentClinica() clinicaId: string) {
    return this.notificacionesService.markAllAsRead(clinicaId);
  }

  @Patch(':id/leer')
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.notificacionesService.markAsRead(id, clinicaId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.notificacionesService.remove(id, clinicaId);
  }
}
