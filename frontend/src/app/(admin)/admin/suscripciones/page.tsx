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

const ESTADO_COLORS: Record<string, string> = {
  trial: "bg-amber-500/10 text-amber-500",
  activa: "bg-emerald-500/10 text-emerald-500",
  suspendida: "bg-red-500/10 text-red-500",
  cancelada: "bg-slate-500/10 text-slate-500",
  vencida: "bg-orange-500/10 text-orange-500",
};

const ESTADO_OPTIONS: EstadoSubscription[] = [
  "trial",
  "activa",
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Suscripciones</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {subs.length} suscripciones totales
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
        >
          + Asignar Plan
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-4">Asignar Plan a Clínica</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Clínica</label>
                <select
                  value={form.clinica_id}
                  onChange={(e) => setForm({ ...form, clinica_id: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {clinicas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Plan</label>
                <select
                  value={form.plan_id}
                  onChange={(e) => setForm({ ...form, plan_id: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  <option value="">Seleccionar...</option>
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
                <label className="text-sm font-medium">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) =>
                    setForm({ ...form, estado: e.target.value as EstadoSubscription })
                  }
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {ESTADO_OPTIONS.map((e) => (
                    <option key={e} value={e}>
                      {e.charAt(0).toUpperCase() + e.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fecha Inicio</label>
                <input
                  type="date"
                  value={form.fecha_inicio}
                  onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Fecha Fin</label>
                <input
                  type="date"
                  value={form.fecha_fin}
                  onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Fin Trial{" "}
                  <span className="text-xs text-muted-foreground">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={form.trial_ends_at}
                  onChange={(e) => setForm({ ...form, trial_ends_at: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.auto_renew}
                onChange={(e) => setForm({ ...form, auto_renew: e.target.checked })}
                className="rounded accent-indigo-500"
              />
              <span className="text-sm">Auto-renovación</span>
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition-colors"
              >
                Asignar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Todos los estados</option>
          {ESTADO_OPTIONS.map((e) => (
            <option key={e} value={e}>
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium px-4 py-3">Clínica</th>
                <th className="text-left font-medium px-4 py-3">Plan</th>
                <th className="text-center font-medium px-4 py-3">Estado</th>
                <th className="text-center font-medium px-4 py-3 hidden md:table-cell">Inicio</th>
                <th className="text-center font-medium px-4 py-3 hidden md:table-cell">Vence</th>
                <th className="text-center font-medium px-4 py-3 hidden lg:table-cell">Auto-renew</th>
                <th className="text-right font-medium px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No hay suscripciones
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {sub.clinica?.nombre ?? sub.clinica_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-500">
                        {sub.plan?.nombre ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          ESTADO_COLORS[sub.estado] ?? ""
                        }`}
                      >
                        {sub.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground">
                      {new Date(sub.fecha_inicio).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground">
                      {new Date(sub.fecha_fin).toLocaleDateString("es-AR")}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {sub.auto_renew ? "✓" : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={sub.estado}
                        onChange={(e) =>
                          changeEstado(sub.id, e.target.value as EstadoSubscription)
                        }
                        className="rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        {ESTADO_OPTIONS.map((e) => (
                          <option key={e} value={e}>
                            {e.charAt(0).toUpperCase() + e.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
