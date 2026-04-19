"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ChevronRight, Building2, Users, Heart,
  Calendar, Clock, Info, Crown, Webhook, Trash2, XCircle, CreditCard,
} from "lucide-react";
import {
  getAdminClinicaById,
  updateAdminClinica,
  deleteAdminClinica,
} from "@/services/admin.service";
import api from "@/services/api";
import type { AdminClinica } from "@/types";
import { formatPhone } from "@/lib/utils";

const ESTADO_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  activa: { bg: "bg-[var(--ht-accent)]/10", text: "text-[var(--status-success-fg)]", dot: "bg-[var(--ht-accent)]" },
  inactiva: { bg: "bg-[var(--status-error)]/10", text: "text-[var(--status-error-fg)]", dot: "bg-[var(--status-error)]" },
  cancelada: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500" },
  vencida: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
};

const WEBHOOK_ESTADOS = [
  { key: "confirmado", label: "Turno Confirmado", color: "bg-[var(--ht-primary)]" },
  { key: "completado", label: "Turno Completado", color: "bg-[var(--ht-accent)]" },
  { key: "cancelado", label: "Turno Cancelado", color: "bg-[var(--status-error)]" },
  { key: "perdido", label: "Turno Perdido", color: "bg-[var(--ht-accent-warm)]" },
  { key: "pendiente", label: "Turno Creado", color: "bg-[var(--ht-accent-warm)]" },
  { key: "recordatorio", label: "Recordatorio", color: "bg-[var(--ht-accent)]" },
];

