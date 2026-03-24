import api from "./api";

export interface Inventario {
  id: string;
  clinica_id: string;
  nombre: string;
  cantidad: number;
  stock_min: number;
  proveedor_id: string | null;
  updated_at: string;
  created_at: string;
  proveedor?: {
    id: string;
    nombre: string;
  };
}

export interface CreateInventarioPayload {
  nombre: string;
  cantidad?: number;
  stock_min?: number;
  proveedor_id?: string;
}

export interface UpdateInventarioPayload {
  nombre?: string;
  cantidad?: number;
  stock_min?: number;
  proveedor_id?: string;
}

const inventarioService = {
  getAll: () =>
    api.get<Inventario[]>("/inventario").then((r) => r.data),

  getLowStock: () =>
    api.get<Inventario[]>("/inventario/low-stock").then((r) => r.data),

  getById: (id: string) =>
    api.get<Inventario>(`/inventario/${id}`).then((r) => r.data),

  create: (data: CreateInventarioPayload) =>
    api.post<Inventario>("/inventario", data).then((r) => r.data),

  update: (id: string, data: UpdateInventarioPayload) =>
    api.patch<Inventario>(`/inventario/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/inventario/${id}`).then((r) => r.data),
};

export default inventarioService;
