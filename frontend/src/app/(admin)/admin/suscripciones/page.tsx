"use client";

import { useState, useEffect } from "react";
import {
  getAdminSubscriptions,
  getAdminClinicas,
  getAdminPlans,
  createAdminSubscription,
  updateAdminSubscription,
} from "@/services/admin.service";
import type { Subscription, AdminClinica, Plan, EstadoSubscription } from "@/types";

const ESTADO_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string; tooltip: string }> = {
  trial: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", label: "Prueba", tooltip: "Período de prueba gratuito con acceso limitado al plan seleccionado" },
  activa: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", label: "Activa", tooltip: "Suscripción activa con pagos al día" },
  past_due: { bg: "bg-yellow-500/10", text: "text-yellow-600 dark:text-yellow-400", dot: "bg-yellow-500", label: "Pago Pendiente", tooltip: "El pago está vencido pero el servicio sigue activo temporalmente" },
  gracia: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500", label: "En Gracia", tooltip: "Período de gracia después del trial — acceso limitado hasta activar un plan pago" },
  suspendida: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500", label: "Suspendida", tooltip: "Acceso denegado por falta de pago. Se requiere regularizar para continuar" },
  cancelada: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500", label: "Cancelada", tooltip: "La suscripción fue cancelada por el cliente o el administrador" },
  vencida: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500", label: "Vencida", tooltip: "El período de suscripción expiró. Se debe renovar para continuar" },
};

const ESTADO_OPTIONS: EstadoSubscription[] = [
  "trial",
  "activa",
  "past_due",
  "gracia",
  "suspendida",
  "cancelada",
  "vencida",
];

