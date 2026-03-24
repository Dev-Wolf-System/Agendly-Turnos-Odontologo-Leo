import api from "./api";

export interface HistorialMedico {
  id: string;
  paciente_id: string;
  turno_id: string | null;
  diagnostico: string | null;
  tratamiento: string | null;
  observaciones: string | null;
  created_at: string;
  paciente?: {
    id: string;
    nombre: string;
    apellido: string;
    dni: string;
  };
  turno?: {
    id: string;
    start_time: string;
    end_time: string;
  };
}

export interface CreateHistorialPayload {
  paciente_id: string;
  turno_id?: string;
  diagnostico?: string;
  tratamiento?: string;
  observaciones?: string;
}

export interface UpdateHistorialPayload {
  turno_id?: string;
  diagnostico?: string;
  tratamiento?: string;
  observaciones?: string;
}

const historialMedicoService = {
  getByPaciente: (pacienteId: string) =>
    api.get<HistorialMedico[]>(`/historial-medico/paciente/${pacienteId}`).then((r) => r.data),

  getById: (id: string) =>
    api.get<HistorialMedico>(`/historial-medico/${id}`).then((r) => r.data),

  create: (data: CreateHistorialPayload) =>
    api.post<HistorialMedico>("/historial-medico", data).then((r) => r.data),

  update: (id: string, data: UpdateHistorialPayload) =>
    api.patch<HistorialMedico>(`/historial-medico/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/historial-medico/${id}`).then((r) => r.data),
};

export default historialMedicoService;
