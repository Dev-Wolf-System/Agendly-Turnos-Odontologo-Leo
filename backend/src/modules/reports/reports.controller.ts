import { Controller, Get, Post, Query, Res } from '@nestjs/common';
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

  @Get('insights')
  getInsights(
    @CurrentClinica() clinicaId: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportsService.getInsights(clinicaId, desde, hasta);
  }

  @Get('turnos/xlsx')
  async getTurnosXlsx(
    @CurrentClinica() clinicaId: string,
    @Res() res: Response,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('profesional_id') profesionalId?: string,
  ) {
    const buffer = await this.reportsService.getTurnosXlsx(clinicaId, desde, hasta, profesionalId);
    const filename = `turnos-${desde || 'all'}-${hasta || 'all'}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post('informe-ia')
  generarInformeIa(
    @CurrentClinica() clinicaId: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    return this.reportsService.generarInformeIa(clinicaId, desde, hasta);
  }

  @Get('informe-ia/pdf')
  async getInformeIaPdf(
    @CurrentClinica() clinicaId: string,
    @Res() res: Response,
    @Query('texto') texto: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
  ) {
    const buffer = await this.reportsService.getInformeIaPdf(
      clinicaId,
      decodeURIComponent(texto || ''),
      { desde: desde || '', hasta: hasta || '' },
    );
    const filename = `informe-${desde || 'all'}-${hasta || 'all'}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('pacientes')
  getPacientesReport(@CurrentClinica() clinicaId: string) {
    return this.reportsService.getPacientesReport(clinicaId);
  }
}
