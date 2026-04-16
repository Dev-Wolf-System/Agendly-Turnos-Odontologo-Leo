"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Building2, User, Calendar, X, MessageSquare, Send, Loader2 } from "lucide-react";
import api from "@/services/api";

// ─── Types ───
interface AdminTicket {
  id: string;
  clinica_id: string;
  user_id: string;
  asunto: string;
  descripcion: string;
  categoria: "tecnico" | "facturacion" | "consulta" | "otro";
  prioridad: "baja" | "media" | "alta" | "urgente";
  estado: "abierto" | "en_progreso" | "esperando_respuesta" | "resuelto" | "cerrado";
  respuesta_admin: string | null;
  respondido_por: string | null;
  respondido_at: string | null;
  created_at: string;
  updated_at: string;
  clinica_nombre?: string;
  user_nombre?: string;
  user_email?: string;
}

interface TicketStats {
  abierto?: number;
  en_progreso?: number;
  esperando_respuesta?: number;
  resuelto?: number;
  cerrado?: number;
}

// ─── Configs ───
const ESTADO_CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  abierto: { bg: "bg-[var(--ht-primary)]/10", text: "text-[var(--ht-primary)]", dot: "bg-[var(--ht-primary)]", label: "Abierto" },
  en_progreso: { bg: "bg-[var(--ht-accent-warm)]/10", text: "text-[var(--ht-accent-warm)]", dot: "bg-[var(--ht-accent-warm)]", label: "En Progreso" },
  esperando_respuesta: { bg: "bg-[var(--ht-accent-dark)]/10", text: "text-[var(--ht-accent)] dark:text-accent", dot: "bg-[var(--ht-accent-dark)]", label: "Esperando" },
  resuelto: { bg: "bg-[var(--ht-accent)]/10", text: "text-[var(--status-success-fg)]", dot: "bg-[var(--ht-accent)]", label: "Resuelto" },
  cerrado: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", dot: "bg-slate-500", label: "Cerrado" },
};

const PRIORIDAD_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  baja: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", label: "Baja" },
  media: { bg: "bg-[var(--ht-primary)]/10", text: "text-[var(--ht-primary)]", label: "Media" },
  alta: { bg: "bg-[var(--ht-accent-warm)]/10", text: "text-[var(--ht-accent-warm)]", label: "Alta" },
  urgente: { bg: "bg-[var(--status-error)]/10", text: "text-[var(--status-error-fg)]", label: "Urgente" },
};

const CATEGORIA_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  tecnico: { bg: "bg-[var(--ht-accent)]/10", text: "text-[var(--status-success-fg)]", label: "Tecnico" },
  facturacion: { bg: "bg-[var(--ht-accent)]/10", text: "text-[var(--status-success-fg)]", label: "Facturacion" },
  consulta: { bg: "bg-[var(--ht-primary)]/10", text: "text-[var(--ht-primary)]", label: "Consulta" },
  otro: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-400", label: "Otro" },
};

