import api from "./api";

export type EstadoTurno = "pendiente" | "confirmado" | "cancelado" | "completado" | "perdido";
export type SourceTurno = "whatsapp" | "dashboard";
/** @deprecated Usar tratamientos dinámicos del servicio tratamientos.service.ts */
export type TipoTratamiento = string;

/** Fallback para turnos históricos que usaban el enum viejo */
export const TRATAMIENTOS_LABELS: Record<string, string> = {
  consulta: "Consulta",
  limpieza: "Limpieza",
  extraccion: "Extracción",
  empaste: "Empaste",
  endodoncia: "Endodoncia",
  ortodoncia: "Ortodoncia",
  implante: "Implante",
  blanqueamiento: "Blanqueamiento",
  protesis: "Prótesis",
  radiografia: "Radiografía",
  cirugia: "Cirugía",
  control: "Control",
  urgencia: "Urgencia",
  otro: "Otro",
};

export interface Turno {
  id: string;
  clinica_id: string;
  paciente_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  estado: EstadoTurno;
  source: SourceTurno | null;
  tipo_tratamiento: TipoTratamiento | null;
  notas: string | null;
  fue_reprogramado: boolean;
  es_reprogramacion: boolean;
  recordatorio_enviado: boolean;
  created_at: string;
  paciente?: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
    cel: string | null;
    obra_social: string | null;
    nro_afiliado: string | null;
    plan_os: string | null;
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
  tipo_tratamiento?: TipoTratamiento;
  notas?: string;
  es_reprogramacion?: boolean;
}

export interface UpdateTurnoPayload {
  paciente_id?: string;
  user_id?: string;
  start_time?: string;
  end_time?: string;
  estado?: EstadoTurno;
  source?: SourceTurno;
  tipo_tratamiento?: TipoTratamiento;
  notas?: string;
  es_reprogramacion?: boolean;
}

const turnosService = {
  getAll: (params?: { fecha?: string; fecha_desde?: string; fecha_hasta?: string; estado?: EstadoTurno; user_id?: string }) =>
    api.get<Turno[]>("/turnos", { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Turno>(`/turnos/${id}`).then((r) => r.data),

  countToday: () =>
    api.get<number>("/turnos/today/count").then((r) => r.data),

  create: (data: CreateTurnoPayload) =>
    api.post<Turno>("/turnos", data).then((r) => r.data),

  update: (id: string, data: UpdateTurnoPayload) =>
    api.patch<Turno>(`/turnos/${id}`, data).then((r) => r.data),

  getPagosCount: (id: string) =>
    api.get<{ count: number; total: number }>(`/turnos/${id}/pagos-count`).then((r) => r.data),

  reprogramar: (id: string) =>
    api.patch(`/turnos/${id}/reprogramar`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/turnos/${id}`).then((r) => r.data),

  getLinkPago: (turnoId: string, clinicaId: string) =>
    api.get<{ checkout_url: string }>(`/agent/turnos/${turnoId}/link-pago`, { params: { clinicaId } }).then((r) => r.data),
};

export default turnosService;
