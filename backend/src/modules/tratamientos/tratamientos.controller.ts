import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { TratamientosService } from './tratamientos.service';
import { CreateTratamientoDto } from './dto/create-tratamiento.dto';
import { UpdateTratamientoDto } from './dto/update-tratamiento.dto';
import { CurrentClinica } from '../../common/decorators';

@Controller('tratamientos')
export class TratamientosController {
  constructor(private readonly tratamientosService: TratamientosService) {}

  @Get()
  findAll(@CurrentClinica() clinicaId: string) {
    return this.tratamientosService.findAll(clinicaId);
  }

  @Get('activos')
  findActive(@CurrentClinica() clinicaId: string) {
    return this.tratamientosService.findActive(clinicaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.tratamientosService.findOne(id, clinicaId);
  }

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @Body() dto: CreateTratamientoDto,
  ) {
    return this.tratamientosService.create(clinicaId, dto);
  }

  @Post('seed/:especialidad')
  seed(
    @CurrentClinica() clinicaId: string,
    @Param('especialidad') especialidad: string,
  ) {
    return this.tratamientosService.seedDefaults(clinicaId, especialidad);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
    @Body() dto: UpdateTratamientoDto,
  ) {
    return this.tratamientosService.update(id, clinicaId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.tratamientosService.remove(id, clinicaId);
  }
}
