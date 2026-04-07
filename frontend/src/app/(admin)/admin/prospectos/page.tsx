"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import leadsService, { Lead, EstadoLead, LeadStats } from "@/services/leads.service";

const ESTADO_CONFIG: Record<EstadoLead, { bg: string; text: string; dot: string; label: string }> = {
  nuevo: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500", label: "Nuevo" },
  contactado: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500", label: "Contactado" },
  en_negociacion: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", dot: "bg-purple-500", label: "En Negociacion" },
  convertido: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", label: "Convertido" },
  descartado: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500", label: "Descartado" },
};

const ESTADO_OPTIONS: EstadoLead[] = ["nuevo", "contactado", "en_negociacion", "convertido", "descartado"];

export default function AdminProspectosPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [filterEstado, setFilterEstado] = useState<EstadoLead | "">("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [leadsData, statsData] = await Promise.all([
        leadsService.getAll(filterEstado || undefined),
        leadsService.getStats(),
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch {
      toast.error("Error al cargar prospectos");
    } finally {
      setIsLoading(false);
    }
  }, [filterEstado]);

  useEffect(() => { load(); }, [load]);

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return l.nombre.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || l.empresa?.toLowerCase().includes(q);
  });

  const updateEstado = async (id: string, estado: EstadoLead) => {
    try {
      await leadsService.update(id, { estado });
      toast.success("Estado actualizado");
      load();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  const updateNotas = async (id: string, notas: string) => {
    try {
      await leadsService.update(id, { notas } as any);
      toast.success("Notas guardadas");
      load();
    } catch {
      toast.error("Error al guardar notas");
    }
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Eliminar este prospecto?")) return;
    try {
      await leadsService.remove(id);
      toast.success("Prospecto eliminado");
      setSelected(null);
      load();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prospectos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona los contactos que llegan desde la landing page
        </p>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: "Total", value: stats.total, gradient: "from-slate-500 to-slate-600" },
            { label: "Nuevos", value: stats.nuevos, gradient: "from-blue-500 to-blue-600" },
            { label: "Contactados", value: stats.contactados, gradient: "from-amber-500 to-amber-600" },
            { label: "En Negociacion", value: stats.en_negociacion, gradient: "from-purple-500 to-purple-600" },
            { label: "Convertidos", value: stats.convertidos, gradient: "from-emerald-500 to-emerald-600" },
            { label: "Descartados", value: stats.descartados, gradient: "from-slate-400 to-slate-500" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{kpi.label}</p>
              <p className="text-2xl font-bold mt-1">{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setFilterEstado("")}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
            !filterEstado ? "bg-[#0F172A]/10 border-primary/20 text-primary font-semibold shadow-sm" : "bg-card hover:bg-muted/50 shadow-sm"
          }`}
        >
          Todos
        </button>
        {ESTADO_OPTIONS.map((e) => {
          const config = ESTADO_CONFIG[e];
          return (
            <button
              key={e}
              onClick={() => setFilterEstado(filterEstado === e ? "" : e)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all ${
                filterEstado === e
                  ? `${config.bg} border-transparent ${config.text} font-semibold shadow-sm`
                  : "bg-card hover:bg-muted/50 shadow-sm"
              }`}
            >
              <span className={`flex h-2 w-2 rounded-full ${config.dot}`} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input
          placeholder="Buscar por nombre, email o empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 rounded-xl border bg-card px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      {/* Table + Detail panel */}
      <div className="flex gap-6">
        {/* Table */}
        <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Empresa</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Estado</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center hidden md:table-cell">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Cargando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">Sin prospectos</td></tr>
                ) : (
                  filtered.map((lead) => {
                    const config = ESTADO_CONFIG[lead.estado];
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelected(lead)}
                        className={`group cursor-pointer transition-colors ${selected?.id === lead.id ? "bg-[#0F172A]/5" : "hover:bg-muted/20"}`}
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-semibold text-sm">{lead.nombre}</span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{lead.email}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground hidden md:table-cell">{lead.empresa || "—"}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${config.bg} ${config.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                            {config.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-sm text-muted-foreground hidden md:table-cell">
                          {new Date(lead.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 shrink-0 rounded-xl border bg-card shadow-sm p-5 space-y-4 hidden lg:block">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{selected.nombre}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selected.email}</span></div>
              {selected.telefono && <div><span className="text-muted-foreground">Telefono:</span> <span className="font-medium">{selected.telefono}</span></div>}
              {selected.empresa && <div><span className="text-muted-foreground">Empresa:</span> <span className="font-medium">{selected.empresa}</span></div>}
              {selected.especialidad && <div><span className="text-muted-foreground">Especialidad:</span> <span className="font-medium">{selected.especialidad}</span></div>}
              {selected.plan_interes && <div><span className="text-muted-foreground">Plan de interes:</span> <span className="font-medium">{selected.plan_interes}</span></div>}
              <div><span className="text-muted-foreground">Origen:</span> <span className="font-medium">{selected.origen}</span></div>
              <div><span className="text-muted-foreground">Fecha:</span> <span className="font-medium">{new Date(selected.created_at).toLocaleDateString("es-AR")}</span></div>
            </div>

            {selected.mensaje && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Mensaje</p>
                <p className="text-sm bg-muted/30 rounded-lg p-3">{selected.mensaje}</p>
              </div>
            )}

            {/* Estado selector */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cambiar estado</p>
              <select
                value={selected.estado}
                onChange={(e) => updateEstado(selected.id, e.target.value as EstadoLead)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
              >
                {ESTADO_OPTIONS.map((e) => (
                  <option key={e} value={e}>{ESTADO_CONFIG[e].label}</option>
                ))}
              </select>
            </div>

            {/* Notas */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Notas internas</p>
              <textarea
                defaultValue={selected.notas || ""}
                onBlur={(e) => {
                  if (e.target.value !== (selected.notas || "")) {
                    updateNotas(selected.id, e.target.value);
                  }
                }}
                rows={3}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm resize-none"
                placeholder="Agregar notas..."
              />
            </div>

            <button
              onClick={() => deleteLead(selected.id)}
              className="w-full rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
            >
              Eliminar prospecto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
