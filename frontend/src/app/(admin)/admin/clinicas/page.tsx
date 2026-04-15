"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Mail,
  Phone,
  Eye,
  Crown,
  XCircle,
} from "lucide-react";
import {
  getAdminClinicas,
  updateAdminClinica,
  aprobarAdminClinica,
  rechazarAdminClinica,
} from "@/services/admin.service";
import type { AdminClinica } from "@/types";
import { Input } from "@/components/ui/input";

export default function AdminClinicasPage() {
  const [clinicas, setClinicas] = useState<AdminClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");
  const [filterAprobacion, setFilterAprobacion] = useState<string>("");

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    getAdminClinicas({
      search: search || undefined,
      is_active: filterActive || undefined,
      estado_aprobacion: filterAprobacion || undefined,
    })
      .then(setClinicas)
      .catch((err) => {
        console.error(err);
        setError(err?.response?.data?.message || "Error al cargar las clínicas");
      })
      .finally(() => setLoading(false));
  }, [search, filterActive, filterAprobacion]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  const toggleActive = async (clinica: AdminClinica) => {
    try {
      await updateAdminClinica(clinica.id, { is_active: !clinica.is_active } as any);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAprobar = async (clinica: AdminClinica) => {
    try {
      await aprobarAdminClinica(clinica.id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRechazar = async (clinica: AdminClinica) => {
    try {
      await rechazarAdminClinica(clinica.id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const totalActive = clinicas.filter((c) => c.is_active).length;
  const totalInactive = clinicas.length - totalActive;
  const totalPendientes = clinicas.filter(
    (c) => (c as any).estado_aprobacion === "pendiente",
  ).length;

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] shadow-[var(--shadow-primary)]">
              <Building2 className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Clínicas
            </h1>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Gestión completa de las clínicas registradas en la plataforma
          </p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <SummaryPill dot="bg-[var(--text-primary)]" value={clinicas.length} label="Total" />
        <SummaryPill dot="bg-[var(--status-success-fg)]" value={totalActive} label="Activas" />
        <SummaryPill dot="bg-[var(--status-error-fg)]" value={totalInactive} label="Inactivas" />
        {totalPendientes > 0 && (
          <button
            onClick={() => setFilterAprobacion(filterAprobacion === "pendiente" ? "" : "pendiente")}
            aria-pressed={filterAprobacion === "pendiente"}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 shadow-[var(--shadow-card)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40 ${
              filterAprobacion === "pendiente"
                ? "bg-[var(--status-warning-bg)] border-[var(--status-warning-fg)]/30"
                : "bg-card border-[var(--border-light)] hover:bg-[var(--muted)]/40"
            }`}
          >
            <span className="flex h-2 w-2 rounded-full bg-[var(--status-warning-fg)] animate-pulse" aria-hidden="true" />
            <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">{totalPendientes}</span>
            <span className="text-xs text-[var(--text-muted)]">Pendientes</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" aria-hidden="true" />
          <Input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="Buscar clínicas"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          aria-label="Filtrar por estado activo"
          className="rounded-md border border-[var(--border-light)] bg-card px-4 py-2 text-sm text-[var(--text-primary)] shadow-[var(--shadow-card)] outline-none transition-colors hover:bg-[var(--muted)]/40 focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40 cursor-pointer"
        >
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--status-error-bg)]">
            <XCircle className="h-6 w-6 text-[var(--status-error-fg)]" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">{error}</p>
          <button
            onClick={load}
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[var(--border-light)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--muted)]/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Cards Grid */}
      {!error && loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-[var(--border-light)] bg-card p-5 shadow-[var(--shadow-card)] animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-[var(--muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded-md bg-[var(--muted)]" />
                  <div className="h-3 w-20 rounded-md bg-[var(--muted)]" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded-md bg-[var(--muted)]" />
                <div className="h-3 w-2/3 rounded-md bg-[var(--muted)]" />
              </div>
            </div>
          ))}
        </div>
      ) : clinicas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--muted)] mb-4">
            <Building2 className="h-7 w-7 text-[var(--text-muted)]" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-[var(--text-muted)]">No se encontraron clínicas</p>
          <p className="text-xs text-[var(--text-muted)]/70 mt-1">Intentá ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {clinicas.map((clinica) => {
            const sub = clinica.subscriptions?.[0];
            const planNombre = sub?.plan ? (sub.plan as any).nombre : null;
            const aprobacion = (clinica as any).estado_aprobacion as string | undefined;

            const topBarClass =
              aprobacion === "pendiente"
                ? "bg-gradient-to-r from-[var(--status-warning-fg)] to-[var(--ht-accent-warm)]"
                : aprobacion === "rechazado"
                  ? "bg-[var(--status-error-fg)]"
                  : clinica.is_active
                    ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)]"
                    : "bg-[var(--status-error-fg)]";

            const statusTone =
              aprobacion === "pendiente"
                ? "bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)]"
                : aprobacion === "rechazado"
                  ? "bg-[var(--status-error-bg)] text-[var(--status-error-fg)]"
                  : clinica.is_active
                    ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]"
                    : "bg-[var(--status-error-bg)] text-[var(--status-error-fg)]";

            const statusDot =
              aprobacion === "pendiente"
                ? "bg-[var(--status-warning-fg)] animate-pulse"
                : aprobacion === "rechazado"
                  ? "bg-[var(--status-error-fg)]"
                  : clinica.is_active
                    ? "bg-[var(--status-success-fg)]"
                    : "bg-[var(--status-error-fg)]";

            const statusLabel =
              aprobacion === "pendiente"
                ? "Pendiente"
                : aprobacion === "rechazado"
                  ? "Rechazada"
                  : clinica.is_active
                    ? "Activa"
                    : "Inactiva";

            return (
              <div
                key={clinica.id}
                className={`group relative overflow-hidden rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 ${
                  !clinica.is_active ? "opacity-75" : ""
                }`}
              >
                <div className={`h-1 w-full ${topBarClass}`} aria-hidden="true" />

                <div className="p-5">
                  {/* Header: Avatar + Name + Status */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)]/10 to-[var(--ht-accent)]/10 text-sm font-bold text-[var(--ht-primary)] ring-1 ring-[var(--ht-primary)]/15">
                        {clinica.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight text-[var(--text-primary)] truncate">
                          {clinica.nombre}
                        </h3>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5 tabular-nums">
                          {new Date(clinica.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${statusTone}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} aria-hidden="true" />
                      {statusLabel}
                    </span>
                  </div>

                  {/* Contact info */}
                  {(clinica.email || clinica.cel) && (
                    <div className="space-y-1.5 mb-4 text-xs text-[var(--text-muted)]">
                      {clinica.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">{clinica.email}</span>
                        </div>
                      )}
                      {clinica.cel && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{clinica.cel}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-2 mb-4">
                    <Stat value={clinica._stats?.usuarios ?? 0} label="Usuarios" />
                    <Stat value={clinica._stats?.pacientes ?? 0} label="Pacientes" />
                    <Stat value={clinica._stats?.turnos ?? 0} label="Turnos" />
                  </div>

                  {/* Plan badge */}
                  <div className="flex items-center justify-between mb-4 gap-2">
                    {planNombre ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--ht-primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--ht-primary)]">
                        <Crown className="h-3 w-3" aria-hidden="true" />
                        {planNombre}
                      </span>
                    ) : (
                      <span className="text-[11px] italic text-[var(--text-muted)]/70">Sin plan asignado</span>
                    )}
                    {sub?.estado && (
                      <span className="text-[10px] font-medium text-[var(--text-muted)] bg-[var(--muted)] px-2 py-0.5 rounded-full capitalize">
                        {sub.estado}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-[var(--border-light)]">
                    {aprobacion === "pendiente" ? (
                      <>
                        <button
                          onClick={() => handleAprobar(clinica)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--status-success-fg)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-success-fg)]/40"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazar(clinica)}
                          className="inline-flex items-center justify-center rounded-lg border border-[var(--status-error-fg)]/30 px-3 py-2 text-xs font-medium text-[var(--status-error-fg)] hover:bg-[var(--status-error-bg)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-error-fg)]/40"
                        >
                          Rechazar
                        </button>
                        <Link
                          href={`/admin/clinicas/${clinica.id}`}
                          aria-label="Ver detalle"
                          className="inline-flex items-center justify-center rounded-lg border border-[var(--border-light)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--muted)]/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/admin/clinicas/${clinica.id}`}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-[var(--shadow-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40"
                        >
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          Ver detalle
                        </Link>
                        <button
                          onClick={() => toggleActive(clinica)}
                          className={`inline-flex items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                            clinica.is_active
                              ? "text-[var(--status-warning-fg)] border-[var(--status-warning-fg)]/30 hover:bg-[var(--status-warning-bg)] focus-visible:ring-[var(--status-warning-fg)]/40"
                              : "text-[var(--status-success-fg)] border-[var(--status-success-fg)]/30 hover:bg-[var(--status-success-bg)] focus-visible:ring-[var(--status-success-fg)]/40"
                          }`}
                        >
                          {clinica.is_active ? "Suspender" : "Activar"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryPill({ dot, value, label }: { dot: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[var(--border-light)] bg-card px-4 py-2.5 shadow-[var(--shadow-card)]">
      <span className={`flex h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      <span className="text-sm font-medium tabular-nums text-[var(--text-primary)]">{value}</span>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex-1 rounded-lg bg-[var(--muted)]/50 px-3 py-2 text-center">
      <p className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
    </div>
  );
}
