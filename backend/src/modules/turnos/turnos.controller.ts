import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TurnosService } from './turnos.service';
import { CreateTurnoDto } from './dto/create-turno.dto';
import { UpdateTurnoDto } from './dto/update-turno.dto';
import { CurrentClinica } from '../../common/decorators';
import { EstadoTurno } from '../../common/enums';

@Controller('turnos')
export class TurnosController {
  constructor(private readonly turnosService: TurnosService) {}

  @Get()
  findAll(
    @CurrentClinica() clinicaId: string,
    @Query('fecha') fecha?: string,
    @Query('fecha_desde') fechaDesde?: string,
    @Query('fecha_hasta') fechaHasta?: string,
    @Query('estado') estado?: EstadoTurno,
    @Query('user_id') userId?: string,
  ) {
    return this.turnosService.findAll(clinicaId, {
      fecha,
      fecha_desde: fechaDesde,
      fecha_hasta: fechaHasta,
      estado,
      user_id: userId,
    });
  }

  @Get('today/count')
  countToday(@CurrentClinica() clinicaId: string) {
    return this.turnosService.countToday(clinicaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.turnosService.findOne(id, clinicaId);
  }

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @Body() createTurnoDto: CreateTurnoDto,
  ) {
    return this.turnosService.create(clinicaId, createTurnoDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
    @Body() updateTurnoDto: UpdateTurnoDto,
  ) {
    return this.turnosService.update(id, clinicaId, updateTurnoDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.turnosService.remove(id, clinicaId);
  }
}
