import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ClinicasService } from './clinicas.service';
import { CurrentClinica } from '../../common/decorators';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums';
import { UpdateClinicaDto } from './dto/update-clinica.dto';

@Controller('clinicas')
export class ClinicasController {
  constructor(private readonly clinicasService: ClinicasService) {}

  @Get('me')
  getMyClinica(@CurrentClinica() clinicaId: string) {
    return this.clinicasService.findOne(clinicaId);
  }

  @Patch('me')
  @Roles(UserRole.ADMIN)
  updateMyClinica(
    @CurrentClinica() clinicaId: string,
    @Body() updateClinicaDto: UpdateClinicaDto,
  ) {
    return this.clinicasService.update(clinicaId, updateClinicaDto);
  }
}
