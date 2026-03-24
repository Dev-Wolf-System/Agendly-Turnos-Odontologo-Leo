import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentClinica } from '../../common/decorators';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@CurrentClinica() clinicaId: string) {
    return this.dashboardService.getStats(clinicaId);
  }

  @Get('turnos-hoy')
  getTurnosHoy(@CurrentClinica() clinicaId: string) {
    return this.dashboardService.getTurnosHoy(clinicaId);
  }

  @Get('ingresos-mensuales')
  getIngresosMensuales(@CurrentClinica() clinicaId: string) {
    return this.dashboardService.getIngresosMensuales(clinicaId);
  }

  @Get('facturacion-diaria')
  getFacturacionDiaria(@CurrentClinica() clinicaId: string) {
    return this.dashboardService.getFacturacionDiaria(clinicaId);
  }

  @Get('turnos-semana')
  getTurnosSemana(@CurrentClinica() clinicaId: string) {
    return this.dashboardService.getTurnosSemana(clinicaId);
  }

  @Get('tratamientos-mes')
  getTratamientosMes(@CurrentClinica() clinicaId: string) {
    return this.dashboardService.getTratamientosMes(clinicaId);
  }
}
