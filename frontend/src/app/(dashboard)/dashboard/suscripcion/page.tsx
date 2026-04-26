"use client";

import { useEffect, useState, useCallback } from "react";
import { RoleGuard } from "@/components/guards/role-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useClinica } from "@/components/providers/clinica-provider";
import subscriptionsService, {
  SubscriptionWithPlan,
} from "@/services/subscriptions.service";
import ticketsService, { Ticket, CreateTicketPayload } from "@/services/tickets.service";
import billingService from "@/services/billing.service";
import { plansService } from "@/services/plans.service";
import type { Plan } from "@/types";
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
  CreditCard,
  CalendarDays,
  Clock,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  TicketCheck,
  Plus,
  ChevronDown,
  ChevronUp,
  Send,
  MessageSquare,
  RefreshCw,
  Zap,
  ExternalLink,
  Crown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  LifeBuoy,
} from "lucide-react";
import type { EstadoSubscription } from "@/types";

// ─── Colores de estado de suscripcion ───
const estadoSubColors: Record<
  EstadoSubscription,
  { badge: string; dot: string }
> = {
  activa: {
    badge:
      "bg-[var(--ht-accent)]/15 text-[var(--status-success-fg)] dark:text-[var(--ht-accent)]",
    dot: "bg-[var(--ht-accent)]",
  },
  inactiva: {
    badge:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    dot: "bg-red-500",
  },
  cancelada: {
    badge:
      "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
    dot: "bg-gray-500",
  },
  vencida: {
    badge:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    dot: "bg-orange-500",
  },
};

const estadoSubLabels: Record<EstadoSubscription, string> = {
  activa: "Activa",
  inactiva: "Inactiva",
  cancelada: "Cancelada",
  vencida: "Vencida",
};

// ─── Colores de prioridad de tickets ───
const prioridadColors: Record<string, string> = {
  baja: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  media: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  alta: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  urgente: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const categoriaColors: Record<string, string> = {
  tecnico:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-accent",
  facturacion:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  consulta:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  otro: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

const estadoTicketColors: Record<string, string> = {
  abierto:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  en_progreso:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  esperando_respuesta:
    "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-accent",
  resuelto:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  cerrado:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
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

// ─── Helpers ───
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(amount);
}

function daysRemaining(dateStr: string | null | undefined): number {
  if (!dateStr) return 0;
  const now = new Date();
  const end = new Date(dateStr);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = e.getTime() - s.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function daysUsed(start: string): number {
  const s = new Date(start);
  const now = new Date();
  const diff = now.getTime() - s.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// ─── Skeleton ───
function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl bg-muted/50 animate-pulse h-[120px]"
        />
      ))}
    </div>
  );
}

