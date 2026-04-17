"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart, Line,
} from "recharts";
import {
  Building2,
  DollarSign,
  Clock,
  Sparkles,
  Crown,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  TimerReset,
  AlertTriangle,
  LayoutGrid,
} from "lucide-react";
import { getAdminDashboard, getAdminDashboardTrends } from "@/services/admin.service";
import type { AdminDashboardKPIs, AdminDashboardTrend } from "@/types";
import { KpiCard } from "@/components/ui/kpi-card";

const PIE_COLORS = [
  "var(--ht-primary)",
  "var(--ht-accent)",
  "var(--ht-primary-light)",
  "var(--ht-accent-dark)",
  "var(--ht-primary-dark)",
  "var(--ht-accent-warm)",
];

const CHART_TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid var(--border-light)",
  background: "var(--card)",
  fontSize: "12px",
  boxShadow: "var(--shadow-md)",
  color: "var(--text-primary)",
};

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminDashboardKPIs | null>(null);
  const [trends, setTrends] = useState<AdminDashboardTrend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAdminDashboard(),
      getAdminDashboardTrends().catch(() => []),
    ])
      .then(([kpiData, trendsData]) => {
        setKpis(kpiData);
        setTrends(trendsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-page-in space-y-8">
        <div>
          <div className="skeleton h-8 w-64 rounded-lg" />
          <div className="skeleton h-4 w-48 rounded mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-80 rounded-xl" />
          <div className="skeleton h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[var(--text-muted)]">Error al cargar datos del dashboard</p>
      </div>
    );
  }

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
    <div className="space-y-8 animate-page-in">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
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
        <div className="stagger-item animate-page-in">
          <KpiCard
            label="Clínicas Activas"
            value={kpis.clinicas.activas}
            sub={`${kpis.clinicas.total} totales`}
            icon={<Building2 className="h-5 w-5" />}
            variant="accent"
            href="/admin/clinicas"
            trend={
              kpis.clinicas.nuevas_este_mes > 0
                ? { value: `+${kpis.clinicas.nuevas_este_mes} este mes`, direction: "up" }
                : { value: "Sin nuevas", direction: "flat" }
            }
          />
        </div>
        <div className="stagger-item animate-page-in">
          <KpiCard
            label="MRR"
            value={`$${kpis.mrr.toLocaleString("es-AR")}`}
            sub={`${kpis.subscripciones.activas} suscripciones activas`}
            icon={<DollarSign className="h-5 w-5" />}
            variant="primary"
            href="/admin/suscripciones"
            trend={{ value: "Recurrente", direction: "up" }}
          />
        </div>
        <div className="stagger-item animate-page-in">
          <KpiCard
            label="Trials Activos"
            value={kpis.subscripciones.trial}
            sub={`${kpis.subscripciones.trials_por_vencer} vencen pronto`}
            icon={<Clock className="h-5 w-5" />}
            variant="warm"
            href="/admin/suscripciones"
            trend={
              kpis.subscripciones.trials_por_vencer > 0
                ? { value: "Atención", direction: "up", positive: false }
                : { value: "OK", direction: "flat" }
            }
          />
        </div>
        <div className="stagger-item animate-page-in">
          <KpiCard
            label="Nuevas del Mes"
            value={kpis.clinicas.nuevas_este_mes}
            sub={`${kpis.clinicas.inactivas} inactivas · ${kpis.clinicas.total} totales`}
            icon={<Sparkles className="h-5 w-5" />}
            variant="primary"
            href="/admin/clinicas?is_active=false"
          />
        </div>
      </div>

      {/* Trends chart */}
      {trends.length > 0 && (
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                Crecimiento — Últimos 6 meses
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Nuevas clínicas y MRR acumulado
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--ht-primary)]" />
                Clínicas nuevas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--ht-accent)]" />
                MRR ($)
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={trends} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradClinicas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ht-primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--ht-primary)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMRR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ht-accent)" stopOpacity={0.20} />
                  <stop offset="95%" stopColor="var(--ht-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border-light)" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="clinicas"
                orientation="left"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={28}
              />
              <YAxis
                yAxisId="mrr"
                orientation="right"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
                width={42}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                formatter={(value, name) => {
                  const n = Number(value ?? 0);
                  return String(name) === "nuevas_clinicas"
                    ? [`${n} clínicas`, "Nuevas clínicas"]
                    : [`$${n.toLocaleString("es-AR")}`, "MRR"];
                }}
              />
              <Area
                yAxisId="clinicas"
                type="monotone"
                dataKey="nuevas_clinicas"
                stroke="var(--ht-primary)"
                fill="url(#gradClinicas)"
                strokeWidth={2}
                dot={{ fill: "var(--ht-primary)", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
              <Line
                yAxisId="mrr"
                type="monotone"
                dataKey="mrr"
                stroke="var(--ht-accent)"
                strokeWidth={2}
                dot={{ fill: "var(--ht-accent)", r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                strokeDasharray="5 3"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Bar chart */}
        <div className="lg:col-span-3 rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                Clínicas por Plan
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Distribución actual de suscripciones
              </p>
            </div>
          </div>
          {barData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
              <BarChart3 className="h-12 w-12 mb-3 opacity-30" aria-hidden="true" />
              <p className="text-sm">No hay datos todavía</p>
              <Link href="/admin/planes" className="text-xs text-[var(--ht-primary)] hover:underline mt-1">
                Crear primer plan
              </Link>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value) => [`${value} clínicas`, "Cantidad"]}
                />
                <Bar dataKey="clinicas" fill="var(--ht-primary)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
              Distribución
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Porcentaje por plan</p>
          </div>
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
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
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        aria-hidden="true"
                      />
                      <span className="text-[var(--text-muted)] truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-[var(--text-primary)]">{item.value}</span>
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
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
                Planes Disponibles
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {kpis.planes.filter((p) => p.is_active).length} planes activos
              </p>
            </div>
            <Link
              href="/admin/planes"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--ht-primary)] hover:text-[var(--ht-primary-dark)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40 rounded"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
          {kpis.planes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-muted)] mb-3">No hay planes creados</p>
              <Link
                href="/admin/planes"
                className="inline-flex items-center rounded-lg bg-[var(--ht-primary)] px-4 py-2 text-xs font-medium text-white hover:bg-[var(--ht-primary-dark)] transition-colors shadow-[var(--shadow-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
              >
                Crear Plan
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {kpis.planes.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border-light)] p-4 transition-colors hover:bg-[var(--muted)]/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-primary)]/10 to-[var(--ht-accent)]/10 ring-1 ring-[var(--ht-primary)]/15">
                      <Crown className="h-5 w-5 text-[var(--ht-primary)]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{plan.nombre}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {plan.max_usuarios} usuarios · {plan.max_pacientes ?? "∞"} pacientes
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold tabular-nums shrink-0">
                    <span className="text-[var(--ht-primary)]">
                      ${Number(plan.precio_mensual).toLocaleString("es-AR")}
                    </span>
                    <span className="text-xs font-normal text-[var(--text-muted)]">/mes</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen suscripciones */}
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-5">
            <h2 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--text-primary)]">
              Resumen de Suscripciones
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Estado actual del sistema</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Activas",
                value: kpis.subscripciones.activas,
                Icon: CheckCircle2,
                tone: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
              },
              {
                label: "Trial",
                value: kpis.subscripciones.trial,
                Icon: TimerReset,
                tone: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
              },
              {
                label: "Por vencer",
                value: kpis.subscripciones.trials_por_vencer,
                Icon: AlertTriangle,
                tone: "bg-[var(--status-error-bg)] text-[var(--status-error-fg)]",
              },
              {
                label: "Total",
                value: kpis.subscripciones.total,
                Icon: LayoutGrid,
                tone: "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
              },
            ].map(({ label, value, Icon, tone }) => (
              <div
                key={label}
                className="rounded-xl border border-[var(--border-light)] p-4 text-center transition-colors hover:bg-[var(--muted)]/40"
              >
                <div className={`mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{value}</p>
                <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-5 pt-5 border-t border-[var(--border-light)] space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Acciones rápidas
            </p>
            {[
              { href: "/admin/clinicas", label: "Ver todas las clínicas" },
              { href: "/admin/suscripciones", label: "Gestionar suscripciones" },
              { href: "/admin/planes", label: "Administrar planes" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-center justify-between rounded-lg border border-[var(--border-light)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-all hover:border-[var(--ht-primary)]/30 hover:bg-[var(--muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
              >
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--ht-primary)]" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
