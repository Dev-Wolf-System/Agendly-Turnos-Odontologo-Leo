"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  seedAdminPlans,
} from "@/services/admin.service";
import type { Plan } from "@/types";

const FEATURE_OPTIONS = [
  { key: "whatsapp_agent", label: "Agente WhatsApp IA", icon: "🤖" },
  { key: "whatsapp_reminders", label: "Recordatorios WhatsApp", icon: "💬" },
  { key: "multi_consultorio", label: "Multi-Consultorio", icon: "🏥" },
  { key: "advanced_reports", label: "Reportes Avanzados", icon: "📊" },
  { key: "csv_export", label: "Exportacion CSV", icon: "📄" },
  { key: "custom_branding", label: "Branding Personalizado", icon: "🎨" },
  { key: "api_access", label: "Acceso API", icon: "🔌" },
  { key: "audit_logs", label: "Registro de Auditoria", icon: "📋" },
  { key: "priority_support", label: "Soporte Prioritario", icon: "⭐" },
  { key: "inventario", label: "Inventario", icon: "📦" },
  { key: "pagos", label: "Gestion de Pagos", icon: "💳" },
  { key: "proveedores", label: "Proveedores", icon: "🚚" },
];

const emptyForm = {
  nombre: "",
  descripcion: "",
  precio_mensual: 0,
  max_usuarios: 1,
  max_pacientes: null as number | null,
  features: {} as Record<string, boolean>,
  is_highlighted: false,
  is_default_trial: false,
  orden: 0,
  is_active: true,
};

