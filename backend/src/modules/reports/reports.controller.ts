import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { CurrentClinica } from '../../common/decorators';
import { Roles } from '../../common/decorators';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('reports')
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('turnos')
  getTurnosReport(
    @CurrentClinica() clinicaId: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('profesional_id') profesionalId?: string,
  ) {
    return this.reportsService.getTurnosReport(clinicaId, desde, hasta, profesionalId);
  }

  @Get('turnos/csv')
  async getTurnosCsv(
    @CurrentClinica() clinicaId: string,
    @Res() res: Response,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('profesional_id') profesionalId?: string,
  ) {
    const csv = await this.reportsService.getTurnosCsv(clinicaId, desde, hasta, profesionalId);
    const filename = `turnos-${desde || 'all'}-${hasta || 'all'}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv);
  }

  @Get('pacientes')
  getPacientesReport(@CurrentClinica() clinicaId: string) {
    return this.reportsService.getPacientesReport(clinicaId);
  }
}
