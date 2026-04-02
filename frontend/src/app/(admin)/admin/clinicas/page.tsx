"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getAdminClinicas,
  updateAdminClinica,
} from "@/services/admin.service";
import type { AdminClinica } from "@/types";

export default function AdminClinicasPage() {
  const [clinicas, setClinicas] = useState<AdminClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState<string>("");

  const load = useCallback(() => {
    setLoading(true);
    getAdminClinicas({
      search: search || undefined,
      is_active: filterActive || undefined,
    })
      .then(setClinicas)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, filterActive]);

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

  const totalActive = clinicas.filter((c) => c.is_active).length;
  const totalInactive = clinicas.length - totalActive;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1b3553] to-[#5bbcad] shadow-md shadow-[#1b3553]/20">
              <BuildingIcon className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Clinicas</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gestion completa de las clinicas registradas en la plataforma
          </p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-[#1b3553]" />
          <span className="text-sm font-medium">{clinicas.length}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium">{totalActive}</span>
          <span className="text-xs text-muted-foreground">Activas</span>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-red-400" />
          <span className="text-sm font-medium">{totalInactive}</span>
          <span className="text-xs text-muted-foreground">Inactivas</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-card pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 focus:border-[#1b3553] transition-all shadow-sm"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="rounded-xl border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 shadow-sm cursor-pointer"
        >
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-5 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded-md" />
                  <div className="h-3 w-20 bg-muted rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full bg-muted rounded-md" />
                <div className="h-3 w-2/3 bg-muted rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : clinicas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
            <BuildingIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No se encontraron clinicas</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Intenta ajustar los filtros de busqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {clinicas.map((clinica) => {
            const sub = clinica.subscriptions?.[0];
            const planNombre = sub?.plan ? (sub.plan as any).nombre : null;

            return (
              <div
                key={clinica.id}
                className={`group relative rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden ${
                  !clinica.is_active ? "opacity-70" : ""
                }`}
              >
                {/* Top gradient bar */}
                <div className={`h-1 w-full ${clinica.is_active ? "bg-gradient-to-r from-[#1b3553] to-[#7cd1c4]" : "bg-red-400"}`} />

                <div className="p-5">
                  {/* Header: Avatar + Name + Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1b3553]/10 to-[#7cd1c4]/10 text-[#1b3553] dark:text-[#2a4f73] text-sm font-bold ring-1 ring-[#1b3553]/10">
                        {clinica.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm leading-tight">{clinica.nombre}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {new Date(clinica.created_at).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
                        clinica.is_active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${clinica.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                      {clinica.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>

                  {/* Contact info */}
                  {(clinica.email || clinica.cel) && (
                    <div className="space-y-1.5 mb-4 text-xs text-muted-foreground">
                      {clinica.email && (
                        <div className="flex items-center gap-2">
                          <MailIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{clinica.email}</span>
                        </div>
                      )}
                      {clinica.cel && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                          <span>{clinica.cel}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-center">
                      <p className="text-sm font-bold">{clinica._stats?.usuarios ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Usuarios</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-center">
                      <p className="text-sm font-bold">{clinica._stats?.pacientes ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pacientes</p>
                    </div>
                    <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2 text-center">
                      <p className="text-sm font-bold">{clinica._stats?.turnos ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Turnos</p>
                    </div>
                  </div>

                  {/* Plan badge */}
                  <div className="flex items-center justify-between mb-4">
                    {planNombre ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#1b3553]/10 px-2.5 py-1 text-[11px] font-semibold text-[#1b3553] dark:text-[#2a4f73]">
                        <CrownIcon className="h-3 w-3" />
                        {planNombre}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/60 italic">Sin plan asignado</span>
                    )}
                    {sub?.estado && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full capitalize">
                        {sub.estado}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Link
                      href={`/admin/clinicas/${clinica.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#1b3553] to-[#5bbcad] px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity shadow-sm shadow-[#1b3553]/20"
                    >
                      <EyeIcon className="h-3.5 w-3.5" />
                      Ver detalle
                    </Link>
                    <button
                      onClick={() => toggleActive(clinica)}
                      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                        clinica.is_active
                          ? "text-amber-600 hover:bg-amber-500/10 border-amber-200 dark:border-amber-800"
                          : "text-emerald-600 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800"
                      }`}
                    >
                      {clinica.is_active ? "Suspender" : "Activar"}
                    </button>
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

/* ─── Icons ─── */

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
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

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" /><path d="M5.5 21h13" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
