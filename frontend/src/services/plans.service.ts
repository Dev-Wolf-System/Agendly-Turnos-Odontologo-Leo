import type { Plan } from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** Usa fetch directo — endpoint público, no necesita interceptor de auth */
export const plansService = {
  async getActivePlans(): Promise<Plan[]> {
    const res = await fetch(`${BASE_URL}/plans`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Error cargando planes: ${res.status}`);
    return res.json();
  },
};
