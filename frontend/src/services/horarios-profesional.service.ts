import api from "./api";
import { HorarioDia } from "./clinica.service";

export interface HorarioProfesional {
  id: string;
  clinica_id: string;
  user_id: string;
  horarios: Record<string, HorarioDia>;
  created_at: string;
  updated_at: string;
}

export interface UpsertHorarioProfesionalPayload {
  user_id: string;
  horarios: Record<string, HorarioDia>;
}

const horariosProfesionalService = {
  getAll: () =>
    api.get<HorarioProfesional[]>("/horarios-profesional").then((r) => r.data),

  getByUser: (userId: string) =>
    api.get<HorarioProfesional | null>(`/horarios-profesional/${userId}`).then((r) => r.data),

  getEfectivos: (userId: string) =>
    api.get<Record<string, HorarioDia> | null>(`/horarios-profesional/${userId}/efectivos`).then((r) => r.data),

  upsert: (data: UpsertHorarioProfesionalPayload) =>
    api.put<HorarioProfesional>("/horarios-profesional", data).then((r) => r.data),

  remove: (userId: string) =>
    api.delete(`/horarios-profesional/${userId}`).then((r) => r.data),
};

export default horariosProfesionalService;
