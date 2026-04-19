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
import { ObrasSocialesService } from './obras-sociales.service';
import { CreateObraSocialDto } from './dto/create-obra-social.dto';
import { UpdateObraSocialDto } from './dto/update-obra-social.dto';
import { CurrentClinica } from '../../common/decorators';

@Controller('obras-sociales')
export class ObrasSocialesController {
  constructor(private readonly service: ObrasSocialesService) {}

  @Get()
  findAll(@CurrentClinica() clinicaId: string) {
    return this.service.findAll(clinicaId);
  }

  @Get('activas')
  findActive(@CurrentClinica() clinicaId: string) {
    return this.service.findActive(clinicaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.service.findOne(id, clinicaId);
  }

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @Body() dto: CreateObraSocialDto,
  ) {
    return this.service.create(clinicaId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
    @Body() dto: UpdateObraSocialDto,
  ) {
    return this.service.update(id, clinicaId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.service.remove(id, clinicaId);
  }
}
