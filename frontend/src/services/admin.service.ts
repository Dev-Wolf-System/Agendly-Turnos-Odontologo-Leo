import api from "./api";
import type {
  AdminClinica,
  AdminDashboardKPIs,
  AdminDashboardTrend,
  Plan,
  Subscription,
} from "@/types";

/* ─── Dashboard ─── */

export async function getAdminDashboard(): Promise<AdminDashboardKPIs> {
  const { data } = await api.get("/admin/dashboard");
  return data;
}

export async function getAdminDashboardTrends(): Promise<AdminDashboardTrend[]> {
  const { data } = await api.get("/admin/dashboard/trends");
  return data;
}

/* ─── Clínicas ─── */

export async function getAdminClinicas(filters?: {
  is_active?: string;
  plan_id?: string;
  search?: string;
  estado_aprobacion?: string;
}): Promise<AdminClinica[]> {
  const params = new URLSearchParams();
  if (filters?.is_active) params.set("is_active", filters.is_active);
  if (filters?.plan_id) params.set("plan_id", filters.plan_id);
  if (filters?.search) params.set("search", filters.search);
  if (filters?.estado_aprobacion) params.set("estado_aprobacion", filters.estado_aprobacion);
  const { data } = await api.get(`/admin/clinicas?${params.toString()}`);
  return data;
}

export async function getAdminClinicaById(id: string): Promise<AdminClinica> {
  const { data } = await api.get(`/admin/clinicas/${id}`);
  return data;
}

export async function updateAdminClinica(
  id: string,
  payload: Partial<AdminClinica>
): Promise<AdminClinica> {
  const { data } = await api.patch(`/admin/clinicas/${id}`, payload);
  return data;
}

export async function deleteAdminClinica(id: string): Promise<void> {
  await api.delete(`/admin/clinicas/${id}`);
}

export async function aprobarAdminClinica(id: string): Promise<AdminClinica> {
  const { data } = await api.patch(`/admin/clinicas/${id}/aprobar`);
  return data;
}

export async function rechazarAdminClinica(id: string): Promise<AdminClinica> {
  const { data } = await api.patch(`/admin/clinicas/${id}/rechazar`);
  return data;
}

/* ─── Planes ─── */

export async function getAdminPlans(): Promise<Plan[]> {
  const { data } = await api.get("/admin/plans");
  return data;
}

export async function createAdminPlan(
  payload: Omit<Plan, "id" | "created_at">
): Promise<Plan> {
  const { data } = await api.post("/admin/plans", payload);
  return data;
}

export async function updateAdminPlan(
  id: string,
  payload: Partial<Plan>
): Promise<Plan> {
  const { data } = await api.patch(`/admin/plans/${id}`, payload);
  return data;
}

export async function deleteAdminPlan(id: string): Promise<void> {
  await api.delete(`/admin/plans/${id}`);
}

export async function seedAdminPlans(): Promise<Plan[]> {
  const { data } = await api.post("/admin/plans/seed-defaults");
  return data;
}

/* ─── Suscripciones ─── */

export async function getAdminSubscriptions(): Promise<Subscription[]> {
  const { data } = await api.get("/admin/subscriptions");
  return data;
}

export async function getAdminSubscription(id: string): Promise<Subscription> {
  const { data } = await api.get(`/admin/subscriptions/${id}`);
  return data;
}

export async function createAdminSubscription(payload: {
  clinica_id: string;
  plan_id: string;
  estado?: string;
  fecha_inicio: string;
  fecha_fin: string;
  trial_ends_at?: string;
  auto_renew?: boolean;
}): Promise<Subscription> {
  const { data } = await api.post("/admin/subscriptions", payload);
  return data;
}

export async function updateAdminSubscription(
  id: string,
  payload: Partial<Subscription>
): Promise<Subscription> {
  const { data } = await api.patch(`/admin/subscriptions/${id}`, payload);
  return data;
}
