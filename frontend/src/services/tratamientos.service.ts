import api from "./api";

export interface Tratamiento {
  id: string;
  clinica_id: string;
  nombre: string;
  descripcion: string | null;
  precio_base: number | null;
  duracion_min: number | null;
  color: string | null;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface CreateTratamientoPayload {
  nombre: string;
  descripcion?: string;
  precio_base?: number;
  duracion_min?: number;
  color?: string;
  activo?: boolean;
  orden?: number;
}

export interface UpdateTratamientoPayload {
  nombre?: string;
  descripcion?: string;
  precio_base?: number;
  duracion_min?: number;
  color?: string;
  activo?: boolean;
  orden?: number;
}

const tratamientosService = {
  getAll: () =>
    api.get<Tratamiento[]>("/tratamientos").then((r) => r.data),

  getActive: () =>
    api.get<Tratamiento[]>("/tratamientos/activos").then((r) => r.data),

  getById: (id: string) =>
    api.get<Tratamiento>(`/tratamientos/${id}`).then((r) => r.data),

  create: (data: CreateTratamientoPayload) =>
    api.post<Tratamiento>("/tratamientos", data).then((r) => r.data),

  update: (id: string, data: UpdateTratamientoPayload) =>
    api.patch<Tratamiento>(`/tratamientos/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/tratamientos/${id}`).then((r) => r.data),

  seed: (especialidad: string) =>
    api.post(`/tratamientos/seed/${especialidad}`).then((r) => r.data),
};

export default tratamientosService;
