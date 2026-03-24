import api from "./api";

export interface Proveedor {
  id: string;
  clinica_id: string;
  nombre: string;
  contacto: string | null;
  email: string | null;
  cel: string | null;
  created_at: string;
}

export interface CreateProveedorPayload {
  nombre: string;
  contacto?: string;
  email?: string;
  cel?: string;
}

export interface UpdateProveedorPayload {
  nombre?: string;
  contacto?: string;
  email?: string;
  cel?: string;
}

const proveedoresService = {
  getAll: () =>
    api.get<Proveedor[]>("/proveedores").then((r) => r.data),

  getById: (id: string) =>
    api.get<Proveedor>(`/proveedores/${id}`).then((r) => r.data),

  create: (data: CreateProveedorPayload) =>
    api.post<Proveedor>("/proveedores", data).then((r) => r.data),

  update: (id: string, data: UpdateProveedorPayload) =>
    api.patch<Proveedor>(`/proveedores/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/proveedores/${id}`).then((r) => r.data),
};

export default proveedoresService;
