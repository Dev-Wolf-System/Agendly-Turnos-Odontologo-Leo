import api from "./api";

export interface TurnoDia {
  apertura: string;
  cierre: string;
  activo: boolean;
}

export interface HorarioDia {
  manana: TurnoDia;
  tarde: TurnoDia;
}

export interface WebhookConfig {
  url: string;
  activo: boolean;
}

export interface Clinica {
  id: string;
  nombre: string;
  nombre_propietario: string | null;
  cel: string | null;
  email: string | null;
  direccion: string | null;
  logo_url: string | null;
  especialidad: string | null;
  label_paciente: string | null;
  label_profesional: string | null;
  horarios: Record<string, HorarioDia> | null;
  duracion_turno_default: number | null;
  webhooks: Record<string, WebhookConfig> | null;
  recordatorio_horas_antes: number | null;
  evolution_instance: string | null;
  evolution_api_key: string | null;
  agent_nombre: string | null;
  agent_instrucciones: string | null;
  kpi_visibility: Record<string, Record<string, boolean>> | null;
  created_at: string;
}

export interface UpdateClinicaPayload {
  nombre?: string;
  nombre_propietario?: string;
  cel?: string;
  email?: string;
  direccion?: string;
  logo_url?: string;
  especialidad?: string;
  label_paciente?: string;
  label_profesional?: string;
  horarios?: Record<string, HorarioDia>;
  duracion_turno_default?: number;
  webhooks?: Record<string, WebhookConfig>;
  recordatorio_horas_antes?: number;
  evolution_instance?: string;
  evolution_api_key?: string;
  agent_nombre?: string;
  agent_instrucciones?: string;
  kpi_visibility?: Record<string, Record<string, boolean>>;
}

export interface SubscriptionStatus {
  level: "full" | "read_only" | "blocked";
  estado: string | null;
  severity?: "warning" | "error" | "critical";
  mensaje?: string;
  plan?: { nombre: string; precio_mensual: number } | null;
  fecha_fin?: string;
  trial_ends_at?: string;
  grace_period_ends_at?: string;
  auto_renew?: boolean;
}

export type FeatureFlags = Record<string, boolean>;

const clinicaService = {
  getMe: () =>
    api.get<Clinica>("/clinicas/me").then((r) => r.data),

  updateMe: (data: UpdateClinicaPayload) =>
    api.patch<Clinica>("/clinicas/me", data).then((r) => r.data),

  getSubscriptionStatus: () =>
    api.get<SubscriptionStatus>("/clinicas/me/subscription-status").then((r) => r.data),

  getFeatures: () =>
    api.get<FeatureFlags>("/clinicas/me/features").then((r) => r.data),
};

export default clinicaService;
