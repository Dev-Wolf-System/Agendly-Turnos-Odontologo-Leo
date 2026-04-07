"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/services/api";

interface PlanUsage {
  plan: { id: string; nombre: string } | null;
  estado: string | null;
  maxUsuarios: number;
  maxPacientes: number | null;
  currentUsuarios: number;
  currentPacientes: number;
  canAddUsuario: boolean;
  canAddPaciente: boolean;
}

const DEFAULT: PlanUsage = {
  plan: null,
  estado: null,
  maxUsuarios: 0,
  maxPacientes: null,
  currentUsuarios: 0,
  currentPacientes: 0,
  canAddUsuario: true,
  canAddPaciente: true,
};

export function usePlanLimits() {
  const [usage, setUsage] = useState<PlanUsage>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<PlanUsage>("/subscriptions/usage");
      setUsage(data);
    } catch {
      // Si falla, deja los defaults (sin restricciones)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...usage,
    planNombre: usage.plan?.nombre ?? "Sin plan",
    loading,
    refresh,
  };
}
