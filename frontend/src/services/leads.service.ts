import api from "./api";

export interface Lead {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  empresa: string | null;
  especialidad: string | null;
  plan_interes: string | null;
  mensaje: string | null;
  estado: EstadoLead;
  notas: string | null;
  origen: string;
  created_at: string;
  updated_at: string;
}

export type EstadoLead = "nuevo" | "contactado" | "en_negociacion" | "convertido" | "descartado";

export interface LeadStats {
  total: number;
  nuevos: number;
  contactados: number;
  en_negociacion: number;
  convertidos: number;
  descartados: number;
}

export interface CreateLeadPayload {
  nombre: string;
  email: string;
  telefono?: string;
  empresa?: string;
  especialidad?: string;
  plan_interes?: string;
  mensaje?: string;
  origen?: string;
}

const leadsService = {
  getAll: (estado?: EstadoLead) =>
    api.get<Lead[]>("/leads", { params: estado ? { estado } : {} }).then((r) => r.data),

  getStats: () =>
    api.get<LeadStats>("/leads/stats").then((r) => r.data),

  getOne: (id: string) =>
    api.get<Lead>(`/leads/${id}`).then((r) => r.data),

  create: (data: CreateLeadPayload) =>
    api.post<Lead>("/leads", data).then((r) => r.data),

  update: (id: string, data: Partial<Lead>) =>
    api.patch<Lead>(`/leads/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/leads/${id}`),
};

export default leadsService;
