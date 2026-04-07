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
import { SucursalesService } from './sucursales.service';
import { CreateSucursalDto } from './dto/create-sucursal.dto';
import { UpdateSucursalDto } from './dto/update-sucursal.dto';
import { CurrentClinica, Roles, RequireFeature } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { FEATURES } from '../../common/constants/feature-keys';

@Controller('sucursales')
@RequireFeature(FEATURES.MULTI_SUCURSAL)
@Roles(UserRole.ADMIN)
export class SucursalesController {
  constructor(private readonly sucursalesService: SucursalesService) {}

  @Get()
  findAll(@CurrentClinica() clinicaId: string) {
    return this.sucursalesService.findAll(clinicaId);
  }

  @Get('resumen')
  getResumen(@CurrentClinica() clinicaId: string) {
    return this.sucursalesService.getResumen(clinicaId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.sucursalesService.findOne(id, clinicaId);
  }

  @Post()
  create(
    @CurrentClinica() clinicaId: string,
    @Body() dto: CreateSucursalDto,
  ) {
    return this.sucursalesService.create(clinicaId, dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
    @Body() dto: UpdateSucursalDto,
  ) {
    return this.sucursalesService.update(id, clinicaId, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentClinica() clinicaId: string,
  ) {
    return this.sucursalesService.remove(id, clinicaId);
  }
}
