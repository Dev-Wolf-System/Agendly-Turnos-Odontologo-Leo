import api from "./api";
import type { Subscription } from "@/types";

export interface SubscriptionWithPlan extends Omit<Subscription, 'plan'> {
  plan: {
    id: string;
    nombre: string;
    precio_mensual: number;
    max_usuarios: number;
    max_pacientes: number | null;
    features: Record<string, boolean>;
    is_active: boolean;
    created_at: string;
  };
}

const subscriptionsService = {
  getMiSuscripcion: () =>
    api
      .get<SubscriptionWithPlan>("/subscriptions/mi-suscripcion")
      .then((r) => r.data),
};

export default subscriptionsService;
