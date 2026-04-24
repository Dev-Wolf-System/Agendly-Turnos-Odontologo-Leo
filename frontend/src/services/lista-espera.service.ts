import api from "./api";

export type EstadoListaEspera = "activa" | "notificada" | "vencida" | "convertida";

export interface ListaEspera {
  id: string;
  clinica_id: string;
  paciente_id: string;
  profesional_id: string | null;
  fecha_preferida: string | null;
  estado: EstadoListaEspera;
  notas: string | null;
  created_at: string;
  updated_at: string;
  paciente?: { id: string; nombre: string; apellido: string; dni: string | null; cel: string | null };
  profesional?: { id: string; nombre: string; apellido: string } | null;
}

export interface CreateListaEsperaPayload {
  paciente_id: string;
  profesional_id?: string;
  fecha_preferida?: string;
  notas?: string;
}

export interface UpdateListaEsperaPayload {
  estado?: EstadoListaEspera;
  profesional_id?: string;
  fecha_preferida?: string;
  notas?: string;
}

const listaEsperaService = {
  getAll: (estado?: string) =>
    api.get<ListaEspera[]>("/lista-espera", { params: estado ? { estado } : {} }).then((r) => r.data),

  create: (data: CreateListaEsperaPayload) =>
    api.post<ListaEspera>("/lista-espera", data).then((r) => r.data),

  update: (id: string, data: UpdateListaEsperaPayload) =>
    api.patch<ListaEspera>(`/lista-espera/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/lista-espera/${id}`).then((r) => r.data),
};

export default listaEsperaService;