const ESTADOS_FLOW: string[] = ["abierto", "en_progreso", "esperando_respuesta", "resuelto", "cerrado"];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return formatDate(dateStr);
}

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════
export default function AdminSoportePage() {
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [stats, setStats] = useState<TicketStats>({});
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterEstado, setFilterEstado] = useState("");
  const [filterCategoria, setFilterCategoria] = useState("");
  const [filterPrioridad, setFilterPrioridad] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Selected ticket
  const [selected, setSelected] = useState<AdminTicket | null>(null);
  const [respuesta, setRespuesta] = useState("");
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [responding, setResponding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterEstado) params.append("estado", filterEstado);
      if (filterCategoria) params.append("categoria", filterCategoria);
      const [ticketsRes, statsRes] = await Promise.all([
        api.get<AdminTicket[]>(`/tickets/admin/all?${params.toString()}`),
        api.get<TicketStats>("/tickets/admin/stats"),
      ]);
      setTickets(ticketsRes.data);
      setStats(statsRes.data);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [filterEstado, filterCategoria]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRespond = async () => {
    if (!selected || !respuesta.trim()) return;
    try {
      setResponding(true);
      await api.patch(`/tickets/admin/${selected.id}/respond`, {
        respuesta_admin: respuesta,
        ...(nuevoEstado ? { estado: nuevoEstado } : {}),
      });
      setSelected(null);
      setRespuesta("");
      setNuevoEstado("");
      fetchData();
    } catch {
      // error handled
    } finally {
      setResponding(false);
    }
  };

  const handleChangeEstado = async (ticketId: string, estado: string) => {
    try {
      await api.patch(`/tickets/admin/${ticketId}/estado`, { estado });
      fetchData();
    } catch {
      // error handled
    }
  };

  // ─── Filtered tickets ───
  const filteredTickets = tickets.filter((t) => {
    if (filterPrioridad && t.prioridad !== filterPrioridad) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        t.asunto.toLowerCase().includes(term) ||
        t.descripcion.toLowerCase().includes(term) ||
        (t.clinica_nombre || "").toLowerCase().includes(term) ||
        (t.user_nombre || "").toLowerCase().includes(term) ||
        (t.user_email || "").toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalAbiertos = (stats.abierto || 0) + (stats.en_progreso || 0);
  const totalResueltos = (stats.resuelto || 0) + (stats.cerrado || 0);
  const totalAll = Object.values(stats).reduce((a, b) => a + (b || 0), 0);

  return (
    <div className="animate-page-in space-y-6">
      {/* ── KPI Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-gradient-to-br from-[var(--ht-primary)]/10 to-[var(--ht-primary)]/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Tickets</p>
          <p className="text-2xl font-bold mt-1">{totalAll}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-[var(--ht-accent-warm)]/10 to-[var(--ht-accent-warm)]/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Abiertos</p>
          <p className="text-2xl font-bold mt-1 text-[var(--ht-accent-warm)]">{totalAbiertos}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-[var(--ht-accent)]/10 to-[var(--ht-accent-dark)]/5 dark:from-[var(--ht-accent)]/20 dark:to-[var(--ht-accent-dark)]/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Esperando</p>
          <p className="text-2xl font-bold mt-1 text-[var(--ht-accent)] dark:text-accent">{stats.esperando_respuesta || 0}</p>
        </div>
        <div className="rounded-xl border bg-gradient-to-br from-[var(--ht-accent)]/10 to-[var(--ht-accent)]/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Resueltos</p>
          <p className="text-2xl font-bold mt-1 text-[var(--status-success-fg)]">{totalResueltos}</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar por asunto, clinica, usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 min-w-[220px] rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos los estados</option>
          {ESTADOS_FLOW.map((e) => (
            <option key={e} value={e}>
              {ESTADO_CONFIG[e]?.label || e}
            </option>
          ))}
        </select>
        <select
          value={filterCategoria}
          onChange={(e) => setFilterCategoria(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas las categorias</option>
          {Object.entries(CATEGORIA_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          value={filterPrioridad}
          onChange={(e) => setFilterPrioridad(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todas las prioridades</option>
          {Object.entries(PRIORIDAD_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--bg-sidebar)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--bg-sidebar-hover)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* ── Tickets List + Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Tickets list */}
        <div className="lg:col-span-3 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-xl bg-muted/50 animate-pulse h-[100px]" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="rounded-xl border bg-card p-12 text-center">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium">No hay tickets</p>
              <p className="text-sm text-muted-foreground mt-1">Los tickets de soporte apareceran aqui</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const ec = ESTADO_CONFIG[ticket.estado] || ESTADO_CONFIG.abierto;
              const pc = PRIORIDAD_CONFIG[ticket.prioridad] || PRIORIDAD_CONFIG.media;
              const cc = CATEGORIA_CONFIG[ticket.categoria] || CATEGORIA_CONFIG.otro;
              const isSelected = selected?.id === ticket.id;

              return (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => {
                    setSelected(ticket);
                    setRespuesta(ticket.respuesta_admin || "");
                    setNuevoEstado(ticket.estado);
                  }}
                  className={`w-full text-left rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${
                    isSelected
                      ? "ring-2 ring-primary border-primary/50 bg-primary/5 dark:bg-primary/10"
                      : "bg-card hover:bg-muted/30"
                  }`}
                >
                  {/* Top row: asunto + time */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <p className="text-sm font-semibold truncate flex-1">
                      {ticket.asunto}
                    </p>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                      {timeAgo(ticket.created_at)}
                    </span>
                  </div>

                  {/* Clinic + user info */}
                  <div className="flex items-center gap-2 mb-2.5 text-xs text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{ticket.clinica_nombre || "—"}</span>
                    <span className="text-muted-foreground/40">|</span>
                    <span className="truncate">{ticket.user_nombre || ticket.user_email || "—"}</span>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ec.bg} ${ec.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ec.dot}`} />
                      {ec.label}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${pc.bg} ${pc.text}`}>
                      {pc.label}
                    </span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${cc.bg} ${cc.text}`}>
                      {cc.label}
                    </span>
                    {ticket.respuesta_admin && (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[var(--ht-accent)]/10 text-[var(--status-success-fg)]">
                        <MessageSquare className="w-3 h-3" />
                        Respondido
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="rounded-xl border bg-card shadow-sm sticky top-6">
              {/* Header */}
              <div className="p-5 border-b">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-bold leading-snug">{selected.asunto}</h3>
                  <button
                    onClick={() => setSelected(null)}
                    className="shrink-0 rounded-lg p-1.5 hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Meta */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{selected.clinica_nombre || "Sin clinica"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span>{selected.user_nombre || "—"} ({selected.user_email || "—"})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Creado: {formatDate(selected.created_at)}</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {(() => {
                    const ec = ESTADO_CONFIG[selected.estado] || ESTADO_CONFIG.abierto;
                    const pc = PRIORIDAD_CONFIG[selected.prioridad] || PRIORIDAD_CONFIG.media;
                    const cc = CATEGORIA_CONFIG[selected.categoria] || CATEGORIA_CONFIG.otro;
                    return (
                      <>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ec.bg} ${ec.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ec.dot}`} />
                          {ec.label}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${pc.bg} ${pc.text}`}>
                          {pc.label}
                        </span>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cc.bg} ${cc.text}`}>
                          {cc.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Description */}
              <div className="p-5 border-b">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Descripcion</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{selected.descripcion}</p>
              </div>

              {/* Previous response */}
              {selected.respuesta_admin && (
                <div className="p-5 border-b">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Respuesta anterior</p>
                  <div className="rounded-lg bg-[var(--ht-accent)]/5 p-3 border border-[var(--ht-accent)]/20">
                    <p className="text-sm whitespace-pre-wrap text-[var(--status-success-fg)]">{selected.respuesta_admin}</p>
                    {selected.respondido_at && (
                      <p className="text-[10px] text-[var(--status-success-fg)]/70 mt-2">{formatDate(selected.respondido_at)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Respond form */}
              <div className="p-5 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responder</p>
                <textarea
                  className="w-full min-h-[100px] rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Escribe tu respuesta al ticket..."
                  value={respuesta}
                  onChange={(e) => setRespuesta(e.target.value)}
                />

                {/* Change status */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Cambiar estado:</label>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="flex-1 rounded-lg border bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {ESTADOS_FLOW.map((e) => (
                      <option key={e} value={e}>{ESTADO_CONFIG[e]?.label || e}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRespond}
                    disabled={responding || !respuesta.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[var(--bg-sidebar)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--bg-sidebar-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {responding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {responding ? "Enviando..." : "Enviar respuesta"}
                  </button>

                  {/* Quick status buttons */}
                  {selected.estado !== "cerrado" && (
                    <button
                      onClick={() => handleChangeEstado(selected.id, "cerrado")}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                      title="Cerrar ticket"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cerrar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card shadow-sm p-12 text-center sticky top-6">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[var(--ht-primary)]/10 to-[var(--ht-accent)]/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary/90" />
              </div>
              <p className="font-medium text-sm">Selecciona un ticket</p>
              <p className="text-xs text-muted-foreground mt-1">
                Haz clic en un ticket de la lista para ver sus detalles y responder
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
