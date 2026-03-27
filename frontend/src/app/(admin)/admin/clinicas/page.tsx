"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getAdminClinicas,
  updateAdminClinica,
  deleteAdminClinica,
} from "@/services/admin.service";
import type { AdminClinica } from "@/types";
import { formatPhone } from "@/lib/utils";

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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Desactivar esta clínica? Se marcará como inactiva.")) return;
    try {
      await deleteAdminClinica(id);
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clínicas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clinicas.length} clínicas registradas
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="">Todas</option>
          <option value="true">Activas</option>
          <option value="false">Inactivas</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium px-4 py-3">Clínica</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">Teléfono</th>
                <th className="text-center font-medium px-4 py-3 hidden lg:table-cell">Usuarios</th>
                <th className="text-center font-medium px-4 py-3 hidden lg:table-cell">Pacientes</th>
                <th className="text-center font-medium px-4 py-3 hidden lg:table-cell">Turnos</th>
                <th className="text-center font-medium px-4 py-3">Plan</th>
                <th className="text-center font-medium px-4 py-3">Estado</th>
                <th className="text-right font-medium px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : clinicas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    No se encontraron clínicas
                  </td>
                </tr>
              ) : (
                clinicas.map((clinica) => {
                  const sub = clinica.subscriptions?.[0];
                  return (
                    <tr key={clinica.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/clinicas/${clinica.id}`}
                          className="font-medium hover:text-indigo-500 transition-colors"
                        >
                          {clinica.nombre}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {new Date(clinica.created_at).toLocaleDateString("es-AR")}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                        {formatPhone(clinica.cel)}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {clinica._stats?.usuarios ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {clinica._stats?.pacientes ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {clinica._stats?.turnos ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {sub?.plan ? (
                          <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-500">
                            {(sub.plan as any).nombre ?? "—"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin plan</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            clinica.is_active
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {clinica.is_active ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/clinicas/${clinica.id}`}
                            className="rounded-md px-2 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-500/10 transition-colors"
                          >
                            Ver
                          </Link>
                          <button
                            onClick={() => toggleActive(clinica)}
                            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                              clinica.is_active
                                ? "text-amber-500 hover:bg-amber-500/10"
                                : "text-emerald-500 hover:bg-emerald-500/10"
                            }`}
                          >
                            {clinica.is_active ? "Suspender" : "Activar"}
                          </button>
                        </div>
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}
