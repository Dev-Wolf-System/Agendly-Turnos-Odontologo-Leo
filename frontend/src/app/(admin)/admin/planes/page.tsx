"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Crown,
  Plus,
  Check,
  Pencil,
  Trash2,
  Download,
  Bot,
  MessageSquare,
  Building2,
  BarChart3,
  FileDown,
  Palette,
  Plug,
  ClipboardList,
  Star,
  Package,
  CreditCard,
  Truck,
} from "lucide-react";
import {
  getAdminPlans,
  createAdminPlan,
  updateAdminPlan,
  deleteAdminPlan,
  seedAdminPlans,
} from "@/services/admin.service";
import type { Plan } from "@/types";
import { Input } from "@/components/ui/input";

const FEATURE_OPTIONS = [
  { key: "whatsapp_agent", label: "Agente WhatsApp IA", Icon: Bot },
  { key: "whatsapp_reminders", label: "Recordatorios WhatsApp", Icon: MessageSquare },
  { key: "multi_consultorio", label: "Multi-Consultorio", Icon: Building2 },
  { key: "advanced_reports", label: "Reportes Avanzados", Icon: BarChart3 },
  { key: "csv_export", label: "Exportación CSV", Icon: FileDown },
  { key: "custom_branding", label: "Branding Personalizado", Icon: Palette },
  { key: "api_access", label: "Acceso API", Icon: Plug },
  { key: "audit_logs", label: "Registro de Auditoría", Icon: ClipboardList },
  { key: "priority_support", label: "Soporte Prioritario", Icon: Star },
  { key: "inventario", label: "Inventario", Icon: Package },
  { key: "pagos", label: "Gestión de Pagos", Icon: CreditCard },
  { key: "proveedores", label: "Proveedores", Icon: Truck },
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

  const load = async (autoSeed = false) => {
    setLoading(true);
    try {
      let data = await getAdminPlans();
      if (data.length === 0 && autoSeed) {
        await seedAdminPlans();
        data = await getAdminPlans();
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-accent-warm)] to-[var(--ht-accent-warm-dark)] shadow-[0_4px_20px_rgba(245,158,11,0.25)]">
              <Crown className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Planes
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Administrá los planes disponibles para las clínicas. Los cambios se reflejan en la landing page.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-95 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo Plan
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="overflow-hidden rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] animate-in slide-in-from-top-2 duration-200">
          <div className="border-b border-[var(--border-light)] bg-[var(--muted)]/40 px-5 py-3.5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Crown className="h-4 w-4 text-[var(--ht-primary)]" aria-hidden="true" />
              {editingId ? "Editar Plan" : "Nuevo Plan"}
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Name + Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre">
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Professional"
                  required
                />
              </Field>
              <Field label="Descripción" hint="(visible en landing)">
                <Input
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ideal para clínicas que..."
                />
              </Field>
            </div>

            {/* Price + Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Precio Mensual ($)">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.precio_mensual}
                  onChange={(e) =>
                    setForm({ ...form, precio_mensual: parseFloat(e.target.value) || 0 })
                  }
                  required
                />
              </Field>
              <Field label="Max. Usuarios">
                <Input
                  type="number"
                  min="1"
                  value={form.max_usuarios}
                  onChange={(e) =>
                    setForm({ ...form, max_usuarios: parseInt(e.target.value) || 1 })
                  }
                  required
                />
              </Field>
              <Field label="Max. Pacientes" hint="(vacío = ilimitado)">
                <Input
                  type="number"
                  min="0"
                  value={form.max_pacientes ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_pacientes: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </Field>
              <Field label="Orden" hint="(en landing)">
                <Input
                  type="number"
                  min="0"
                  value={form.orden}
                  onChange={(e) =>
                    setForm({ ...form, orden: parseInt(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-4">
              <ToggleCheckbox
                checked={form.is_active}
                onChange={() => setForm({ ...form, is_active: !form.is_active })}
                label="Activo"
              />
              <ToggleCheckbox
                checked={form.is_highlighted}
                onChange={() => setForm({ ...form, is_highlighted: !form.is_highlighted })}
                label="Destacado en landing"
                tag={{ text: "Más popular", tone: "warning" }}
              />
              <ToggleCheckbox
                checked={form.is_default_trial}
                onChange={() =>
                  setForm({ ...form, is_default_trial: !form.is_default_trial })
                }
                label="Plan Trial por defecto"
                tag={{ text: "Auto-asignado al registrarse", tone: "success" }}
              />
            </div>

            {/* Features */}
            <div className="space-y-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Features incluidas
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {FEATURE_OPTIONS.map(({ key, label, Icon }) => {
                  const active = !!form.features[key];
                  return (
                    <label
                      key={key}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-all duration-200 ${
                        active
                          ? "border-[var(--ht-primary)]/40 bg-[var(--ht-primary)]/5 ring-1 ring-[var(--ht-primary)]/20"
                          : "border-[var(--border-light)] hover:bg-[var(--muted)]/50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleFeature(key)}
                        className="h-4 w-4 rounded accent-[var(--ht-primary)]"
                      />
                      <Icon className="h-4 w-4 text-[var(--ht-primary)]" aria-hidden="true" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[var(--border-light)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
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
            <div
              key={i}
              className="h-72 rounded-xl border border-[var(--border-light)] bg-card animate-pulse"
            />
          ))}
        </div>
      ) : planes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--border-light)] bg-card py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--muted)]">
            <Crown className="h-6 w-6 text-[var(--text-muted)]" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">
            No se pudieron cargar los planes predefinidos
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => load(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Reintentar
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ht-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--ht-primary)] transition-colors hover:bg-[var(--ht-primary)]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
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
                className={`group relative overflow-hidden rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 ${
                  !plan.is_active ? "opacity-60" : ""
                }`}
              >
                <div
                  className="h-1 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)]"
                  aria-hidden="true"
                />

                {!plan.is_active && (
                  <div className="absolute top-0 left-0 z-10" aria-hidden="true">
                    <div className="-translate-x-6 translate-y-3 -rotate-45 bg-[var(--status-error-fg)] px-8 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                      Inactivo
                    </div>
                  </div>
                )}
                {plan.is_highlighted && (
                  <div className="pointer-events-none absolute -top-1 -right-1 z-10 h-24 w-24 overflow-hidden" aria-hidden="true">
                    <div className="absolute top-[12px] right-[-28px] w-[120px] rotate-45 bg-gradient-to-r from-[var(--ht-accent-warm)] to-[var(--ht-accent-warm-dark)] py-1 text-center text-[9px] font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                      Destacado
                    </div>
                  </div>
                )}
                {plan.is_default_trial && (
                  <div className="pointer-events-none absolute -top-1 -right-1 z-10 h-24 w-24 overflow-hidden" aria-hidden="true">
                    <div
                      className={`absolute right-[-28px] w-[120px] rotate-45 bg-gradient-to-r from-[var(--status-success-fg)] to-[var(--ht-accent-dark)] py-1 text-center text-[9px] font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] ${
                        plan.is_highlighted ? "top-[28px]" : "top-[12px]"
                      }`}
                    >
                      Trial
                    </div>
                  </div>
                )}

                <div className="p-5 pt-4">
                  <div className="flex items-center gap-2">
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--text-primary)]">
                      {plan.nombre}
                    </h3>
                    <span className="text-xs text-[var(--text-muted)]/70">#{plan.orden}</span>
                  </div>
                  {plan.descripcion && (
                    <p className="mt-1 line-clamp-2 text-xs text-[var(--text-muted)]">
                      {plan.descripcion}
                    </p>
                  )}
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums text-transparent">
                      ${Number(plan.precio_mensual).toLocaleString("es-AR")}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">/mes</span>
                  </div>

                  {/* Limits */}
                  <div className="mt-4 space-y-2.5">
                    <div className="flex items-center justify-between rounded-lg bg-[var(--muted)]/50 px-3 py-2">
                      <span className="text-xs text-[var(--text-muted)]">Usuarios</span>
                      <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                        {plan.max_usuarios}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[var(--muted)]/50 px-3 py-2">
                      <span className="text-xs text-[var(--text-muted)]">Pacientes</span>
                      <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                        {plan.max_pacientes ?? (
                          <span className="text-[var(--ht-primary)]">Ilimitado</span>
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
                            className="inline-flex items-center gap-1 rounded-lg bg-[var(--ht-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--ht-primary)]"
                          >
                            <Check className="h-2.5 w-2.5" aria-hidden="true" />
                            {feat?.label ?? key}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-[var(--border-light)] bg-[var(--muted)]/30 px-5 py-3">
                  <button
                    onClick={() => startEdit(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-light)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
                  >
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--status-error-fg)] transition-colors hover:bg-[var(--status-error-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-error-fg)]/40"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
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
          <span className="normal-case tracking-normal font-normal text-[var(--text-muted)]/70 ml-1">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function ToggleCheckbox({
  checked,
  onChange,
  label,
  tag,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  tag?: { text: string; tone: "warning" | "success" };
}) {
  const tagClass =
    tag?.tone === "warning"
      ? "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]"
      : "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]";
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded accent-[var(--ht-primary)]"
      />
      <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
      {tag && (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagClass}`}>
          {tag.text}
        </span>
      )}
    </label>
  );
}
