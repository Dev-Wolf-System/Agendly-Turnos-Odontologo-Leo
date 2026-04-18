import api from "./api";

export interface AdminNotificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  metadata: Record<string, string> | null;
  created_at: string;
}

const adminNotificacionesService = {
  async getAll(): Promise<AdminNotificacion[]> {
    const res = await api.get<AdminNotificacion[]>("/admin/notificaciones");
    return res.data;
  },

  async getCount(): Promise<number> {
    const res = await api.get<{ count: number }>("/admin/notificaciones/count");
    return res.data.count;
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/admin/notificaciones/${id}/leer`);
  },

  async markAllAsRead(): Promise<void> {
    await api.patch("/admin/notificaciones/leer-todas");
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/admin/notificaciones/${id}`);
  },
};

export default adminNotificacionesService;
