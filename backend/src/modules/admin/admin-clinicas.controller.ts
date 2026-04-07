import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { AdminService } from './admin.service';
import { UpdateClinicaAdminDto } from './dto/update-clinica-admin.dto';

@Controller('admin/clinicas')
@UseGuards(SuperAdminGuard)
export class AdminClinicasController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  findAll(
    @Query('is_active') isActive?: string,
    @Query('plan_id') planId?: string,
    @Query('search') search?: string,
    @Query('estado_aprobacion') estadoAprobacion?: string,
  ) {
    return this.adminService.findAllClinicas({
      is_active: isActive,
      plan_id: planId,
      search,
      estado_aprobacion: estadoAprobacion,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminService.findClinicaById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClinicaAdminDto) {
    return this.adminService.updateClinica(id, dto);
  }

  @Delete(':id')
  softDelete(@Param('id') id: string) {
    return this.adminService.softDeleteClinica(id);
  }

  @Patch(':id/aprobar')
  aprobar(@Param('id') id: string) {
    return this.adminService.aprobarClinica(id);
  }

  @Patch(':id/rechazar')
  rechazar(@Param('id') id: string) {
    return this.adminService.rechazarClinica(id);
  }
}