export default function AdminSuscripcionesPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [clinicas, setClinicas] = useState<AdminClinica[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterEstado, setFilterEstado] = useState("");

  const [form, setForm] = useState({
    clinica_id: "",
    plan_id: "",
    estado: "trial" as EstadoSubscription,
    fecha_inicio: new Date().toISOString().split("T")[0],
    fecha_fin: "",
    trial_ends_at: "",
    auto_renew: false,
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      getAdminSubscriptions(),
      getAdminClinicas(),
      getAdminPlans(),
    ])
      .then(([s, c, p]) => {
        setSubs(s);
        setClinicas(c);
        setPlanes(p);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAdminSubscription({
        ...form,
        trial_ends_at: form.trial_ends_at || undefined,
      });
      setShowForm(false);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const changeEstado = async (id: string, estado: EstadoSubscription) => {
    try {
      await updateAdminSubscription(id, { estado } as any);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = filterEstado
    ? subs.filter((s) => s.estado === filterEstado)
    : subs;

  // Summary counts
  const estadoCounts = ESTADO_OPTIONS.reduce((acc, e) => {
    acc[e] = subs.filter((s) => s.estado === e).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-primary-light)] to-[#4aa89b] shadow-md shadow-[var(--ht-primary-light)]/20">
              <RepeatIcon className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Suscripciones</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona las suscripciones de todas las clinicas
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-2.5 text-sm font-medium text-white hover:from-[var(--ht-primary)] hover:to-[#4aa89b] transition-all shadow-md shadow-[var(--ht-primary)]/20 hover:shadow-lg hover:shadow-[var(--ht-primary)]/30"
        >
          <PlusIcon className="h-4 w-4" />
          Asignar Plan
        </button>
      </div>

      {/* Estado summary pills */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setFilterEstado("")}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
            !filterEstado
              ? "bg-[#0F172A]/10 border-primary/20 text-primary dark:text-primary/90 font-semibold shadow-sm"
              : "bg-card hover:bg-muted/50 shadow-sm"
          }`}
        >
          <span className="flex h-2 w-2 rounded-full bg-[#0F172A]" />
          <span className="font-medium">{subs.length}</span>
          <span className="text-xs text-muted-foreground">Todas</span>
        </button>
        {ESTADO_OPTIONS.map((e) => {
          const config = ESTADO_CONFIG[e];
          const count = estadoCounts[e] || 0;
          if (count === 0 && filterEstado !== e) return null;
          return (
            <button
              key={e}
              onClick={() => setFilterEstado(filterEstado === e ? "" : e)}
              title={config.tooltip}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                filterEstado === e
                  ? `${config.bg} border-transparent ${config.text} font-semibold shadow-sm`
                  : "bg-card hover:bg-muted/50 shadow-sm"
              }`}
            >
              <span className={`flex h-2 w-2 rounded-full ${config.dot}`} />
              <span className="font-medium">{count}</span>
              <span className="text-xs text-muted-foreground">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="border-b px-5 py-3.5 bg-muted/20">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <RepeatIcon className="h-4 w-4 text-primary" />
              Asignar Plan a Clinica
            </h2>
          </div>
          <form onSubmit={handleCreate} className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Clinica
                </label>
                <select
                  value={form.clinica_id}
                  onChange={(e) => setForm({ ...form, clinica_id: e.target.value })}
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  required
                >
                  <option value="">Seleccionar clinica...</option>
                  {clinicas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Plan
                </label>
                <select
                  value={form.plan_id}
                  onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                  required
                >
                  <option value="">Seleccionar plan...</option>
                  {planes
                    .filter((p) => p.is_active)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — ${Number(p.precio_mensual).toLocaleString("es-AR")}/mes
                      </option>
                    ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Estado
                </label>
                <select
                  value={form.estado}
                  onChange={(e) =>
                    setForm({ ...form, estado: e.target.value as EstadoSubscription })
                  }
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  {ESTADO_OPTIONS.map((e) => (
                    <option key={e} value={e}>
                      {e.charAt(0).toUpperCase() + e.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Fin Trial
                  <span className="normal-case tracking-normal font-normal text-muted-foreground/60 ml-1">
                    (opcional)
                  </span>
                </label>
                <input
                  type="date"
                  value={form.trial_ends_at}
                  onChange={(e) => setForm({ ...form, trial_ends_at: e.target.value })}
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            <label className="inline-flex items-center gap-2.5 cursor-pointer rounded-xl border p-3 hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={form.auto_renew}
                onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })}
                className="rounded accent-[var(--ht-primary)] h-4 w-4"
              />
              <span className="text-sm font-medium">Auto-renovacion</span>
            </label>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-2.5 text-sm font-medium text-white hover:from-[var(--ht-primary)] hover:to-[#4aa89b] transition-all shadow-md shadow-[var(--ht-primary)]/20"
              >
                Asignar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                  Clinica
                </th>
                <th className="text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                  Plan
                </th>
                <th className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                  Estado
                </th>
                <th className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground px-5 py-3.5 hidden md:table-cell">
                  Inicio
                </th>
                <th className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground px-5 py-3.5 hidden md:table-cell">
                  Vence
                </th>
                <th className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground px-5 py-3.5 hidden lg:table-cell">
                  Renovacion
                </th>
                <th className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground px-5 py-3.5">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted animate-pulse" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3.5 w-28 bg-muted rounded-md animate-pulse" />
                          <div className="h-2.5 w-16 bg-muted rounded-md animate-pulse" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                        <RepeatIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        No hay suscripciones
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const config = ESTADO_CONFIG[sub.estado] ?? ESTADO_CONFIG.cancelada;
                  return (
                    <tr
                      key={sub.id}
                      className="group hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-primary-light)]/10 to-[var(--ht-accent-dark)]/10 text-[var(--ht-accent)] dark:text-[#9dddd3] text-xs font-bold ring-1 ring-[var(--ht-primary-light)]/10">
                            {sub.clinica?.nombre?.charAt(0)?.toUpperCase() ?? "C"}
                          </div>
                          <span className="font-semibold text-sm">
                            {sub.clinica?.nombre ?? sub.clinica_id.slice(0, 8)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#0F172A]/10 px-2.5 py-1 text-[11px] font-semibold text-primary dark:text-primary/90">
                          <CrownIcon className="h-3 w-3" />
                          {sub.plan?.nombre ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${config.bg} ${config.text} cursor-help`}
                          title={config.tooltip}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {new Date(sub.fecha_inicio).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden md:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {new Date(sub.fecha_fin).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            sub.auto_renew
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {sub.auto_renew ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <select
                          value={sub.estado}
                          onChange={(e) =>
                            changeEstado(sub.id, e.target.value as EstadoSubscription)
                          }
                          className="rounded-xl border bg-background px-3 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          {ESTADO_OPTIONS.map((e) => (
                            <option key={e} value={e}>
                              {e.charAt(0).toUpperCase() + e.slice(1)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Icons ─── */

function RepeatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="M12 5v14" />
    </svg>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /><path d="M5.5 21h13" />
    </svg>
  );
}