export default function AdminClinicaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [clinica, setClinica] = useState<AdminClinica | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Webhooks state
  const [webhooks, setWebhooks] = useState<Record<string, { url: string; activo: boolean }>>({});
  const [isSavingWebhooks, setIsSavingWebhooks] = useState(false);

  // Evolution API state
  const [evolutionInstance, setEvolutionInstance] = useState("");
  const [evolutionApiKey, setEvolutionApiKey] = useState("");
  const [showEvolutionKey, setShowEvolutionKey] = useState(false);
  const [isSavingEvolution, setIsSavingEvolution] = useState(false);

  // Mercado Pago state
  const [mpConfigured, setMpConfigured] = useState(false);
  const [mpForm, setMpForm] = useState({ access_token: "", public_key: "" });
  const [isSavingMp, setIsSavingMp] = useState(false);
  const [mpError, setMpError] = useState("");

  const loadClinica = () => {
    setLoading(true);
    setLoadError(null);
    getAdminClinicaById(id)
      .then((c) => {
        setClinica(c);
        setWebhooks((c as any).webhooks || {});
        setEvolutionInstance((c as any).evolution_instance || "");
        setEvolutionApiKey((c as any).evolution_api_key || "");
      })
      .catch((err) => {
        console.error(err);
        setLoadError(err?.response?.data?.message || "Error al cargar la clinica");
      })
      .finally(() => setLoading(false));

    api.get(`/admin/clinicas/${id}/mp`)
      .then((res) => setMpConfigured(res.data.configurado ?? false))
      .catch(() => setMpConfigured(false));
  };

  useEffect(() => {
    loadClinica();
  }, [id]);

  const toggleActive = async () => {
    if (!clinica) return;
    try {
      const updated = await updateAdminClinica(clinica.id, {
        is_active: !clinica.is_active,
      } as any);
      setClinica({ ...clinica, is_active: updated.is_active });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (!clinica) return;
    if (deleteConfirmName.trim() !== clinica.nombre.trim()) {
      setDeleteError("El nombre no coincide");
      return;
    }
    if (!deletePassword) {
      setDeleteError("Ingresá tu contraseña");
      return;
    }
    setIsDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminClinica(clinica.id);
      router.push("/admin/clinicas");
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message || "Error al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  const updateWebhookField = (key: string, field: "url" | "activo", value: string | boolean) => {
    setWebhooks((prev) => ({
      ...prev,
      [key]: { url: prev[key]?.url || "", activo: prev[key]?.activo ?? false, [field]: value },
    }));
  };

  const handleSaveWebhooks = async () => {
    if (!clinica) return;
    setIsSavingWebhooks(true);
    try {
      await updateAdminClinica(clinica.id, { webhooks } as any);
      // Success feedback handled inline
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingWebhooks(false);
    }
  };

  const handleSaveEvolution = async () => {
    if (!clinica) return;
    setIsSavingEvolution(true);
    try {
      await updateAdminClinica(clinica.id, {
        evolution_instance: evolutionInstance,
        evolution_api_key: evolutionApiKey,
      } as any);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingEvolution(false);
    }
  };

  const handleSaveMp = async () => {
    if (!mpForm.access_token.trim()) {
      setMpError("El Access Token es obligatorio");
      return;
    }
    setMpError("");
    setIsSavingMp(true);
    try {
      await api.put(`/admin/clinicas/${id}/mp`, {
        access_token: mpForm.access_token,
        public_key: mpForm.public_key || undefined,
      });
      setMpConfigured(true);
      setMpForm({ access_token: "", public_key: "" });
    } catch (err: any) {
      setMpError(err?.response?.data?.message || "Error al guardar");
    } finally {
      setIsSavingMp(false);
    }
  };

  const handleRemoveMp = async () => {
    if (!confirm("¿Eliminar las credenciales de Mercado Pago de esta clínica?")) return;
    try {
      await api.delete(`/admin/clinicas/${id}/mp`);
      setMpConfigured(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="animate-page-in space-y-6 animate-in fade-in duration-300">
        <div className="h-4 w-40 bg-muted rounded-md animate-pulse" />
        <div className="h-8 w-56 bg-muted rounded-md animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 rounded-xl border bg-card animate-pulse" />
          <div className="h-64 rounded-xl border bg-card animate-pulse" />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--status-error)]/10 mb-2">
          <XCircle className="h-6 w-6 text-[var(--status-error-fg)]" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{loadError}</p>
        <button
          onClick={loadClinica}
          className="mt-2 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium hover:bg-muted transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!clinica) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
          <Building2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Clinica no encontrada</p>
        <Link
          href="/admin/clinicas"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A]/10 px-4 py-2 text-sm font-medium text-primary hover:bg-[#0F172A]/20 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver a clinicas
        </Link>
      </div>
    );
  }

  const sub = clinica.subscription;
  const stats = clinica._stats;
  const estado = sub ? ESTADO_COLORS[sub.estado] ?? ESTADO_COLORS.cancelada : null;

  const statsData = [
    { label: "Usuarios", value: stats?.usuarios ?? 0, icon: Users, gradient: "from-[var(--ht-primary)] to-[var(--ht-primary-light)]", glow: "shadow-[var(--ht-primary)]/20" },
    { label: "Pacientes", value: stats?.pacientes ?? 0, icon: Heart, gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", glow: "shadow-[var(--ht-accent)]/20" },
    { label: "Turnos", value: stats?.turnos ?? 0, icon: Calendar, gradient: "from-[var(--ht-primary)] to-[var(--ht-accent)]", glow: "shadow-[var(--ht-primary)]/20" },
    { label: "Registrada", value: new Date(clinica.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }), icon: Clock, gradient: "from-[var(--ht-accent-warm)] to-[var(--ht-accent-warm-dark)]", glow: "shadow-[var(--ht-accent-warm)]/20" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm mb-2">
            <Link href="/admin/clinicas" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Clinicas
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="font-medium">{clinica.nombre}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)]/10 to-[var(--ht-accent)]/10 text-primary dark:text-primary/90 text-sm font-bold ring-1 ring-primary/10">
              {clinica.nombre?.charAt(0)?.toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{clinica.nombre}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${clinica.is_active ? "bg-[var(--ht-accent)]/10 text-[var(--status-success-fg)]" : "bg-[var(--status-error)]/10 text-[var(--status-error-fg)]"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${clinica.is_active ? "bg-[var(--ht-accent)]" : "bg-[var(--status-error)]"}`} />
            {clinica.is_active ? "Activa" : "Inactiva"}
          </span>
          <button onClick={toggleActive} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${clinica.is_active ? "bg-[var(--status-error)]/10 text-[var(--status-error-fg)] hover:bg-[var(--status-error)]/20" : "bg-[var(--ht-accent)]/10 text-[var(--status-success-fg)] hover:bg-[var(--ht-accent)]/20"}`}>
            {clinica.is_active ? "Suspender" : "Activar"}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statsData.map((stat) => (
          <div key={stat.label} className="group rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${stat.gradient} shadow-md ${stat.glow} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Info + Suscripcion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Info */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-5 py-3.5 bg-muted/20">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Informacion General
            </h2>
          </div>
          <div className="p-5">
            <dl className="space-y-4">
              {[
                { label: "Nombre", value: clinica.nombre },
                { label: "Propietario", value: clinica.nombre_propietario },
                { label: "Telefono", value: formatPhone(clinica.cel) },
                { label: "Email", value: clinica.email },
                { label: "Direccion", value: clinica.direccion },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-muted-foreground shrink-0">{item.label}</dt>
                  <dd className="text-sm font-medium text-right truncate">
                    {item.value || <span className="text-muted-foreground/40 italic">No especificado</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Suscripcion */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-5 py-3.5 bg-muted/20">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Suscripcion
            </h2>
          </div>
          <div className="p-5">
            {sub ? (
              <dl className="space-y-4">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Plan</dt>
                  <dd>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-[#0F172A]/10 px-2.5 py-1 text-xs font-semibold text-primary dark:text-primary/90">
                      <Crown className="h-3 w-3" />
                      {sub.plan?.nombre ?? "—"}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Estado</dt>
                  <dd>
                    {estado && (
                      <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${estado.bg} ${estado.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${estado.dot}`} />
                        {sub.estado.charAt(0).toUpperCase() + sub.estado.slice(1)}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Inicio</dt>
                  <dd className="text-sm font-medium">{new Date(sub.fecha_inicio).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-muted-foreground">Vencimiento</dt>
                  <dd className="text-sm font-medium">{new Date(sub.fecha_fin).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" })}</dd>
                </div>
                {sub.plan && (
                  <div className="flex items-center justify-between pt-3 border-t">
                    <dt className="text-sm font-medium">Precio mensual</dt>
                    <dd className="text-lg font-bold text-primary dark:text-primary/90">
                      ${Number(sub.plan.precio_mensual).toLocaleString("es-AR")}
                      <span className="text-xs font-normal text-muted-foreground">/mes</span>
                    </dd>
                  </div>
                )}
              </dl>
            ) : (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Crown className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Sin suscripcion asignada</p>
                <Link href="/admin/suscripciones" className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F172A] transition-colors shadow-md shadow-[var(--ht-primary)]/20">
                  Asignar plan
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Webhooks Configuration */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b px-5 py-3.5 bg-muted/20 flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Webhook className="h-4 w-4 text-accent" />
            Webhooks de la Clinica
          </h2>
          <button
            onClick={handleSaveWebhooks}
            disabled={isSavingWebhooks}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
          >
            {isSavingWebhooks ? "Guardando..." : "Guardar Webhooks"}
          </button>
        </div>
        <div className="p-5">
          <p className="text-xs text-muted-foreground mb-4">
            Configura las URLs de webhook para cada evento de turno de esta clinica. Cada URL recibe un POST con los datos del turno y paciente.
          </p>
          <div className="space-y-3">
            {WEBHOOK_ESTADOS.map(({ key, label, color }) => {
              const wh = webhooks[key] || { url: "", activo: false };
              return (
                <div key={key} className={`rounded-lg border p-3 transition-colors ${wh.activo ? "bg-background" : "bg-muted/30"}`}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => updateWebhookField(key, "activo", !wh.activo)}
                      className={`flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${wh.activo ? "bg-[#0F172A]" : "bg-muted-foreground/20"}`}
                    >
                      <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${wh.activo ? "translate-x-4" : "translate-x-0"}`} />
                    </button>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
                    <span className="text-sm font-medium w-36 shrink-0">{label}</span>
                    <input
                      type="text"
                      value={wh.url}
                      onChange={(e) => updateWebhookField(key, "url", e.target.value)}
                      placeholder="https://n8n.example.com/webhook/..."
                      className="flex-1 rounded-md border bg-background px-3 py-1.5 text-xs font-mono outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      disabled={!wh.activo}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Evolution API + Agent Config */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolution API */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-5 py-3.5 bg-muted/20 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <WhatsAppIcon className="h-4 w-4 text-[var(--ht-accent)]" />
              WhatsApp (Evolution API)
            </h2>
            <button
              onClick={handleSaveEvolution}
              disabled={isSavingEvolution}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ht-accent)] to-[var(--ht-accent-dark)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
            >
              {isSavingEvolution ? "Guardando..." : "Guardar"}
            </button>
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nombre de Instancia</label>
              <input
                type="text"
                value={evolutionInstance}
                onChange={(e) => setEvolutionInstance(e.target.value)}
                placeholder="clinica-whatsapp-01"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-accent)]/20 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">API Key</label>
              <div className="relative">
                <input
                  type={showEvolutionKey ? "text" : "password"}
                  value={evolutionApiKey}
                  onChange={(e) => setEvolutionApiKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-accent)]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowEvolutionKey(!showEvolutionKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-xs"
                >
                  {showEvolutionKey ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cada clinica puede tener su propia instancia de WhatsApp para el agente IA. La API Key es generalmente la misma para todas.
            </p>
          </div>
        </div>

        {/* Mercado Pago */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="border-b px-5 py-3.5 bg-muted/20 flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[var(--ht-primary)]" />
              Mercado Pago
            </h2>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${mpConfigured ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${mpConfigured ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              {mpConfigured ? "Configurado" : "Sin configurar"}
            </span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              Credenciales de la cuenta de Mercado Pago de esta clínica. El Access Token nunca se devuelve — para actualizar ingresá uno nuevo.
            </p>

            {mpConfigured && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2.5">
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">✓ Credenciales activas</span>
                <button
                  onClick={handleRemoveMp}
                  className="text-xs text-red-500 hover:text-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Access Token{mpConfigured && <span className="ml-1 opacity-60">(dejar vacío para no modificar)</span>}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={mpForm.access_token}
                    onChange={(e) => setMpForm((p) => ({ ...p, access_token: e.target.value }))}
                    placeholder={mpConfigured ? "••••••••••••••••" : "APP_USR-..."}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-[var(--ht-primary)]/20 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Public Key <span className="opacity-60">(opcional)</span></label>
                <input
                  type="text"
                  value={mpForm.public_key}
                  onChange={(e) => setMpForm((p) => ({ ...p, public_key: e.target.value }))}
                  placeholder="APP_USR-..."
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-[var(--ht-primary)]/20 transition-all"
                />
              </div>
            </div>

            {mpError && <p className="text-xs text-red-500 font-medium">{mpError}</p>}

            <button
              onClick={handleSaveMp}
              disabled={isSavingMp || (!mpForm.access_token && !mpConfigured)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSavingMp ? "Guardando..." : "Guardar credenciales"}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl border border-[var(--status-error)]/20 bg-card shadow-sm overflow-hidden">
          <div className="border-b border-[var(--status-error)]/20 px-5 py-3.5 bg-[var(--status-error)]/5">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--status-error-fg)]">
              <Trash2 className="h-4 w-4" />
              Zona de Peligro
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              Eliminar esta clínica es una acción irreversible. Se eliminarán todos los datos asociados: usuarios, pacientes, turnos, historial médico y suscripciones. Los pagos registrados se conservarán.
            </p>

            {!showDeleteDialog ? (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--status-error)]/30 bg-[var(--status-error)]/5 px-4 py-2 text-sm font-medium text-[var(--status-error-fg)] hover:bg-[var(--status-error)]/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar clinica permanentemente
              </button>
            ) : (
              <div className="rounded-lg border border-[var(--status-error)]/20 bg-[var(--status-error)]/5 p-4 space-y-3">
                <p className="text-xs font-semibold text-[var(--status-error-fg)]">
                  Escribi el nombre de la clinica para confirmar: <strong>{clinica.nombre}</strong>
                </p>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder="Nombre de la clinica"
                  className="w-full rounded-md border border-[var(--status-error)]/20 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--status-error)]/20 transition-all"
                />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Tu contraseña de superadmin"
                  className="w-full rounded-md border border-[var(--status-error)]/20 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--status-error)]/20 transition-all"
                />
                {deleteError && (
                  <p className="text-xs text-[var(--status-error-fg)] font-medium">{deleteError}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || deleteConfirmName.trim() !== clinica.nombre.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--status-error)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? "Eliminando..." : "Confirmar eliminacion"}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteConfirmName("");
                      setDeletePassword("");
                      setDeleteError("");
                    }}
                    className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Icons ─── */

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}


