"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAdminClinicaById,
  updateAdminClinica,
  deleteAdminClinica,
} from "@/services/admin.service";
import type { AdminClinica } from "@/types";
import { formatPhone } from "@/lib/utils";

const ESTADO_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  activa: { bg: "bg-[var(--ht-accent)]/10", text: "text-[var(--status-success-fg)]", dot: "bg-[var(--ht-accent)]" },
  inactiva: { bg: "bg-red-500/10", text: "text-red-600 dark:text-red-400", dot: "bg-red-500" },
  cancelada: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500" },
  vencida: { bg: "bg-orange-500/10", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
};

const WEBHOOK_ESTADOS = [
  { key: "confirmado", label: "Turno Confirmado", color: "bg-blue-500" },
  { key: "completado", label: "Turno Completado", color: "bg-[var(--ht-accent)]" },
  { key: "cancelado", label: "Turno Cancelado", color: "bg-red-500" },
  { key: "perdido", label: "Turno Perdido", color: "bg-orange-500" },
  { key: "pendiente", label: "Turno Creado", color: "bg-amber-500" },
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

  const loadClinica = () => {
    setLoading(true);
    setLoadError(null);
    getAdminClinicaById(id)
      .then((c) => {
        setClinica(c);
        // Load webhooks from clinica data
        setWebhooks((c as any).webhooks || {});
        setEvolutionInstance((c as any).evolution_instance || "");
        setEvolutionApiKey((c as any).evolution_api_key || "");
      })
      .catch((err) => {
        console.error(err);
        setLoadError(err?.response?.data?.message || "Error al cargar la clinica");
      })
      .finally(() => setLoading(false));
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
    if (deleteConfirmName !== clinica.nombre) {
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
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-red-500/10 mb-2">
          <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
          </svg>
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
          <BuildingIcon className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Clinica no encontrada</p>
        <Link
          href="/admin/clinicas"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A]/10 px-4 py-2 text-sm font-medium text-primary hover:bg-[#0F172A]/20 transition-colors"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Volver a clinicas
        </Link>
      </div>
    );
  }

  const sub = clinica.subscription;
  const stats = clinica._stats;
  const estado = sub ? ESTADO_COLORS[sub.estado] ?? ESTADO_COLORS.cancelada : null;

  const statsData = [
    { label: "Usuarios", value: stats?.usuarios ?? 0, icon: UsersIcon, gradient: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/20" },
    { label: "Pacientes", value: stats?.pacientes ?? 0, icon: HeartIcon, gradient: "from-pink-500 to-rose-500", glow: "shadow-pink-500/20" },
    { label: "Turnos", value: stats?.turnos ?? 0, icon: CalendarIcon, gradient: "from-[var(--ht-primary)] to-[var(--ht-accent)]", glow: "shadow-[var(--ht-primary)]/20" },
    { label: "Registrada", value: new Date(clinica.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" }), icon: ClockIcon, gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", glow: "shadow-[var(--ht-accent)]/20" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm mb-2">
            <Link href="/admin/clinicas" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Clinicas
            </Link>
            <ChevronIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
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
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${clinica.is_active ? "bg-[var(--ht-accent)]/10 text-[var(--status-success-fg)]" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${clinica.is_active ? "bg-[var(--ht-accent)]" : "bg-red-500"}`} />
            {clinica.is_active ? "Activa" : "Inactiva"}
          </span>
          <button onClick={toggleActive} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${clinica.is_active ? "bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20" : "bg-[var(--ht-accent)]/10 text-[var(--status-success-fg)] hover:bg-[var(--ht-accent)]/20"}`}>
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
              <InfoIcon className="h-4 w-4 text-primary" />
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
              <CrownIcon className="h-4 w-4 text-primary" />
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
                      <CrownIcon className="h-3 w-3" />
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
                  <CrownIcon className="h-5 w-5 text-muted-foreground" />
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
            <WebhookIcon className="h-4 w-4 text-accent" />
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
              <WhatsAppIcon className="h-4 w-4 text-green-500" />
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
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
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
                  className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-green-500/20 transition-all"
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

        {/* Danger Zone */}
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-card shadow-sm overflow-hidden">
          <div className="border-b border-red-200 dark:border-red-900/50 px-5 py-3.5 bg-red-50/50 dark:bg-red-950/20">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-red-600 dark:text-red-400">
              <TrashIcon className="h-4 w-4" />
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Eliminar clinica permanentemente
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50/30 dark:bg-red-950/10 p-4 space-y-3">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Escribi el nombre de la clinica para confirmar: <strong>{clinica.nombre}</strong>
                </p>
                <input
                  type="text"
                  value={deleteConfirmName}
                  onChange={(e) => setDeleteConfirmName(e.target.value)}
                  placeholder="Nombre de la clinica"
                  className="w-full rounded-md border border-red-200 dark:border-red-800 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                />
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Tu contraseña de superadmin"
                  className="w-full rounded-md border border-red-200 dark:border-red-800 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
                />
                {deleteError && (
                  <p className="text-xs text-red-500 font-medium">{deleteError}</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting || deleteConfirmName !== clinica.nombre}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
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

function WebhookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2" /><path d="m6 17 3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06" /><path d="m12 6 3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8H12" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21" /><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}
