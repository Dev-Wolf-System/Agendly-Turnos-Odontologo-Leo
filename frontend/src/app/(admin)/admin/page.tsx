"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { getAdminDashboard } from "@/services/admin.service";
import type { AdminDashboardKPIs } from "@/types";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#7c3aed"];

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
      <div className="animate-page-in space-y-8">
        <div>
          <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-xl border bg-card animate-pulse" />
          <div className="h-80 rounded-xl border bg-card animate-pulse" />
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Error al cargar datos del dashboard</p>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "Clinicas Activas",
      value: kpis.clinicas.activas,
      sub: `${kpis.clinicas.total} totales`,
      change: kpis.clinicas.nuevas_este_mes > 0 ? `+${kpis.clinicas.nuevas_este_mes} este mes` : "Sin nuevas",
      changePositive: kpis.clinicas.nuevas_este_mes > 0,
      gradient: "from-emerald-500 to-teal-600",
      bgGlow: "bg-emerald-500/10",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="16" height="20" x="4" y="2" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
        </svg>
      ),
      href: "/admin/clinicas",
    },
    {
      label: "MRR",
      value: `$${kpis.mrr.toLocaleString("es-AR")}`,
      sub: `${kpis.subscripciones.activas} suscripciones`,
      change: "Ingresos recurrentes",
      changePositive: true,
      gradient: "from-blue-500 to-[var(--ht-primary)]",
      bgGlow: "bg-blue-500/10",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      href: "/admin/suscripciones",
    },
    {
      label: "Trials Activos",
      value: kpis.subscripciones.trial,
      sub: `${kpis.subscripciones.trials_por_vencer} vencen pronto`,
      change: kpis.subscripciones.trials_por_vencer > 0 ? "Atencion requerida" : "Todo en orden",
      changePositive: kpis.subscripciones.trials_por_vencer === 0,
      gradient: "from-amber-500 to-orange-600",
      bgGlow: "bg-amber-500/10",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      href: "/admin/suscripciones",
    },
    {
      label: "Nuevas del Mes",
      value: kpis.clinicas.nuevas_este_mes,
      sub: `de ${kpis.clinicas.total} totales`,
      change: `${kpis.clinicas.inactivas} inactivas`,
      changePositive: kpis.clinicas.inactivas === 0,
      gradient: "from-[var(--ht-primary-light)] to-[#4aa89b]",
      bgGlow: "bg-[var(--ht-accent)]/10",
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72" /><path d="m14 7 3 3" /><path d="M5 6v4" /><path d="M19 14v4" /><path d="M10 2v2" /><path d="M7 8H3" /><path d="M21 16h-4" /><path d="M11 3H9" />
        </svg>
      ),
      href: "/admin/clinicas?is_active=false",
    },
  ];

  // Pie chart data
  const pieData = kpis.clinicas_por_plan.map((item) => ({
    name: item.plan_nombre,
    value: Number(item.cantidad),
  }));

  // Bar chart data for plans
  const barData = kpis.planes.map((plan) => {
    const match = kpis.clinicas_por_plan.find((c) => c.plan_id === plan.id);
    return {
      name: plan.nombre,
      clinicas: match ? Number(match.cantidad) : 0,
      precio: Number(plan.precio_mensual),
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Vista general de la plataforma —{" "}
          {new Date().toLocaleDateString("es-AR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
          >
            {/* Background glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${card.bgGlow} rounded-full -translate-y-1/2 translate-x-1/2 opacity-60 group-hover:opacity-100 transition-opacity`} />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.label}
                </p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}>
                  {card.icon}
                </div>
              </div>

              <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>

              <div className="mt-3 flex items-center gap-1.5">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  card.changePositive
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-amber-500/10 text-amber-500"
                }`}>
                  {card.change}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar chart — clínicas por plan */}
        <div className="lg:col-span-3 rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">Clinicas por Plan</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Distribucion actual de suscripciones
              </p>
            </div>
          </div>
          {barData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-muted-foreground">
              <svg className="h-12 w-12 mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 3v18h18" /><path d="M7 16v-3" /><path d="M12 16V9" /><path d="M17 16v-5" />
              </svg>
              <p className="text-sm">No hay datos todavia</p>
              <Link href="/admin/planes" className="text-xs text-primary hover:underline mt-1">
                Crear primer plan
              </Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [`${value} clinicas`, "Cantidad"]}
                />
                <Bar dataKey="clinicas" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart — distribución */}
        <div className="lg:col-span-2 rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold">Distribucion</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Porcentaje por plan
            </p>
          </div>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-muted-foreground">
              <p className="text-sm">Sin suscripciones activas</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Planes disponibles */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold">Planes Disponibles</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kpis.planes.filter((p) => p.is_active).length} planes activos
              </p>
            </div>
            <Link
              href="/admin/planes"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Ver todos →
            </Link>
          </div>
          {kpis.planes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-2">No hay planes creados</p>
              <Link
                href="/admin/planes"
                className="inline-flex items-center rounded-lg bg-[#0F172A] px-4 py-2 text-xs font-medium text-white hover:bg-[#0F172A] transition-colors"
              >
                + Crear Plan
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {kpis.planes.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-xl border p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0F172A]/10">
                      <CrownSmIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{plan.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {plan.max_usuarios} usuarios · {plan.max_pacientes ?? "∞"} pacientes
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold">
                    <span className="text-primary">
                      ${Number(plan.precio_mensual).toLocaleString("es-AR")}
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">/mes</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold">Resumen de Suscripciones</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Estado actual del sistema</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Activas", value: kpis.subscripciones.activas, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Trial", value: kpis.subscripciones.trial, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Por vencer", value: kpis.subscripciones.trials_por_vencer, color: "text-orange-500", bg: "bg-orange-500/10" },
              { label: "Total", value: kpis.subscripciones.total, color: "text-blue-500", bg: "bg-blue-500/10" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border p-4 text-center hover:bg-muted/30 transition-colors"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg} mb-2`}>
                  <span className={`text-lg font-bold ${stat.color}`}>{stat.value}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-5 pt-5 border-t space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Acciones rapidas
            </p>
            <Link
              href="/admin/clinicas"
              className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors group"
            >
              <span>Ver todas las clinicas</span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
            </Link>
            <Link
              href="/admin/suscripciones"
              className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors group"
            >
              <span>Gestionar suscripciones</span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
            </Link>
            <Link
              href="/admin/planes"
              className="flex items-center justify-between rounded-lg border px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors group"
            >
              <span>Administrar planes</span>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function CrownSmIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /><path d="M5.5 21h13" />
    </svg>
  );
}
