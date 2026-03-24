import api from "./api";

export type EstadoTurno = "pendiente" | "confirmado" | "cancelado" | "completado";
export type SourceTurno = "whatsapp" | "dashboard";

export interface Turno {
  id: string;
  clinica_id: string;
  paciente_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  estado: EstadoTurno;
  source: SourceTurno | null;
  notas: string | null;
  created_at: string;
  paciente?: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    cel: string | null;
  };
  user?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
}

export interface CreateTurnoPayload {
  paciente_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  source?: SourceTurno;
  notas?: string;
}

export interface UpdateTurnoPayload {
  paciente_id?: string;
  user_id?: string;
  start_time?: string;
  end_time?: string;
  estado?: EstadoTurno;
  source?: SourceTurno;
  notas?: string;
}

const turnosService = {
  getAll: (params?: { fecha?: string; estado?: EstadoTurno; user_id?: string }) =>
    api.get<Turno[]>("/turnos", { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Turno>(`/turnos/${id}`).then((r) => r.data),

  countToday: () =>
    api.get<number>("/turnos/today/count").then((r) => r.data),

  create: (data: CreateTurnoPayload) =>
    api.post<Turno>("/turnos", data).then((r) => r.data),

  update: (id: string, data: UpdateTurnoPayload) =>
    api.patch<Turno>(`/turnos/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/turnos/${id}`).then((r) => r.data),
};

export default turnosService;
