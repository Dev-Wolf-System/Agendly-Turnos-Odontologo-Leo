export interface User {
  id: string;
  clinica_id: string | null;
  nombre: string;
  apellido: string;
  email: string;
  role: "superadmin" | "admin" | "professional" | "assistant";
  created_at: string;
}

export interface Clinica {
  id: string;
  nombre: string;
  nombre_propietario: string | null;
  cel: string | null;
  is_active: boolean;
  created_at: string;
}

/* ─── Admin Types ─── */

export interface Plan {
  id: string;
  nombre: string;
  precio_mensual: number;
  max_usuarios: number;
  max_pacientes: number | null;
  features: Record<string, boolean>;
  descripcion: string | null;
  is_highlighted: boolean;
  is_default_trial: boolean;
  orden: number;
  is_active: boolean;
  created_at: string;
}

export type EstadoSubscription = "trial" | "activa" | "past_due" | "gracia" | "suspendida" | "cancelada" | "vencida";

export interface Subscription {
  id: string;
  clinica_id: string;
  plan_id: string;
  estado: EstadoSubscription;
  fecha_inicio: string;
  fecha_fin: string;
  trial_ends_at: string | null;
  auto_renew: boolean;
  external_reference: string | null;
  created_at: string;
  updated_at: string;
  clinica?: AdminClinica;
  plan?: Plan;
}

export interface AdminClinica extends Clinica {
  email: string | null;
  direccion: string | null;
  subscriptions?: Subscription[];
  _stats?: {
    usuarios: number;
    pacientes: number;
    turnos: number;
  };
  subscription?: Subscription;
}

export interface AdminDashboardKPIs {
  clinicas: {
    total: number;
    activas: number;
    inactivas: number;
    nuevas_este_mes: number;
  };
  subscripciones: {
    total: number;
    activas: number;
    trial: number;
    trials_por_vencer: number;
  };
  mrr: number;
  clinicas_por_plan: Array<{
    plan_id: string;
    plan_nombre: string;
    cantidad: number;
  }>;
  planes: Plan[];
}

export interface AuthResponse {
  user: User;
  clinica?: Clinica;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  clinica_nombre: string;
  nombre_propietario?: string;
  clinica_cel?: string;
  nombre: string;
  apellido: string;
  email: string;
  password: string;
}
