import api from "./api";

export interface ChatUser {
  id: string;
  nombre: string;
  apellido: string;
  role: string;
  email: string;
}

export interface ChatMessage {
  id: string;
  clinica_id: string;
  sender_id: string;
  receiver_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
  sender: {
    id: string;
    nombre: string;
    apellido: string;
    role: string;
  };
}

export const chatService = {
  async getMessages(otherUserId?: string, limit = 50, before?: string): Promise<ChatMessage[]> {
    const params = new URLSearchParams();
    if (otherUserId) params.set("with", otherUserId);
    if (limit) params.set("limit", String(limit));
    if (before) params.set("before", before);
    const { data } = await api.get(`/chat/messages?${params.toString()}`);
    return data;
  },

  async sendMessage(content: string, receiverId?: string): Promise<ChatMessage> {
    const body: { content: string; receiver_id?: string } = { content };
    if (receiverId) body.receiver_id = receiverId;
    const { data } = await api.post("/chat/messages", body);
    return data;
  },

  async markAsRead(messageIds: string[]): Promise<void> {
    await api.patch("/chat/messages/read", { messageIds });
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await api.get("/chat/unread-count");
    return data;
  },

  async getUnreadPerUser(): Promise<Record<string, number>> {
    const { data } = await api.get("/chat/unread-per-user");
    return data;
  },

  async getClinicUsers(): Promise<ChatUser[]> {
    const { data } = await api.get("/chat/users");
    return data;
  },

  async clearChat(otherUserId?: string): Promise<{ deleted: number }> {
    const params = otherUserId ? `?with=${otherUserId}` : "";
    const { data } = await api.delete(`/chat/messages${params}`);
    return data;
  },
};
