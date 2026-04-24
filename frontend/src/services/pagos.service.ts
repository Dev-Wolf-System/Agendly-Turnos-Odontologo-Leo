import api from "./api";
import type { PaginationParams, PaginatedResponse } from "./pacientes.service";

export type EstadoPago = "pendiente" | "aprobado" | "rechazado";

export interface Pago {
  id: string;
  turno_id: string;
  total: number | null;
  estado: EstadoPago;
  method: string | null;
  external_reference: string | null;
  fuente_pago: 'particular' | 'obra_social';
  obra_social_nombre: string | null;
  obra_social_id: string | null;
  codigo_prestacion: string | null;
  nro_autorizacion: string | null;
  created_at: string;
  turno?: {
    id: string;
    start_time: string;
    end_time: string;
    estado: string;
    tipo_tratamiento: string | null;
    paciente?: {
      id: string;
      nombre: string;
      apellido: string;
      dni: string | null;
    };
    user?: {
      id: string;
      nombre: string;
      apellido: string;
    };
  };
}

export interface PagoFilters {
  estado?: EstadoPago;
  method?: string;
  desde?: string;
  hasta?: string;
  turno_id?: string;
}

export interface PagoResumen {
  total: number;
  cantidad: number;
  total_obra_social: number;
  cantidad_obra_social: number;
  por_metodo: { method: string; total: number; cantidad: number }[];
  por_obra_social: { obra_social: string; total: number; cantidad: number }[];
}

export interface CreatePagoPayload {
  turno_id: string;
  total?: number;
  method?: string;
  external_reference?: string;
  fuente_pago?: 'particular' | 'obra_social';
  obra_social_nombre?: string;
  obra_social_id?: string;
  codigo_prestacion?: string;
  nro_autorizacion?: string;
}

export interface UpdatePagoPayload {
  total?: number;
  estado?: EstadoPago;
  method?: string;
  external_reference?: string;
  fuente_pago?: 'particular' | 'obra_social';
  obra_social_nombre?: string;
  obra_social_id?: string;
  codigo_prestacion?: string;
  nro_autorizacion?: string;
}

const pagosService = {
  getAll: (filters?: PagoFilters, pagination?: PaginationParams) =>
    api.get<PaginatedResponse<Pago>>("/pagos", {
      params: { ...(filters || {}), ...pagination },
    }).then((r) => r.data),

  getByTurno: (turnoId: string) =>
    api.get<Pago[]>("/pagos", { params: { turno_id: turnoId } }).then((r) => r.data),

  getResumen: (filters?: Pick<PagoFilters, "desde" | "hasta">) =>
    api.get<PagoResumen>("/pagos/resumen", { params: filters || {} }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Pago>(`/pagos/${id}`).then((r) => r.data),

  create: (data: CreatePagoPayload) =>
    api.post<Pago>("/pagos", data).then((r) => r.data),

  update: (id: string, data: UpdatePagoPayload) =>
    api.patch<Pago>(`/pagos/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/pagos/${id}`).then((r) => r.data),
};

export default pagosService;
