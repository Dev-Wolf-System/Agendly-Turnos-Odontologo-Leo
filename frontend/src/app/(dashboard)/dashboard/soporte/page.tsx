"use client";

import { useEffect, useState, useCallback } from "react";
import ticketsService, { Ticket, CreateTicketPayload } from "@/services/tickets.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  RefreshCw,
  Loader2,
  TicketCheck,
  LifeBuoy,
} from "lucide-react";

import { STATUS_COLORS } from "@/lib/constants";

// ─── Colores ───
const prioridadColors: Record<string, string> = {
  baja: STATUS_COLORS.inactivo,
  media: STATUS_COLORS.abierto,
  alta: "bg-status-warning-bg text-status-warning-fg",
  urgente: STATUS_COLORS.cancelado,
};

const categoriaColors: Record<string, string> = {
  tecnico: "bg-status-info-bg text-status-info-fg",
  facturacion: STATUS_COLORS.completado,
  consulta: STATUS_COLORS.abierto,
  otro: STATUS_COLORS.inactivo,
};

const estadoTicketColors: Record<string, string> = {
  abierto: STATUS_COLORS.abierto,
  en_progreso: STATUS_COLORS.en_progreso,
  esperando_respuesta: "bg-status-info-bg text-status-info-fg",
  resuelto: STATUS_COLORS.resuelto,
  cerrado: STATUS_COLORS.cerrado,
};

const estadoTicketLabels: Record<string, string> = {
  abierto: "Abierto",
  en_progreso: "En progreso",
  esperando_respuesta: "Esperando respuesta",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

const categoriaLabels: Record<string, string> = {
  tecnico: "Tecnico",
  facturacion: "Facturacion",
  consulta: "Consulta",
  otro: "Otro",
};

const prioridadLabels: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TICKET_CATEGORIA_LABELS: Record<string, string> = {
  tecnico: "Técnico",
  facturacion: "Facturación",
  consulta: "Consulta",
  otro: "Otro",
};

const TICKET_PRIORIDAD_LABELS: Record<string, string> = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

export default function SoportePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [newTicket, setNewTicket] = useState<CreateTicketPayload>({
    asunto: "",
    descripcion: "",
    categoria: "consulta",
    prioridad: "media",
  });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ticketsService.getAll();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async () => {
    if (!newTicket.asunto.trim() || !newTicket.descripcion.trim()) {
      toast.error("Completar asunto y descripcion");
      return;
    }
    try {
      setCreating(true);
      await ticketsService.create(newTicket);
      toast.success("Ticket creado exitosamente");
      setNewTicket({ asunto: "", descripcion: "", categoria: "consulta", prioridad: "media" });
      setDialogOpen(false);
      fetchTickets();
    } catch {
      toast.error("Error al crear ticket");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Soporte</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Crea tickets de soporte y consultas para el equipo de Avax Health
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTickets}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* Tickets */}
      {loading ? (
        <div className="rounded-xl bg-muted/50 animate-pulse h-[350px]" />
      ) : (
        <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-accent-dark)] flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Soporte Técnico</h2>
                  <p className="text-sm text-muted-foreground">Tickets de soporte y consultas</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setDialogOpen(true)}
                className="gap-1.5 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white shadow-[var(--shadow-primary)] transition-all"
              >
                <Plus className="w-4 h-4" />
                Nuevo ticket
              </Button>
            </div>
          </div>
          <div className="px-6 pb-6">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <TicketCheck className="w-7 h-7 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">Sin tickets</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea un ticket si necesitas ayuda o tienes alguna consulta
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <button
                      type="button"
                      className="w-full p-4 text-left"
                      onClick={() =>
                        setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <p className="text-sm font-semibold truncate">{ticket.asunto}</p>
                            {ticket.respuesta_admin && (
                              <MessageSquare className="w-3.5 h-3.5 text-[var(--ht-accent)] shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`border-0 text-[10px] ${categoriaColors[ticket.categoria] ?? categoriaColors.otro}`}>
                              {categoriaLabels[ticket.categoria] ?? ticket.categoria}
                            </Badge>
                            <Badge className={`border-0 text-[10px] ${prioridadColors[ticket.prioridad] ?? prioridadColors.media}`}>
                              {prioridadLabels[ticket.prioridad] ?? ticket.prioridad}
                            </Badge>
                            <Badge className={`border-0 text-[10px] ${estadoTicketColors[ticket.estado] ?? estadoTicketColors.abierto}`}>
                              {estadoTicketLabels[ticket.estado] ?? ticket.estado}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground ml-auto shrink-0">
                              {formatDate(ticket.created_at)}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 mt-1">
                          {expandedTicket === ticket.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>

                    {expandedTicket === ticket.id && (
                      <div className="px-4 pb-4 space-y-3 border-t pt-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Descripcion</p>
                          <p className="text-sm whitespace-pre-wrap">{ticket.descripcion}</p>
                        </div>
                        {ticket.respuesta_admin && (
                          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                Respuesta del equipo
                              </p>
                              {ticket.respondido_at && (
                                <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 ml-auto">
                                  {formatDate(ticket.respondido_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-emerald-800 dark:text-emerald-300 whitespace-pre-wrap">
                              {ticket.respuesta_admin}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialog: Nuevo Ticket */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-sky-500" />
              Nuevo Ticket de Soporte
            </DialogTitle>
            <DialogDescription>
              Describe tu problema o consulta y nuestro equipo te respondera lo antes posible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                placeholder="Describe brevemente el tema..."
                value={newTicket.asunto}
                onChange={(e) => setNewTicket({ ...newTicket, asunto: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <textarea
                id="descripcion"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Explica con detalle tu problema o consulta..."
                value={newTicket.descripcion}
                onChange={(e) => setNewTicket({ ...newTicket, descripcion: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={newTicket.categoria}
                  onValueChange={(v: string | null) => v && setNewTicket({ ...newTicket, categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue>{TICKET_CATEGORIA_LABELS[newTicket.categoria ?? ""] ?? newTicket.categoria}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="facturacion">Facturación</SelectItem>
                    <SelectItem value="consulta">Consulta</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={newTicket.prioridad}
                  onValueChange={(v: string | null) => v && setNewTicket({ ...newTicket, prioridad: v })}
                >
                  <SelectTrigger>
                    <SelectValue>{TICKET_PRIORIDAD_LABELS[newTicket.prioridad ?? ""] ?? newTicket.prioridad}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={creating}
              className="gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {creating ? "Enviando..." : "Enviar ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
