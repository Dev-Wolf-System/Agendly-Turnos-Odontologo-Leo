import api from "./api";

export interface BillingPortal {
  estado: string;
  plan: {
    nombre: string;
    precio_mensual: number;
    features: Record<string, boolean>;
  };
  fecha_fin: string;
  trial_ends_at: string | null;
  auto_renew: boolean;
  remaining_days: number;
  needs_renewal: boolean;
  is_trial: boolean;
}

const billingService = {
  async createCheckout(planId?: string): Promise<{ checkout_url: string }> {
    const res = await api.post<{ checkout_url: string }>("/billing/checkout", { planId });
    return res.data;
  },

  async getLinkPago(pagoId: string): Promise<{ checkout_url: string; pago_id: string; monto: number }> {
    const res = await api.get<{ checkout_url: string; pago_id: string; monto: number }>(
      `/billing/link-pago/${pagoId}`,
    );
    return res.data;
  },

  async cancelSubscription(): Promise<void> {
    await api.delete("/billing/subscribe");
  },

  async getPortal(): Promise<BillingPortal | null> {
    const res = await api.get<BillingPortal | null>("/billing/portal");
    return res.data;
  },
};

export default billingService;
