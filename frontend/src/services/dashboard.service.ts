import api from "./api";

export interface DashboardStats {
  turnosHoy: number;
  totalPacientes: number;
  lowStockCount: number;
  ingresosMes: number;
}

export interface TurnoHoy {
  id: string;
  start_time: string;
  end_time: string;
  estado: string;
  notas: string | null;
  paciente?: {
    id: string;
    nombre: string;
    apellido: string;
  };
  user?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export interface IngresoMensual {
  mes: string;
  ingresos: number;
}

export interface FacturacionDiaria {
  dia: number;
  monto: number;
}

export interface TurnoSemana {
  dia: string;
  turnos: number;
  completados: number;
}

export interface TratamientoMes {
  nombre: string;
  cantidad: number;
}

const dashboardService = {
  getStats: () =>
    api.get<DashboardStats>("/dashboard/stats").then((r) => r.data),

  getTurnosHoy: () =>
    api.get<TurnoHoy[]>("/dashboard/turnos-hoy").then((r) => r.data),

  getIngresosMensuales: () =>
    api.get<IngresoMensual[]>("/dashboard/ingresos-mensuales").then((r) => r.data),

  getFacturacionDiaria: () =>
    api.get<FacturacionDiaria[]>("/dashboard/facturacion-diaria").then((r) => r.data),

  getTurnosSemana: () =>
    api.get<TurnoSemana[]>("/dashboard/turnos-semana").then((r) => r.data),

  getTratamientosMes: () =>
    api.get<TratamientoMes[]>("/dashboard/tratamientos-mes").then((r) => r.data),
};

export default dashboardService;
