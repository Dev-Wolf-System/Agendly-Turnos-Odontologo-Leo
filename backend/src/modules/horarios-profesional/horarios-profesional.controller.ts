import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { HorarioProfesionalService } from './horarios-profesional.service';
import { UpsertHorarioProfesionalDto } from './dto/upsert-horario-profesional.dto';
import { CurrentClinica, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('horarios-profesional')
export class HorarioProfesionalController {
  constructor(
    private readonly horarioProfService: HorarioProfesionalService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TURNOS_ONLY)
  findAll(@CurrentClinica() clinicaId: string) {
    return this.horarioProfService.findByClinica(clinicaId);
  }

  @Get(':userId')
  findByUser(
    @CurrentClinica() clinicaId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.horarioProfService.findByUser(clinicaId, userId);
  }

  @Get(':userId/efectivos')
  getEfectivos(
    @CurrentClinica() clinicaId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.horarioProfService.getHorariosEfectivos(clinicaId, userId);
  }

  @Put()
  @Roles(UserRole.ADMIN, UserRole.TURNOS_ONLY)
  upsert(
    @CurrentClinica() clinicaId: string,
    @Body() dto: UpsertHorarioProfesionalDto,
  ) {
    return this.horarioProfService.upsert(clinicaId, dto);
  }

  @Delete(':userId')
  @Roles(UserRole.ADMIN, UserRole.TURNOS_ONLY)
  remove(
    @CurrentClinica() clinicaId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.horarioProfService.remove(clinicaId, userId);
  }
}
