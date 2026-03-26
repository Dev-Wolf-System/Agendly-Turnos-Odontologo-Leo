import api from "./api";

export interface Notificacion {
  id: string;
  clinica_id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const notificacionesService = {
  getAll: async (): Promise<Notificacion[]> => {
    const { data } = await api.get("/notificaciones");
    return data;
  },

  getUnread: async (): Promise<Notificacion[]> => {
    const { data } = await api.get("/notificaciones/sin-leer");
    return data;
  },

  getCount: async (): Promise<number> => {
    const { data } = await api.get("/notificaciones/count");
    return data.count;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notificaciones/${id}/leer`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch("/notificaciones/leer-todas");
  },

  remove: async (id: string): Promise<void> => {
    await api.delete(`/notificaciones/${id}`);
  },
};

export default notificacionesService;