function CardSkeleton({ height = "h-[300px]" }: { height?: string }) {
  return (
    <div className={`rounded-xl bg-muted/50 animate-pulse ${height}`} />
  );
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

// ════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════
export default function SuscripcionPage() {
  return (
    <RoleGuard allowedRoles={["admin", "turnos_only"]}>
      <SuscripcionContent />
    </RoleGuard>
  );
}

function SuscripcionContent() {
  const { user } = useAuth();
  const { clinica } = useClinica();

  const [sub, setSub] = useState<SubscriptionWithPlan | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState<CreateTicketPayload>({
    asunto: "",
    descripcion: "",
    categoria: "consulta",
    prioridad: "media",
  });

  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  // ─── Fetch data ───
  const fetchSubscription = useCallback(async () => {
    try {
      setSubLoading(true);
      setSubError(false);
      const data = await subscriptionsService.getMiSuscripcion();
      setSub(data);
    } catch {
      setSubError(true);
      setSub(null);
    } finally {
      setSubLoading(false);
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    try {
      setTicketsLoading(true);
      const data = await ticketsService.getAll();
      setTickets(Array.isArray(data) ? data : []);
    } catch {
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchTickets();
    plansService.getActivePlans().then((data) => {
      const pagados = data.filter((p) => !p.is_default_trial && Number(p.precio_mensual) > 0);
      setPlanes(pagados);
      if (pagados.length > 0) setSelectedPlanId(pagados[0].id);
    }).catch(() => {});
  }, [fetchSubscription, fetchTickets]);

  // ─── Cancelar suscripción ───
  const handleCancelSubscription = async () => {
    try {
      setCanceling(true);
      await billingService.cancelSubscription();
      toast.success("Suscripción cancelada. El acceso se mantiene hasta el fin del período actual.");
      setCancelDialogOpen(false);
      fetchSubscription();
    } catch {
      toast.error("No se pudo cancelar la suscripción. Intentá de nuevo.");
    } finally {
      setCanceling(false);
    }
  };

  // ─── Checkout MP ───
  const handleCheckout = async (planId?: string) => {
    const pid = planId ?? selectedPlanId ?? undefined;
    if (!pid) {
      toast.error("Seleccioná un plan para continuar");
      return;
    }
    try {
      setCheckingOut(true);
      const { checkout_url } = await billingService.createCheckout(pid);
      window.location.href = checkout_url;
    } catch {
      toast.error("No se pudo iniciar el pago. Intentá de nuevo.");
      setCheckingOut(false);
    }
  };

  // ─── Create ticket ───
  const handleCreateTicket = async () => {
    if (!newTicket.asunto.trim() || !newTicket.descripcion.trim()) {
      toast.error("Completar asunto y descripcion");
      return;
    }
    try {
      setCreating(true);
      await ticketsService.create(newTicket);
      toast.success("Ticket creado exitosamente");
      setDialogOpen(false);
      setNewTicket({
        asunto: "",
        descripcion: "",
        categoria: "consulta",
        prioridad: "media",
      });
      fetchTickets();
    } catch {
      toast.error("Error al crear el ticket");
    } finally {
      setCreating(false);
    }
  };

  // ─── KPI derived values ───
  const estado = sub?.estado ?? "activa";
  const planName = sub?.plan?.nombre ?? "Sin plan";
  const precioMensual = sub?.plan?.precio_mensual ?? 0;
  const isTrial = !!sub?.trial_ends_at && new Date(sub.trial_ends_at) >= new Date();
  const remaining = sub
    ? daysRemaining(
        isTrial ? sub.trial_ends_at : sub.fecha_fin
      )
    : 0;
  const nextPayment =
    sub && !isTrial && estado !== "cancelada"
      ? sub.fecha_fin
      : null;
  const totalDays = sub
    ? daysBetween(
        sub.fecha_inicio,
        isTrial && sub.trial_ends_at
          ? sub.trial_ends_at
          : sub.fecha_fin
      )
    : 1;
  const used = sub ? daysUsed(sub.fecha_inicio) : 0;
  const progressPct = Math.min(100, Math.round((used / totalDays) * 100));

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="animate-page-in space-y-6">
      {/* ── Banner renovación urgente ── */}
      {sub && remaining <= 7 && estado !== "cancelada" && (
        <div className="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                {remaining === 0 ? "Tu suscripción vence hoy" : `Tu suscripción vence en ${remaining} ${remaining === 1 ? "día" : "días"}`}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400">
                Renová ahora para no perder el acceso
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => handleCheckout(isTrial ? selectedPlanId : undefined)}
            disabled={checkingOut}
            className="gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0 shrink-0"
          >
            {checkingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
            Renovar ahora
          </Button>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Mi Suscripcion
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gestion de tu plan, pagos y soporte tecnico
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchSubscription();
            fetchTickets();
          }}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      {subLoading ? (
        <KpiSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Estado */}
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </p>
                {sub ? (
                  <Badge
                    className={`${estadoSubColors[estado].badge} border-0 text-xs font-semibold px-2.5 py-0.5`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${estadoSubColors[estado].dot}`}
                    />
                    {estadoSubLabels[estado]}
                  </Badge>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin suscripcion
                  </p>
                )}
              </div>
              <div className="w-11 h-11 rounded-xl bg-[var(--ht-accent)]/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[var(--ht-accent)] dark:text-emerald-300" />
              </div>
            </div>
          </div>

          {/* Plan Actual */}
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Plan Actual
                </p>
                <p className="text-lg font-bold">{planName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(precioMensual)}/mes
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[var(--ht-accent-warm)]/15 flex items-center justify-center">
                <Crown className="w-5 h-5 text-[var(--ht-accent-warm)] dark:text-amber-400" />
              </div>
            </div>
          </div>

          {/* Dias Restantes */}
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Días Restantes
                </p>
                <p className="text-2xl font-bold">
                  {sub ? remaining : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {remaining <= 7 && remaining > 0 && sub
                    ? "Renueva pronto"
                    : remaining === 0 && sub
                      ? "Vence hoy"
                      : ""}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[var(--ht-primary)]/15 flex items-center justify-center">
                <Clock className="w-5 h-5 text-[var(--ht-primary)]" />
              </div>
            </div>
          </div>

          {/* Proximo Pago */}
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Próximo Pago
                </p>
                <p className="text-lg font-bold">
                  {nextPayment ? formatDate(nextPayment) : "—"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sub?.auto_renew
                    ? "Renovación automática"
                    : "Renovación manual"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[var(--ht-accent)]/15 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-[var(--ht-accent)]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detalles de Suscripción ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detalles de Suscripcion */}
        {subLoading ? (
          <CardSkeleton height="h-[380px]" />
        ) : (
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-accent-dark)] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    Detalles de Suscripción
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Información de tu plan actual
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-5">
              {subError || !sub ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-4">
                    <AlertTriangle className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Sin suscripcion activa</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contacta con soporte para activar tu plan
                  </p>
                </div>
              ) : (
                <>
                  {/* Plan info */}
                  <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Plan
                      </span>
                      <span className="text-sm font-semibold">
                        {sub.plan?.nombre}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Precio
                      </span>
                      <span className="text-sm font-semibold">
                        {formatCurrency(sub.plan?.precio_mensual)}/mes
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Max. usuarios
                      </span>
                      <span className="text-sm font-semibold">
                        {sub.plan?.max_usuarios ?? "Ilimitados"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Max. pacientes
                      </span>
                      <span className="text-sm font-semibold">
                        {sub.plan?.max_pacientes ?? "Ilimitados"}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        Fecha inicio
                      </p>
                      <p className="text-sm font-semibold">
                        {formatDate(sub.fecha_inicio)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 text-center">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                        Fecha fin
                      </p>
                      <p className="text-sm font-semibold">
                        {formatDate(sub.fecha_fin)}
                      </p>
                    </div>
                    {sub.trial_ends_at && (
                      <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-3 text-center col-span-2">
                        <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-medium mb-1">
                          Trial vence
                        </p>
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          {formatDate(sub.trial_ends_at)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Progreso del periodo
                      </span>
                      <span className="font-medium">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent-dark)] transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {used} de {totalDays} dias utilizados
                    </p>
                  </div>

                  {/* Selector de plan (solo en trial o si no tiene plan pagado) */}
                  {isTrial && planes.length > 0 && (
                    <div className="pt-2 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Elegí tu plan
                      </p>
                      <div className="flex flex-col gap-2">
                        {planes.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedPlanId(p.id)}
                            className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                              selectedPlanId === p.id
                                ? "border-[var(--ht-primary)] bg-[var(--ht-primary)]/5"
                                : "border-border hover:border-[var(--ht-primary)]/50"
                            }`}
                          >
                            <div>
                              <p className="text-sm font-semibold">{p.nombre}</p>
                              {p.descripcion && (
                                <p className="text-xs text-muted-foreground">{p.descripcion}</p>
                              )}
                            </div>
                            <span className="text-sm font-bold text-[var(--ht-primary)] shrink-0 ml-3">
                              ${Number(p.precio_mensual).toLocaleString("es-AR")}/mes
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botones de acción */}
                  <div className="flex items-center justify-between pt-2 gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCheckout(isTrial ? selectedPlanId : undefined)}
                      disabled={checkingOut || estado === "cancelada" || (isTrial && !selectedPlanId)}
                      className="gap-1.5 text-xs bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white border-0"
                    >
                      {checkingOut ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      {isTrial ? "Activar plan" : "Suscribirse"}
                    </Button>
                    {estado === "activa" && !isTrial && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCancelDialogOpen(true)}
                        disabled={canceling}
                        className="gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelar suscripción
                      </Button>
                    )}
                  </div>

                  {/* Features */}
                  {sub.plan?.features &&
                    Object.keys(sub.plan.features).length > 0 && (
                      <div className="space-y-2 pt-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Funcionalidades incluidas
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {Object.entries(sub.plan.features).map(
                            ([key, enabled]) => (
                              <div
                                key={key}
                                className="flex items-center gap-2 text-sm"
                              >
                                {enabled ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ht-accent)] shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                )}
                                <span
                                  className={
                                    enabled
                                      ? ""
                                      : "text-muted-foreground/60 line-through"
                                  }
                                >
                                  {key
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Soporte Técnico ── */}
        {ticketsLoading ? (
          <CardSkeleton height="h-[350px]" />
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
                  <p className="text-sm text-muted-foreground">
                    Tickets de soporte y consultas
                  </p>
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
                    {/* Ticket header row */}
                    <button
                      type="button"
                      className="w-full p-4 text-left"
                      onClick={() =>
                        setExpandedTicket(
                          expandedTicket === ticket.id ? null : ticket.id
                        )
                      }
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <p className="text-sm font-semibold truncate">
                              {ticket.asunto}
                            </p>
                            {ticket.respuesta_admin && (
                              <MessageSquare className="w-3.5 h-3.5 text-[var(--ht-accent)] shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge
                              className={`border-0 text-[10px] ${
                                categoriaColors[ticket.categoria] ??
                                categoriaColors.otro
                              }`}
                            >
                              {categoriaLabels[ticket.categoria] ??
                                ticket.categoria}
                            </Badge>
                            <Badge
                              className={`border-0 text-[10px] ${
                                prioridadColors[ticket.prioridad] ??
                                prioridadColors.media
                              }`}
                            >
                              {prioridadLabels[ticket.prioridad] ??
                                ticket.prioridad}
                            </Badge>
                            <Badge
                              className={`border-0 text-[10px] ${
                                estadoTicketColors[ticket.estado] ??
                                estadoTicketColors.abierto
                              }`}
                            >
                              {estadoTicketLabels[ticket.estado] ??
                                ticket.estado}
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

                    {/* Expandable body */}
                    {expandedTicket === ticket.id && (
                      <div className="px-4 pb-4 space-y-3 border-t pt-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Descripcion
                          </p>
                          <p className="text-sm whitespace-pre-wrap">
                            {ticket.descripcion}
                          </p>
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

      </div>

      {/* ── Dialog: Cancelar suscripción ── */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Cancelar suscripción
            </DialogTitle>
            <DialogDescription>
              Esta acción cancelará el débito automático mensual en Mercado Pago.
              Seguirás teniendo acceso hasta el <strong>{sub?.fecha_fin ? new Date(sub.fecha_fin).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" }) : "fin del período"}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 text-sm text-orange-800 dark:text-orange-300">
            Una vez cancelada, no se realizarán más cobros automáticos. Podés volver a suscribirte cuando quieras.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={canceling}>
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="gap-2"
            >
              {canceling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              {canceling ? "Cancelando..." : "Sí, cancelar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Nuevo Ticket ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-sky-500" />
              Nuevo Ticket de Soporte
            </DialogTitle>
            <DialogDescription>
              Describe tu problema o consulta y nuestro equipo te respondera lo
              antes posible.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="asunto">Asunto</Label>
              <Input
                id="asunto"
                placeholder="Describe brevemente el tema..."
                value={newTicket.asunto}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, asunto: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <textarea
                id="descripcion"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="Explica con detalle tu problema o consulta..."
                value={newTicket.descripcion}
                onChange={(e) =>
                  setNewTicket({ ...newTicket, descripcion: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={newTicket.categoria}
                  onValueChange={(v: string | null) =>
                    v && setNewTicket({ ...newTicket, categoria: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue>{TICKET_CATEGORIA_LABELS[newTicket.categoria] ?? newTicket.categoria}</SelectValue>
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
                  onValueChange={(v: string | null) =>
                    v && setNewTicket({ ...newTicket, prioridad: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue>{TICKET_PRIORIDAD_LABELS[newTicket.prioridad] ?? newTicket.prioridad}</SelectValue>
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
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTicket}
              disabled={creating}
              className="gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border-0"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {creating ? "Enviando..." : "Enviar ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
