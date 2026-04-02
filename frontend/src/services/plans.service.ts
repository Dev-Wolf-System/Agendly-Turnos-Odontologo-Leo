import api from "./api";
import type { Plan } from "@/types";

/** Servicio público — no requiere auth */
export const plansService = {
  async getActivePlans(): Promise<Plan[]> {
    const response = await api.get<Plan[]>("/plans");
    return response.data;
  },
};
