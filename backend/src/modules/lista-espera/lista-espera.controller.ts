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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ListaEsperaService } from './lista-espera.service';
import { CreateListaEsperaDto } from './dto/create-lista-espera.dto';
import { UpdateListaEsperaDto } from './dto/update-lista-espera.dto';
import { CurrentClinica, Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';

@Controller('lista-espera')
@Roles(UserRole.ADMIN, UserRole.ASSISTANT)
export class ListaEsperaController {
  constructor(private readonly service: ListaEsperaService) {}

  @Get()
  findAll(
    @CurrentClinica() clinicaId: string,
    @Query('estado') estado?: string,
  ) {
    return this.service.findAll(clinicaId, estado);
  }

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @Body() dto: CreateListaEsperaDto,
  ) {
    return this.service.create(clinicaId, dto);
  }

  @Patch(':id')
  update(
    @CurrentClinica() clinicaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateListaEsperaDto,
  ) {
    return this.service.update(clinicaId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @CurrentClinica() clinicaId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.delete(clinicaId, id);
  }
}
