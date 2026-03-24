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
import { HistorialMedicoService } from './historial-medico.service';
import { CreateHistorialMedicoDto } from './dto/create-historial-medico.dto';
import { UpdateHistorialMedicoDto } from './dto/update-historial-medico.dto';
import { CurrentClinica } from '../../common/decorators';

@Controller('historial-medico')
export class HistorialMedicoController {
  constructor(private readonly historialService: HistorialMedicoService) {}

  @Get('paciente/:pacienteId')
  findByPaciente(
    @Param('pacienteId', ParseUUIDPipe) pacienteId: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.historialService.findByPaciente(clinicaId, pacienteId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.historialService.findOne(id, clinicaId);
  }

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @Body() dto: CreateHistorialMedicoDto,
  ) {
    return this.historialService.create(clinicaId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
    @Body() dto: UpdateHistorialMedicoDto,
  ) {
    return this.historialService.update(id, clinicaId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.historialService.remove(id, clinicaId);
  }
}
