import { Controller, Get, Patch, Delete, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { AdminNotificacionesService } from './admin-notificaciones.service';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

@Controller('admin/notificaciones')
@UseGuards(SuperAdminGuard)
export class AdminNotificacionesController {
  constructor(private readonly service: AdminNotificacionesService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('count')
  count() {
    return this.service.countUnread().then((count) => ({ count }));
  }

  @Patch('leer-todas')
  markAllAsRead() {
    return this.service.markAllAsRead();
  }

  @Patch(':id/leer')
  markAsRead(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.markAsRead(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
