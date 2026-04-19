import api from "./api";

export interface ObraSocial {
  id: string;
  clinica_id: string;
  nombre: string;
  codigo: string | null;
  url: string | null;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface CreateObraSocialPayload {
  nombre: string;
  codigo?: string;
  url?: string;
  telefono?: string;
  email?: string;
  activo?: boolean;
  orden?: number;
}

export type UpdateObraSocialPayload = Partial<CreateObraSocialPayload>;

const obrasSocialesService = {
  getAll: () => api.get<ObraSocial[]>("/obras-sociales").then((r) => r.data),
  getActive: () => api.get<ObraSocial[]>("/obras-sociales/activas").then((r) => r.data),
  getById: (id: string) => api.get<ObraSocial>(`/obras-sociales/${id}`).then((r) => r.data),
  create: (data: CreateObraSocialPayload) =>
    api.post<ObraSocial>("/obras-sociales", data).then((r) => r.data),
  update: (id: string, data: UpdateObraSocialPayload) =>
    api.patch<ObraSocial>(`/obras-sociales/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/obras-sociales/${id}`).then((r) => r.data),
};

export default obrasSocialesService;