export default function AdminPlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [seeding, setSeeding] = useState(false);

  const load = async (autoSeed = false) => {
    setLoading(true);
    try {
      let data = await getAdminPlans();
      if (data.length === 0 && autoSeed) {
        setSeeding(true);
        await seedAdminPlans();
        data = await getAdminPlans();
        setSeeding(false);
      }
      setPlanes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (plan: Plan) => {
    setForm({
      nombre: plan.nombre,
      descripcion: plan.descripcion ?? "",
      precio_mensual: Number(plan.precio_mensual),
      max_usuarios: plan.max_usuarios,
      max_pacientes: plan.max_pacientes,
      features: plan.features ?? {},
      is_highlighted: plan.is_highlighted ?? false,
      is_default_trial: plan.is_default_trial ?? false,
      orden: plan.orden ?? 0,
      is_active: plan.is_active,
    });
    setEditingId(plan.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAdminPlan(editingId, form as any);
      } else {
        await createAdminPlan(form as any);
      }
      resetForm();
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este plan? Esta acción no se puede deshacer.")) return;
    try {
      await deleteAdminPlan(id);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al eliminar el plan";
      toast.error(msg);
    }
  };

  const toggleFeature = (key: string) => {
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
  };

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-md shadow-amber-500/20">
              <CrownIcon className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Planes</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Administra los planes disponibles para las clinicas. Los cambios se reflejan en la landing page.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-2.5 text-sm font-medium text-white hover:from-[var(--ht-primary)] hover:to-[#4aa89b] transition-all shadow-md shadow-[var(--ht-primary)]/20 hover:shadow-lg hover:shadow-[var(--ht-primary)]/30"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo Plan
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="border-b px-5 py-3.5 bg-muted/20">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CrownIcon className="h-4 w-4 text-primary" />
              {editingId ? "Editar Plan" : "Nuevo Plan"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Name + Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nombre
                </label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Professional"
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Descripcion
                  <span className="normal-case tracking-normal font-normal text-muted-foreground/60 ml-1">
                    (visible en landing)
                  </span>
                </label>
                <input
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ideal para clinicas que..."
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Price + Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Precio Mensual ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_mensual}
                  onChange={(e) =>
                    setForm({ ...form, precio_mensual: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Max. Usuarios
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_usuarios}
                  onChange={(e) =>
                    setForm({ ...form, max_usuarios: parseInt(e.target.value) || 1 })
                  }
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Max. Pacientes
                  <span className="normal-case tracking-normal font-normal text-muted-foreground/60 ml-1">
                    (vacio = ilimitado)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.max_pacientes ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_pacientes: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Orden
                  <span className="normal-case tracking-normal font-normal text-muted-foreground/60 ml-1">
                    (en landing)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.orden}
                  onChange={(e) =>
                    setForm({ ...form, orden: parseInt(e.target.value) || 0 })
                  }
                  className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={() => setForm({ ...form, is_active: !form.is_active })}
                  className="rounded accent-[var(--ht-primary)] h-4 w-4"
                />
                <span className="text-sm font-medium">Activo</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_highlighted}
                  onChange={() => setForm({ ...form, is_highlighted: !form.is_highlighted })}
                  className="rounded accent-[var(--ht-primary)] h-4 w-4"
                />
                <span className="text-sm font-medium">Destacado en landing</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                  Mas popular
                </span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_default_trial}
                  onChange={() => setForm({ ...form, is_default_trial: !form.is_default_trial })}
                  className="rounded accent-[var(--ht-primary)] h-4 w-4"
                />
                <span className="text-sm font-medium">Plan Trial por defecto</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                  Auto-asignado al registrarse
                </span>
              </label>
            </div>

            {/* Features */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Features incluidas
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FEATURE_OPTIONS.map((feat) => (
                  <label
                    key={feat.key}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                      form.features[feat.key]
                        ? "border-primary/30 bg-[#0F172A]/5 ring-1 ring-primary/20"
                        : "hover:bg-muted/50 hover:border-muted-foreground/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!form.features[feat.key]}
                      onChange={() => toggleFeature(feat.key)}
                      className="rounded accent-[var(--ht-primary)] h-4 w-4"
                    />
                    <span className="text-sm font-medium">{feat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-2.5 text-sm font-medium text-white hover:from-[var(--ht-primary)] hover:to-[#4aa89b] transition-all shadow-md shadow-[var(--ht-primary)]/20"
              >
                {editingId ? "Guardar Cambios" : "Crear Plan"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Plan cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-72 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
      ) : planes.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 rounded-xl border bg-card">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
            <CrownIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No se pudieron cargar los planes predefinidos</p>
          <div className="flex gap-3">
            <button
              onClick={() => load(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2 text-sm font-medium text-white hover:from-[var(--ht-primary)] hover:to-[#4aa89b] transition-all shadow-md shadow-[var(--ht-primary)]/20"
            >
              <DownloadIcon className="h-3.5 w-3.5" />
              Reintentar
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A]/10 px-4 py-2 text-sm font-medium text-primary hover:bg-[#0F172A]/20 transition-colors"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Crear manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {planes.map((plan) => {
            const activeFeatures = Object.entries(plan.features ?? {}).filter(([, v]) => v);
            return (
              <div
                key={plan.id}
                className={`group relative rounded-xl border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
                  !plan.is_active ? "opacity-50" : ""
                }`}
              >
                {/* Top gradient bar */}
                <div className="h-1 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)]" />

                {/* Badges */}
                <div className="absolute top-4 right-4 flex flex-wrap gap-1.5">
                  {!plan.is_active && (
                    <span className="rounded-lg bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-red-500 uppercase tracking-wider">
                      Inactivo
                    </span>
                  )}
                  {plan.is_highlighted && (
                    <span className="rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold text-amber-600 uppercase tracking-wider">
                      Destacado
                    </span>
                  )}
                  {plan.is_default_trial && (
                    <span className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                      Trial
                    </span>
                  )}
                </div>

                <div className="p-5 pt-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">{plan.nombre}</h3>
                    <span className="text-xs text-muted-foreground/60">#{plan.orden}</span>
                  </div>
                  {plan.descripcion && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {plan.descripcion}
                    </p>
                  )}
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text text-transparent">
                      ${Number(plan.precio_mensual).toLocaleString("es-AR")}
                    </span>
                    <span className="text-sm text-muted-foreground">/mes</span>
                  </div>

                  {/* Limits */}
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Usuarios</span>
                      <span className="text-sm font-semibold">{plan.max_usuarios}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <span className="text-xs text-muted-foreground">Pacientes</span>
                      <span className="text-sm font-semibold">
                        {plan.max_pacientes ?? (
                          <span className="text-primary">Ilimitado</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  {activeFeatures.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {activeFeatures.map(([key]) => {
                        const feat = FEATURE_OPTIONS.find((f) => f.key === key);
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#0F172A]/[0.07] px-2 py-0.5 text-[10px] font-semibold text-primary dark:text-primary/90"
                          >
                            <CheckIcon className="h-2.5 w-2.5" />
                            {feat?.label ?? key}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="border-t px-5 py-3 flex gap-2 bg-muted/10">
                  <button
                    onClick={() => startEdit(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    <EditIcon className="h-3 w-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <TrashIcon className="h-3 w-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Icons ─── */

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /><path d="M5.5 21h13" />
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

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}
