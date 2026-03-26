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
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { FilterPagosDto } from './dto/filter-pagos.dto';
import { CurrentClinica } from '../../common/decorators';

@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Get()
  findAll(
    @CurrentClinica() clinicaId: string,
    @Query() filters?: FilterPagosDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    if (filters?.turno_id) {
      return this.pagosService.findByTurno(clinicaId, filters.turno_id);
    }
    return this.pagosService.findAll(clinicaId, filters, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      sortBy,
      sortOrder: sortOrder as any,
    });
  }

  @Get('resumen')
  getResumen(
    @CurrentClinica() clinicaId: string,
    @Query() filters?: FilterPagosDto,
  ) {
    return this.pagosService.getResumen(clinicaId, filters);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.pagosService.findOne(id, clinicaId);
  }

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @Body() dto: CreatePagoDto,
  ) {
    return this.pagosService.create(clinicaId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
    @Body() dto: UpdatePagoDto,
  ) {
    return this.pagosService.update(id, clinicaId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.pagosService.remove(id, clinicaId);
  }
}
