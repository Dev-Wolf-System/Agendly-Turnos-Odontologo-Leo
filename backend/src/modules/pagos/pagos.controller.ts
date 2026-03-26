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
    @Query('turno_id') turnoId?: string,
    @Query('estado') estado?: string,
    @Query('method') method?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    if (turnoId) {
      return this.pagosService.findByTurno(clinicaId, turnoId);
    }
    const filters: FilterPagosDto = {};
    if (estado) filters.estado = estado as any;
    if (method) filters.method = method;
    if (desde) filters.desde = desde;
    if (hasta) filters.hasta = hasta;

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
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const filters: FilterPagosDto = {};
    if (desde) filters.desde = desde;
    if (hasta) filters.hasta = hasta;
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
