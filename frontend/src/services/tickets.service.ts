import api from "./api";

export interface Ticket {
  id: string;
  clinica_id: string;
  user_id: string;
  asunto: string;
  descripcion: string;
  categoria: "tecnico" | "facturacion" | "consulta" | "otro";
  prioridad: "baja" | "media" | "alta" | "urgente";
  estado: "abierto" | "en_progreso" | "esperando_respuesta" | "resuelto" | "cerrado";
  respuesta_admin: string | null;
  respondido_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketPayload {
  asunto: string;
  descripcion: string;
  categoria?: string;
  prioridad?: string;
}

const ticketsService = {
  getAll: () => api.get<Ticket[]>("/tickets").then((r) => r.data),

  getById: (id: string) => api.get<Ticket>(`/tickets/${id}`).then((r) => r.data),

  create: (data: CreateTicketPayload) =>
    api.post<Ticket>("/tickets", data).then((r) => r.data),
};

export default ticketsService;
