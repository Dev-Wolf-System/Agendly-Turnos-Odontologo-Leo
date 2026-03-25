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
import { CategoriasService } from './categorias.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { CurrentClinica } from '../../common/decorators';

@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Get()
  findAll(@CurrentClinica() clinicaId: string) {
    return this.categoriasService.findAll(clinicaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.categoriasService.findOne(id, clinicaId);
  }

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @Body() dto: CreateCategoriaDto,
  ) {
    return this.categoriasService.create(clinicaId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
    @Body() dto: UpdateCategoriaDto,
  ) {
    return this.categoriasService.update(id, clinicaId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.categoriasService.remove(id, clinicaId);
  }
}
