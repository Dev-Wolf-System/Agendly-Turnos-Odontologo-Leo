"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Repeat, Plus, Crown } from "lucide-react";
import {
  getAdminSubscriptions,
  getAdminClinicas,
  getAdminPlans,
  createAdminSubscription,
  updateAdminSubscription,
} from "@/services/admin.service";
import type {
  Subscription,
  AdminClinica,
  Plan,
  EstadoSubscription,
} from "@/types";
import { Input } from "@/components/ui/input";

type EstadoKey = EstadoSubscription;

const ESTADO_CONFIG: Record<
  EstadoKey,
  { tone: string; dot: string; label: string; tooltip: string }
> = {
  activa: {
    tone: "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
    dot: "bg-[var(--status-success-fg)]",
    label: "Activa",
    tooltip: "Suscripción activa con acceso completo",
  },
  inactiva: {
    tone: "bg-[var(--status-error-bg)] text-[var(--status-error-fg)]",
    dot: "bg-[var(--status-error-fg)]",
    label: "Inactiva",
    tooltip: "Suscripción suspendida por el administrador — acceso solo lectura",
  },
  cancelada: {
    tone: "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
    dot: "bg-[var(--status-neutral-fg)]",
    label: "Cancelada",
    tooltip: "La suscripción fue cancelada — sin acceso",
  },
  vencida: {
    tone: "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]",
    dot: "bg-[var(--status-warning-fg)]",
    label: "Vencida",
    tooltip: "El período de suscripción expiró — acceso solo lectura",
  },
};

const ESTADO_OPTIONS: EstadoKey[] = ["activa", "inactiva", "cancelada", "vencida"];

