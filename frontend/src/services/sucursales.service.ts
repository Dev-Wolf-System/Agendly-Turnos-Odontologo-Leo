import api from "./api";

export interface Sucursal {
  id: string;
  clinica_padre_id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  especialidad: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SucursalResumen {
  total: number;
  activas: number;
  inactivas: number;
  sucursales: Sucursal[];
}

export interface CreateSucursalPayload {
  nombre: string;
  direccion?: string;
  telefono?: string;
  especialidad?: string;
  email?: string;
}

export interface UpdateSucursalPayload {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  especialidad?: string;
  email?: string;
  is_active?: boolean;
}

const sucursalesService = {
  getAll: () =>
    api.get<Sucursal[]>("/sucursales").then((r) => r.data),

  getResumen: () =>
    api.get<SucursalResumen>("/sucursales/resumen").then((r) => r.data),

  getOne: (id: string) =>
    api.get<Sucursal>(`/sucursales/${id}`).then((r) => r.data),

  create: (data: CreateSucursalPayload) =>
    api.post<Sucursal>("/sucursales", data).then((r) => r.data),

  update: (id: string, data: UpdateSucursalPayload) =>
    api.patch<Sucursal>(`/sucursales/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    api.delete(`/sucursales/${id}`).then((r) => r.data),
};

export default sucursalesService;
