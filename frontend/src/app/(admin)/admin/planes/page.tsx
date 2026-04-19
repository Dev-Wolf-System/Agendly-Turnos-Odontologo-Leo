"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Crown, Plus, Check, Pencil, Trash2, Download, X,
  Bot, MessageSquare, Building2, BarChart3, FileDown,
  Palette, Plug, ClipboardList, Star, Package, CreditCard,
  Truck, Globe, Users, Eye, EyeOff, Network,
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
import { Switch } from "@/components/ui/switch";

/* ─── Feature options ─── */

const FEATURE_OPTIONS = [
  { key: "whatsapp_agent",     label: "Agente WhatsApp IA",      Icon: Bot },
  { key: "whatsapp_reminders", label: "Recordatorios WhatsApp",  Icon: MessageSquare },
  { key: "multi_consultorio",  label: "Multi-Consultorio",        Icon: Building2 },
  { key: "multi_sucursal",     label: "Multi-Sucursal",           Icon: Network },
  { key: "advanced_reports",   label: "Reportes Avanzados",       Icon: BarChart3 },
  { key: "csv_export",         label: "Exportación CSV",          Icon: FileDown },
  { key: "custom_branding",    label: "Branding Personalizado",   Icon: Palette },
  { key: "api_access",         label: "Acceso API",               Icon: Plug },
  { key: "audit_logs",         label: "Registro de Auditoría",    Icon: ClipboardList },
  { key: "priority_support",   label: "Soporte Prioritario",      Icon: Star },
  { key: "inventario",         label: "Inventario",               Icon: Package },
  { key: "pagos",              label: "Gestión de Pagos",         Icon: CreditCard },
  { key: "proveedores",        label: "Proveedores",              Icon: Truck },
];

const ROLE_OPTIONS = [
  { value: "admin",       label: "Administrador completo",  desc: "Acceso a todas las secciones del panel" },
  { value: "turnos_only", label: "Solo Turnos",             desc: "Panel limitado: pacientes, turnos y configuración básica" },
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
  show_in_landing: true,
  default_role: "admin",
  orden: 0,
  is_active: true,
};

/* ─── Page ─── */