export default function AdminSuscripcionesPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [clinicas, setClinicas] = useState<AdminClinica[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterEstado, setFilterEstado] = useState<EstadoKey | "">("");

  const [form, setForm] = useState({
    clinica_id: "",
    plan_id: "",
    estado: "activa" as EstadoSubscription,
    fecha_inicio: new Date().toISOString().split("T")[0],
    fecha_fin: "",
    trial_ends_at: "",
    auto_renew: false,
  });

  const load = () => {
    setLoading(true);
    Promise.all([getAdminSubscriptions(), getAdminClinicas(), getAdminPlans()])
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

  const filtered = filterEstado ? subs.filter((s) => s.estado === filterEstado) : subs;

  const estadoCounts = ESTADO_OPTIONS.reduce((acc, e) => {
    acc[e] = subs.filter((s) => s.estado === e).length;
    return acc;
  }, {} as Record<string, number>);

  const selectClass =
    "w-full rounded-md border border-[var(--border-light)] bg-card px-4 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors hover:bg-[var(--muted)]/40 focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40 cursor-pointer";

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] shadow-[var(--shadow-primary)]">
              <Repeat className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Suscripciones
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Gestioná las suscripciones de todas las clínicas
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Asignar Plan
        </button>
      </div>

      {/* Estado summary pills */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => setFilterEstado("")}
          aria-pressed={!filterEstado}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40 ${
            !filterEstado
              ? "border-[var(--ht-primary)]/30 bg-[var(--ht-primary)]/10 font-semibold text-[var(--ht-primary)] shadow-[var(--shadow-card)]"
              : "border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] hover:bg-[var(--muted)]/40"
          }`}
        >
          <span className="flex h-2 w-2 rounded-full bg-[var(--text-primary)]" aria-hidden="true" />
          <span className="font-medium tabular-nums">{subs.length}</span>
          <span className="text-xs text-[var(--text-muted)]">Todas</span>
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
              aria-pressed={filterEstado === e}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40 ${
                filterEstado === e
                  ? `${config.tone} border-transparent font-semibold shadow-[var(--shadow-card)]`
                  : "border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] hover:bg-[var(--muted)]/40"
              }`}
            >
              <span className={`flex h-2 w-2 rounded-full ${config.dot}`} aria-hidden="true" />
              <span className="font-medium tabular-nums">{count}</span>
              <span className="text-xs text-[var(--text-muted)]">{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Create form */}
      {showForm && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] animate-in slide-in-from-top-2 duration-200">
          <div className="border-b border-[var(--border-light)] bg-[var(--muted)]/40 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Repeat className="h-4 w-4 text-[var(--ht-primary)]" aria-hidden="true" />
              Asignar Plan a Clínica
            </h2>
          </div>
          <form onSubmit={handleCreate} className="p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Clínica">
                <select
                  value={form.clinica_id}
                  onChange={(e) => setForm({ ...form, clinica_id: e.target.value })}
                  className={selectClass}
                  required
                >
                  <option value="">Seleccionar clínica...</option>
                  {clinicas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Plan">
                <select
                  value={form.plan_id}
                  onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                  className={selectClass}
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
              </Field>
              <Field label="Estado">
                <select
                  value={form.estado}
                  onChange={(e) =>
                    setForm({ ...form, estado: e.target.value as EstadoSubscription })
                  }
                  className={selectClass}
                >
                  {ESTADO_OPTIONS.map((e) => (
                    <option key={e} value={e}>
                      {e.charAt(0).toUpperCase() + e.slice(1)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha Inicio">
                <Input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  required
                />
              </Field>
              <Field label="Fecha Fin">
                <Input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  required
                />
              </Field>
              <Field label="Fin Trial" hint="(opcional)">
                <Input
                  type="date"
                  value={form.trial_ends_at}
                  onChange={(e) => setForm({ ...form, trial_ends_at: e.target.value })}
                />
              </Field>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-[var(--border-light)] p-3 transition-colors hover:bg-[var(--muted)]/50">
              <input
                type="checkbox"
                checked={form.auto_renew}
                onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })}
                className="h-4 w-4 rounded accent-[var(--ht-primary)]"
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">Auto-renovación</span>
            </label>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-[var(--border-light)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
              >
                Asignar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-light)] bg-slate-50/80 dark:bg-[var(--muted)]/40">
                <Th>Clínica</Th>
                <Th>Plan</Th>
                <Th align="center">Estado</Th>
                <Th align="center" className="hidden md:table-cell">Inicio</Th>
                <Th align="center" className="hidden md:table-cell">Vence</Th>
                <Th align="center" className="hidden lg:table-cell">Renovación</Th>
                <Th align="right">Acción</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-[var(--muted)] animate-pulse" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 w-28 rounded-md bg-[var(--muted)] animate-pulse" />
                          <div className="h-2.5 w-16 rounded-md bg-[var(--muted)] animate-pulse" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--muted)]">
                        <Repeat className="h-5 w-5 text-[var(--text-muted)]" aria-hidden="true" />
                      </div>
                      <p className="text-sm font-medium text-[var(--text-muted)]">
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
                      className="group transition-colors hover:bg-[var(--muted)]/30"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/admin/clinicas/${sub.clinica_id}`}
                          className="flex items-center gap-3 group/clinica-link"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-primary)]/10 to-[var(--ht-accent)]/10 text-xs font-bold text-[var(--ht-primary)] ring-1 ring-[var(--ht-primary)]/15 transition-colors group-hover/clinica-link:from-[var(--ht-primary)]/20 group-hover/clinica-link:to-[var(--ht-accent)]/20">
                            {sub.clinica?.nombre?.charAt(0)?.toUpperCase() ?? "C"}
                          </div>
                          <span className="text-sm font-semibold text-[var(--text-primary)] group-hover/clinica-link:text-[var(--ht-primary)] transition-colors">
                            {sub.clinica?.nombre ?? sub.clinica_id.slice(0, 8)}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--ht-primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--ht-primary)]">
                          <Crown className="h-3 w-3" aria-hidden="true" />
                          {sub.plan?.nombre ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span
                          className={`inline-flex cursor-help items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${config.tone}`}
                          title={config.tooltip}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden="true" />
                          {config.label}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-center md:table-cell">
                        <span className="text-sm text-[var(--text-muted)] tabular-nums">
                          {new Date(sub.fecha_inicio).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-center md:table-cell">
                        <span className="text-sm text-[var(--text-muted)] tabular-nums">
                          {new Date(sub.fecha_fin).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-center lg:table-cell">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                            sub.auto_renew
                              ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]"
                              : "bg-[var(--muted)] text-[var(--text-muted)]"
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
                          aria-label="Cambiar estado"
                          className="cursor-pointer rounded-md border border-[var(--border-light)] bg-card px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] opacity-70 outline-none transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
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

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
        {hint && (
          <span className="ml-1 normal-case tracking-normal font-normal text-[var(--text-muted)]/70">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function Th({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}) {
  const alignClass =
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <th
      className={`${alignClass} px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)] ${className}`}
    >
      {children}
    </th>
  );
}
