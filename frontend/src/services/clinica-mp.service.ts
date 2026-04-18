import api from "./api";

export interface ClinicaMpStatus {
  configurado: boolean;
  public_key?: string;
  webhook_url?: string | null;
  webhook_activo?: boolean;
  updated_at?: string;
}

export interface UpsertClinicaMpDto {
  access_token: string;
  public_key?: string;
  webhook_url?: string;
  webhook_activo?: boolean;
}

const clinicaMpService = {
  async getStatus(): Promise<ClinicaMpStatus> {
    const res = await api.get<ClinicaMpStatus>("/clinica-mp/status");
    return res.data;
  },

  async upsert(dto: UpsertClinicaMpDto): Promise<void> {
    await api.put("/clinica-mp", dto);
  },

  async updateWebhook(data: { webhook_url?: string; webhook_activo?: boolean }): Promise<void> {
    await api.patch("/clinica-mp/webhook", data);
  },

  async remove(): Promise<void> {
    await api.delete("/clinica-mp");
  },
};

export default clinicaMpService;
