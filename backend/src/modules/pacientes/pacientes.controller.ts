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
import { PacientesService } from './pacientes.service';
import { CreatePacienteDto } from './dto/create-paciente.dto';
import { UpdatePacienteDto } from './dto/update-paciente.dto';
import { CurrentClinica } from '../../common/decorators';

@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Get()
  findAll(
    @CurrentClinica() clinicaId: string,
    @Query('search') search?: string,
  ) {
    return this.pacientesService.findAll(clinicaId, search);
  }

  @Get('count')
  count(@CurrentClinica() clinicaId: string) {
    return this.pacientesService.count(clinicaId);
  }

  @Get(':id/ficha')
  getFicha(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.pacientesService.getFicha(id, clinicaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.pacientesService.findOne(id, clinicaId);
  }

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @Body() createPacienteDto: CreatePacienteDto,
  ) {
    return this.pacientesService.create(clinicaId, createPacienteDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
    @Body() updatePacienteDto: UpdatePacienteDto,
  ) {
    return this.pacientesService.update(id, clinicaId, updatePacienteDto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.pacientesService.remove(id, clinicaId);
  }
}