export default function AdminPlanesPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (autoSeed = false) => {
    setLoading(true);
    try {
      let data = await getAdminPlans();
      if (data.length === 0 && autoSeed) {
        await seedAdminPlans();
        data = await getAdminPlans();
      }
      setPlanes(data);
    } catch {
      toast.error("Error al cargar los planes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(true); }, [load]);

  /* close with Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closePanel(); };
    if (showPanel) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showPanel]);

  const closePanel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowPanel(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowPanel(true);
  };

  const openEdit = (plan: Plan) => {
    setForm({
      nombre:          plan.nombre,
      descripcion:     plan.descripcion ?? "",
      precio_mensual:  Number(plan.precio_mensual),
      max_usuarios:    plan.max_usuarios,
      max_pacientes:   plan.max_pacientes,
      features:        plan.features ?? {},
      is_highlighted:  plan.is_highlighted ?? false,
      is_default_trial: plan.is_default_trial ?? false,
      show_in_landing: plan.show_in_landing ?? true,
      default_role:    plan.default_role ?? "admin",
      orden:           plan.orden ?? 0,
      is_active:       plan.is_active,
    });
    setEditingId(plan.id);
    setShowPanel(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateAdminPlan(editingId, form as any);
        toast.success("Plan actualizado");
      } else {
        await createAdminPlan(form as any);
        toast.success("Plan creado");
      }
      closePanel();
      load();
    } catch {
      toast.error("Error al guardar el plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este plan? Esta acción no se puede deshacer.")) return;
    try {
      await deleteAdminPlan(id);
      toast.success("Plan eliminado");
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Error al eliminar el plan");
    }
  };

  const toggleFeature = (key: string) =>
    setForm((p) => ({ ...p, features: { ...p.features, [key]: !p.features[key] } }));

  const set = (patch: Partial<typeof emptyForm>) => setForm((p) => ({ ...p, ...patch }));

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-accent-warm)] to-[var(--ht-accent-warm-dark)] shadow-[0_4px_20px_rgba(245,158,11,0.25)]">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Planes
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Administrá los planes disponibles. Controlá qué planes aparecen en la landing page.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-95 hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
        >
          <Plus className="h-4 w-4" />
          Nuevo Plan
        </button>
      </div>

      {/* Plan cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-72 rounded-xl border border-[var(--border-light)] bg-card animate-pulse" />
          ))}
        </div>
      ) : planes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--border-light)] bg-card py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--muted)]">
            <Crown className="h-6 w-6 text-[var(--text-muted)]" />
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">No hay planes configurados</p>
          <div className="flex gap-3">
            <button
              onClick={() => load(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-95"
            >
              <Download className="h-3.5 w-3.5" />
              Cargar predefinidos
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ht-primary)]/10 px-4 py-2 text-sm font-medium text-[var(--ht-primary)] transition-colors hover:bg-[var(--ht-primary)]/15"
            >
              <Plus className="h-3.5 w-3.5" />
              Crear manualmente
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {planes.map((plan) => {
            const activeFeatures = Object.entries(plan.features ?? {}).filter(([, v]) => v);
            const isHidden = plan.show_in_landing === false;
            return (
              <div
                key={plan.id}
                className={`group relative overflow-hidden rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 ${
                  !plan.is_active ? "opacity-55" : ""
                }`}
              >
                <div className="h-1 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)]" />

                {/* Corner ribbons */}
                {!plan.is_active && (
                  <div className="absolute top-0 left-0 z-10">
                    <div className="-translate-x-6 translate-y-3 -rotate-45 bg-[var(--status-error-fg)] px-8 py-1 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                      Inactivo
                    </div>
                  </div>
                )}
                {plan.is_highlighted && (
                  <div className="pointer-events-none absolute -top-1 -right-1 z-10 h-24 w-24 overflow-hidden">
                    <div className="absolute top-[12px] right-[-28px] w-[120px] rotate-45 bg-gradient-to-r from-[var(--ht-accent-warm)] to-[var(--ht-accent-warm-dark)] py-1 text-center text-[9px] font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                      Destacado
                    </div>
                  </div>
                )}
                {plan.is_default_trial && (
                  <div className="pointer-events-none absolute -top-1 -right-1 z-10 h-24 w-24 overflow-hidden">
                    <div className={`absolute right-[-28px] w-[120px] rotate-45 bg-gradient-to-r from-[var(--status-success-fg)] to-[var(--ht-accent-dark)] py-1 text-center text-[9px] font-bold uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] ${plan.is_highlighted ? "top-[28px]" : "top-[12px]"}`}>
                      Trial
                    </div>
                  </div>
                )}

                <div className="p-5 pt-4">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--text-primary)] truncate">
                        {plan.nombre}
                      </h3>
                      {plan.descripcion && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--text-muted)]">{plan.descripcion}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]/70 mt-1">#{plan.orden}</span>
                  </div>

                  {/* Price */}
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text font-[family-name:var(--font-display)] text-3xl font-bold tabular-nums text-transparent">
                      ${Number(plan.precio_mensual).toLocaleString("es-AR")}
                    </span>
                    <span className="text-sm text-[var(--text-muted)]">/mes</span>
                  </div>

                  {/* Meta badges */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${isHidden ? "bg-[var(--muted)] text-[var(--text-muted)]" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}>
                      {isHidden ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                      {isHidden ? "Oculto en landing" : "Visible en landing"}
                    </span>
                    {plan.default_role === "turnos_only" && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-2 py-0.5 text-[10px] font-semibold">
                        <Users className="h-2.5 w-2.5" />
                        Solo Turnos
                      </span>
                    )}
                  </div>

                  {/* Limits */}
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center justify-between rounded-lg bg-[var(--muted)]/50 px-3 py-1.5">
                      <span className="text-xs text-[var(--text-muted)]">Usuarios</span>
                      <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">{plan.max_usuarios}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-[var(--muted)]/50 px-3 py-1.5">
                      <span className="text-xs text-[var(--text-muted)]">Pacientes</span>
                      <span className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                        {plan.max_pacientes ?? <span className="text-[var(--ht-primary)]">Ilimitado</span>}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  {activeFeatures.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {activeFeatures.slice(0, 6).map(([key]) => {
                        const feat = FEATURE_OPTIONS.find((f) => f.key === key);
                        return (
                          <span key={key} className="inline-flex items-center gap-1 rounded-lg bg-[var(--ht-primary)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--ht-primary)]">
                            <Check className="h-2.5 w-2.5" />
                            {feat?.label ?? key}
                          </span>
                        );
                      })}
                      {activeFeatures.length > 6 && (
                        <span className="inline-flex items-center rounded-lg bg-[var(--muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">
                          +{activeFeatures.length - 6} más
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-[var(--border-light)] bg-[var(--muted)]/30 px-5 py-3">
                  <button
                    onClick={() => openEdit(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border-light)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-[var(--status-error-fg)] transition-colors hover:bg-[var(--status-error-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-error-fg)]/40"
                  >
                    <Trash2 className="h-3 w-3" />
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal centrado ── */}
      {showPanel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 animate-in fade-in duration-200"
            onClick={closePanel}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="flex w-full max-w-[560px] max-h-[90vh] flex-col bg-[var(--background)] rounded-2xl shadow-2xl border border-[var(--border-light)] animate-in zoom-in-95 fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--muted)]/30 px-6 py-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-accent-warm)] to-[var(--ht-accent-warm-dark)]">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                    {editingId ? "Editar Plan" : "Nuevo Plan"}
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {editingId ? "Modificá la configuración del plan" : "Configurá el nuevo plan de suscripción"}
                  </p>
                </div>
              </div>
              <button
                onClick={closePanel}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--muted)]/60 transition-colors"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* Section: Identificación */}
                <section className="space-y-4">
                  <SectionTitle>Identificación</SectionTitle>
                  <Field label="Nombre del plan">
                    <Input
                      value={form.nombre}
                      onChange={(e) => set({ nombre: e.target.value })}
                      placeholder="Ej: Avax Consultorio Pro"
                      required
                    />
                  </Field>
                  <Field label="Descripción" hint="visible en landing">
                    <Input
                      value={form.descripcion}
                      onChange={(e) => set({ descripcion: e.target.value })}
                      placeholder="Ideal para clínicas que..."
                    />
                  </Field>
                </section>

                {/* Section: Precios y límites */}
                <section className="space-y-4">
                  <SectionTitle>Precios y límites</SectionTitle>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Precio mensual ($)">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.precio_mensual}
                        onChange={(e) => set({ precio_mensual: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </Field>
                    <Field label="Orden en landing">
                      <Input
                        type="number"
                        min="0"
                        value={form.orden}
                        onChange={(e) => set({ orden: parseInt(e.target.value) || 0 })}
                      />
                    </Field>
                    <Field label="Máx. usuarios">
                      <Input
                        type="number"
                        min="1"
                        value={form.max_usuarios}
                        onChange={(e) => set({ max_usuarios: parseInt(e.target.value) || 1 })}
                        required
                      />
                    </Field>
                    <Field label="Máx. pacientes" hint="vacío = ilimitado">
                      <Input
                        type="number"
                        min="0"
                        value={form.max_pacientes ?? ""}
                        onChange={(e) =>
                          set({ max_pacientes: e.target.value ? parseInt(e.target.value) : null })
                        }
                      />
                    </Field>
                  </div>
                </section>

                {/* Section: Tipo de plan */}
                <section className="space-y-3">
                  <SectionTitle>Tipo de plan</SectionTitle>
                  <p className="text-xs text-[var(--text-muted)]">Define qué rol recibe el administrador de la clínica al usar este plan.</p>
                  <div className="space-y-2">
                    {ROLE_OPTIONS.map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all duration-150 ${
                          form.default_role === opt.value
                            ? "border-[var(--ht-primary)]/40 bg-[var(--ht-primary)]/5 ring-1 ring-[var(--ht-primary)]/20"
                            : "border-[var(--border-light)] hover:bg-[var(--muted)]/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="default_role"
                          value={opt.value}
                          checked={form.default_role === opt.value}
                          onChange={() => set({ default_role: opt.value })}
                          className="mt-0.5 accent-[var(--ht-primary)]"
                        />
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{opt.label}</p>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </section>

                {/* Section: Visibilidad y estado */}
                <section className="space-y-3">
                  <SectionTitle>Visibilidad y estado</SectionTitle>
                  <div className="space-y-2.5">
                    <ToggleRow
                      icon={<Globe className="h-4 w-4" />}
                      label="Mostrar en landing page"
                      desc="Los visitantes podrán ver y contratar este plan"
                      checked={form.show_in_landing}
                      onCheckedChange={(v) => set({ show_in_landing: v })}
                    />
                    <ToggleRow
                      icon={<Check className="h-4 w-4" />}
                      label="Plan activo"
                      desc="Permite que clínicas se suscriban a este plan"
                      checked={form.is_active}
                      onCheckedChange={(v) => set({ is_active: v })}
                    />
                    <ToggleRow
                      icon={<Star className="h-4 w-4 text-[var(--ht-accent-warm)]" />}
                      label="Destacado"
                      desc='Muestra el badge "Más popular" en la landing'
                      checked={form.is_highlighted}
                      onCheckedChange={(v) => set({ is_highlighted: v })}
                    />
                    <ToggleRow
                      icon={<Crown className="h-4 w-4 text-[var(--status-success-fg)]" />}
                      label="Plan Trial por defecto"
                      desc="Se asigna automáticamente al registrarse"
                      checked={form.is_default_trial}
                      onCheckedChange={(v) => set({ is_default_trial: v })}
                    />
                  </div>
                </section>

                {/* Section: Features */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <SectionTitle>Features incluidas</SectionTitle>
                    <span className="text-[10px] text-[var(--text-muted)] bg-[var(--muted)]/60 rounded-full px-2 py-0.5">
                      {Object.values(form.features).filter(Boolean).length} / {FEATURE_OPTIONS.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {FEATURE_OPTIONS.map(({ key, label, Icon }) => {
                      const active = !!form.features[key];
                      return (
                        <label
                          key={key}
                          className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 cursor-pointer transition-all duration-150 ${
                            active
                              ? "border-[var(--ht-primary)]/40 bg-[var(--ht-primary)]/5 ring-1 ring-[var(--ht-primary)]/20"
                              : "border-[var(--border-light)] hover:bg-[var(--muted)]/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleFeature(key)}
                            className="h-4 w-4 rounded accent-[var(--ht-primary)] shrink-0"
                          />
                          <Icon className={`h-4 w-4 shrink-0 ${active ? "text-[var(--ht-primary)]" : "text-[var(--text-muted)]"}`} />
                          <span className={`text-sm font-medium ${active ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}>{label}</span>
                          {active && <Check className="ml-auto h-3.5 w-3.5 text-[var(--ht-primary)] shrink-0" />}
                        </label>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Sticky footer */}
              <div className="shrink-0 border-t border-[var(--border-light)] bg-[var(--muted)]/20 px-6 py-4 flex gap-3">
                <button
                  type="button"
                  onClick={closePanel}
                  className="flex-1 rounded-xl border border-[var(--border-light)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--muted)]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2.5 text-sm font-medium text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
                >
                  {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear plan"}
                </button>
              </div>
            </form>
          </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
      {children}
    </p>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {label}
        {hint && <span className="normal-case tracking-normal font-normal text-[var(--text-muted)]/70 ml-1">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function ToggleRow({
  icon, label, desc, checked, onCheckedChange,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${checked ? "border-[var(--ht-primary)]/30 bg-[var(--ht-primary)]/5" : "border-[var(--border-light)]"}`}>
      <div className="flex items-center gap-3">
        <span className={`shrink-0 ${checked ? "text-[var(--ht-primary)]" : "text-[var(--text-muted)]"}`}>{icon}</span>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
          <p className="text-xs text-[var(--text-muted)]">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
