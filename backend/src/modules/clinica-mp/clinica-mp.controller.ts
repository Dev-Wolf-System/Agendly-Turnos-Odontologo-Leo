import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ClinicaMpService } from './clinica-mp.service';
import { UpsertClinicaMpDto } from './dto/upsert-clinica-mp.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CurrentUser } from '../../common/decorators';

// ── Rutas para la clínica (admin de clínica gestiona sus propias credenciales) ──
@Controller('clinica-mp')
export class ClinicaMpController {
  constructor(private readonly service: ClinicaMpService) {}

  @Get('status')
  getStatus(@CurrentUser() user: any) {
    return this.service.getStatus(user.clinica_id);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  upsert(@CurrentUser() user: any, @Body() dto: UpsertClinicaMpDto) {
    return this.service.upsert(user.clinica_id, dto);
  }

  @Patch('webhook')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateWebhook(@CurrentUser() user: any, @Body() dto: UpdateWebhookDto) {
    return this.service.updateWebhook(user.clinica_id, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: any) {
    return this.service.remove(user.clinica_id);
  }
}

// ── Rutas para superadmin (gestiona MP de cualquier clínica) ──
@Controller('admin/clinicas/:clinicaId/mp')
@UseGuards(SuperAdminGuard)
export class AdminClinicaMpController {
  constructor(private readonly service: ClinicaMpService) {}

  @Get()
  getStatus(@Param('clinicaId', ParseUUIDPipe) clinicaId: string) {
    return this.service.getStatus(clinicaId);
  }

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  upsert(
    @Param('clinicaId', ParseUUIDPipe) clinicaId: string,
    @Body() dto: UpsertClinicaMpDto,
  ) {
    return this.service.upsert(clinicaId, dto);
  }

  @Patch('webhook')
  @HttpCode(HttpStatus.NO_CONTENT)
  updateWebhook(
    @Param('clinicaId', ParseUUIDPipe) clinicaId: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.service.updateWebhook(clinicaId, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('clinicaId', ParseUUIDPipe) clinicaId: string) {
    return this.service.remove(clinicaId);
  }
}
