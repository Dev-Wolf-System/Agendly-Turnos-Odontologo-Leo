"use client";

import { useState, useEffect } from "react";
import { getAdminDashboard } from "@/services/admin.service";
import type { AdminDashboardKPIs } from "@/types";

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminDashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminDashboard()
      .then(setKpis)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!kpis) {
    return <p className="text-muted-foreground">Error al cargar datos</p>;
  }

  const kpiCards = [
    {
      label: "Clínicas Activas",
      value: kpis.clinicas.activas,
      sub: `${kpis.clinicas.inactivas} inactivas`,
      color: "border-l-emerald-500",
      icon: "🏥",
    },
    {
      label: "MRR",
      value: `$${kpis.mrr.toLocaleString("es-AR")}`,
      sub: `${kpis.subscripciones.activas} suscripciones activas`,
      color: "border-l-blue-500",
      icon: "💰",
    },
    {
      label: "Trials Activos",
      value: kpis.subscripciones.trial,
      sub: `${kpis.subscripciones.trials_por_vencer} por vencer esta semana`,
      color: "border-l-amber-500",
      icon: "⏳",
    },
    {
      label: "Nuevas este Mes",
      value: kpis.clinicas.nuevas_este_mes,
      sub: `${kpis.clinicas.total} totales`,
      color: "border-l-violet-500",
      icon: "📈",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vista general de la plataforma Agendly
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border border-l-4 ${card.color} bg-card p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className="mt-2 text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Clínicas por Plan + Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clínicas por plan */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Distribución por Plan</h2>
          {kpis.clinicas_por_plan.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay suscripciones activas aún
            </p>
          ) : (
            <div className="space-y-3">
              {kpis.clinicas_por_plan.map((item) => {
                const total = kpis.clinicas.total || 1;
                const pct = Math.round(
                  (Number(item.cantidad) / total) * 100
                );
                return (
                  <div key={item.plan_id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{item.plan_nombre}</span>
                      <span className="text-muted-foreground">
                        {item.cantidad} clínicas ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Planes disponibles */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Planes Disponibles</h2>
          {kpis.planes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay planes creados aún.{" "}
              <a href="/admin/planes" className="text-indigo-500 hover:underline">
                Crear primer plan
              </a>
            </p>
          ) : (
            <div className="space-y-3">
              {kpis.planes.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{plan.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {plan.max_usuarios} usuarios · {plan.max_pacientes ?? "∞"}{" "}
                      pacientes
                    </p>
                  </div>
                  <p className="text-lg font-bold text-indigo-500">
                    ${Number(plan.precio_mensual).toLocaleString("es-AR")}
                    <span className="text-xs font-normal text-muted-foreground">
                      /mes
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
