import api from "./api";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface Paciente {
  id: string;
  clinica_id: string;
  dni: string;
  nombre: string;
  apellido: string;
  cel: string | null;
  email: string | null;
  fecha_nacimiento: string | null;
  created_at: string;
}

export interface CreatePacientePayload {
  dni: string;
  nombre: string;
  apellido: string;
  cel?: string;
  email?: string;
  fecha_nacimiento?: string;
}

export interface UpdatePacientePayload {
  dni?: string;
  nombre?: string;
  apellido?: string;
  cel?: string;
  email?: string;
  fecha_nacimiento?: string;
}

export interface FichaTurno {
  id: string;
  start_time: string;
  end_time: string;
  estado: string;
  notas: string | null;
  profesional: { id: string; nombre: string; apellido: string } | null;
}

export interface FichaHistorial {
  id: string;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
  fecha: string;
  turno_id: string | null;
}

export interface FichaPago {
  id: string;
  total: number;
  estado: string;
  method: string | null;
  fecha: string;
  turno_id: string;
}

export interface FichaKpis {
  totalTurnos: number;
  ultimoTurno: string | null;
  totalPagado: number;
  saldoPendiente: number;
}

export interface FichaPaciente {
  paciente: Paciente;
  proximosTurnos: FichaTurno[];
  historialTurnos: FichaTurno[];
  historialMedico: FichaHistorial[];
  pagos: FichaPago[];
  kpis: FichaKpis;
}

const pacientesService = {
  getAll: (search?: string, pagination?: PaginationParams) =>
    api.get<PaginatedResponse<Paciente>>("/pacientes", {
      params: { ...(search ? { search } : {}), ...pagination },
    }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Paciente>(`/pacientes/${id}`).then((r) => r.data),

  getCount: () =>
    api.get<number>("/pacientes/count").then((r) => r.data),

  create: (data: CreatePacientePayload) =>
    api.post<Paciente>("/pacientes", data).then((r) => r.data),

  update: (id: string, data: UpdatePacientePayload) =>
    api.patch<Paciente>(`/pacientes/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/pacientes/${id}`).then((r) => r.data),

  getFicha: (id: string) =>
    api.get<FichaPaciente>(`/pacientes/${id}/ficha`).then((r) => r.data),
};

export default pacientesService;
