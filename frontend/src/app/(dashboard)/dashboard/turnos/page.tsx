"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import turnosService, {
  Turno,
  EstadoTurno,
  CreateTurnoPayload,
  UpdateTurnoPayload,
  TRATAMIENTOS_LABELS,
} from "@/services/turnos.service";
import tratamientosService, { Tratamiento } from "@/services/tratamientos.service";
import pagosService from "@/services/pagos.service";
import obrasSocialesService, { ObraSocial } from "@/services/obras-sociales.service";
import pacientesService, { Paciente } from "@/services/pacientes.service";
import usersService, { User } from "@/services/users.service";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  DollarSign,
  Pencil,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CalendarDays,
  XCircle,
  UserX,
  RefreshCw,
  Send,
  Copy,
  FileText,
  ShieldCheck,
} from "lucide-react";
import type { Pago } from "@/services/pagos.service";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { DayCalendar } from "@/components/calendar/DayCalendar";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { getWeekDays, toDateString } from "@/lib/calendar-utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { STATUS_COLORS, ESTADO_TURNO_LABELS } from "@/lib/constants";
import { LayoutList, KanbanSquare, Calendar, CalendarRange } from "lucide-react";

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function toLocalDatetimeValue(dateStr: string) {
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function toLocalDatetimeFromDate(d: Date) {
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function TurnosPage() {
  const { user } = useAuth();
  const isProfessional = user?.role === "professional";
  const searchParams = useSearchParams();
  const preloadPacienteId = searchParams.get("paciente_id");

  // View state
  const [activeView, setActiveView] = useState<string>("tabla");
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  // Table view state
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [filtroProfesional, setFiltroOdontologo] = useState<string>("all");

  // Data
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [calendarTurnos, setCalendarTurnos] = useState<Turno[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [profesionales, setOdontologos] = useState<User[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Turno | null>(null);
  const [changingStatus, setChangingStatus] = useState<Turno | null>(null);
  const [deleting, setDeleting] = useState<Turno | null>(null);
  const [deletePagosInfo, setDeletePagosInfo] = useState<{ count: number; total: number } | null>(null);
  const [loadingDeleteCheck, setLoadingDeleteCheck] = useState(false);
  const [pagoTurno, setPagoTurno] = useState<Turno | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newEstado, setNewEstado] = useState<EstadoTurno>("pendiente");
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [pagoForm, setPagoForm] = useState({
    total: "",
    method: "",
    fuente_pago: "particular" as "particular" | "obra_social",
    obra_social_id: "",
    obra_social_nombre: "",
    codigo_prestacion: "",
    nro_autorizacion: "",
  });
  const [pagoExistente, setPagoExistente] = useState<Pago | null>(null);
  const [loadingPago, setLoadingPago] = useState(false);
  const [overlapWarning, setOverlapWarning] = useState<string | null>(null);
  const [checkingOverlap, setCheckingOverlap] = useState(false);
  const [isReprogramacion, setIsReprogramacion] = useState(false);
  const [linkPagoDialogOpen, setLinkPagoDialogOpen] = useState(false);
  const [linkPagoTurnoId, setLinkPagoTurnoId] = useState<string | null>(null);
  const [linkPagoMonto, setLinkPagoMonto] = useState<number>(0);
  const [linkPagoUrl, setLinkPagoUrl] = useState<string | null>(null);
  const [sendingLink, setSendingLink] = useState(false);
  const [consentimientoDialogOpen, setConsentimientoDialogOpen] = useState(false);
  const [consentimientoTurno, setConsentimientoTurno] = useState<Turno | null>(null);
  const [consentimientoUrl, setConsentimientoUrl] = useState<string | null>(null);
  const [loadingConsentimiento, setLoadingConsentimiento] = useState(false);
  const [form, setForm] = useState({
    paciente_id: "",
    user_id: "",
    start_time: "",
    end_time: "",
    tipo_tratamiento: "",
    notas: "",
  });

  // Load table data
  const loadTurnos = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (fecha) params.fecha = fecha;
      if (filtroEstado !== "all") params.estado = filtroEstado;
      // Profesional solo ve sus propios turnos
      if (isProfessional && user?.id) {
        params.user_id = user.id;
      } else if (filtroProfesional !== "all") {
        params.user_id = filtroProfesional;
      }
      const data = await turnosService.getAll(params as any);
      setTurnos(data);
    } catch {
      toast.error("Error al cargar turnos");
    } finally {
      setIsLoading(false);
    }
  }, [fecha, filtroEstado, filtroProfesional, isProfessional, user?.id]);

  // Load calendar data (week range or single day)
  const loadCalendarTurnos = useCallback(async () => {
    try {
      const myFilter = isProfessional && user?.id ? { user_id: user.id } : {};
      if (activeView === "semana" || activeView === "kanban") {
        const days = getWeekDays(calendarDate);
        const data = await turnosService.getAll({
          fecha_desde: toDateString(days[0]),
          fecha_hasta: toDateString(days[6]),
          ...myFilter,
        });
        setCalendarTurnos(data);
      } else if (activeView === "dia") {
        const data = await turnosService.getAll({
          fecha: toDateString(calendarDate),
          ...myFilter,
        });
        setCalendarTurnos(data);
      }
    } catch {
      toast.error("Error al cargar turnos del calendario");
    }
  }, [calendarDate, activeView, isProfessional, user?.id]);

  const loadOptions = useCallback(async () => {
    try {
      const [pacsResult, users, tratamientosData, osData] = await Promise.all([
        pacientesService.getAll(undefined, { limit: 1000 }),
        usersService.getAll(),
        tratamientosService.getActive(),
        obrasSocialesService.getActive(),
      ]);
      setPacientes(pacsResult.data);
      setOdontologos(users.filter((u) => u.role === "professional"));
      setTratamientos(tratamientosData);
      setObrasSociales(osData);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (activeView === "tabla") {
      loadTurnos();
    }
  }, [loadTurnos, activeView]);

  useEffect(() => {
    if (activeView === "semana" || activeView === "dia" || activeView === "kanban") {
      loadCalendarTurnos();
    }
  }, [loadCalendarTurnos, activeView]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Mapa nombre tratamiento: busca en dinámicos, luego fallback histórico
  const getTratamientoLabel = useCallback(
    (value: string | null) => {
      if (!value) return "—";
      const found = tratamientos.find((t) => t.nombre === value);
      if (found) return found.nombre;
      return TRATAMIENTOS_LABELS[value] || value;
    },
    [tratamientos],
  );

  // Auto-abrir diálogo si viene con paciente_id desde ficha
  useEffect(() => {
    if (preloadPacienteId && pacientes.length > 0) {
      setEditing(null);
      setIsReprogramacion(false);
      const defaultStart = `${fecha}T09:00`;
      const defaultEnd = `${fecha}T09:30`;
      setForm({
        paciente_id: preloadPacienteId,
        user_id: "",
        start_time: defaultStart,
        end_time: defaultEnd,
        tipo_tratamiento: "",
        notas: "",
      });
      setDialogOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadPacienteId, pacientes]);

  // Check overlap when user_id, start_time or end_time change
  useEffect(() => {
    setOverlapWarning(null);
    if (!form.user_id || !form.start_time || !form.end_time) return;

    const timer = setTimeout(async () => {
      setCheckingOverlap(true);
      try {
        const start = new Date(form.start_time);
        const end = new Date(form.end_time);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

        const fecha = form.start_time.split("T")[0];
        const allTurnos = await turnosService.getAll({ fecha });
        const conflict = allTurnos.find((t) => {
          if (t.user_id !== form.user_id) return false;
          if (editing && t.id === editing.id) return false;
          if (t.estado === "cancelado" || t.estado === "perdido") return false;
          const tStart = new Date(t.start_time);
          const tEnd = new Date(t.end_time);
          return tStart < end && tEnd > start;
        });

        if (conflict) {
          const pacName = conflict.paciente
            ? `${conflict.paciente.nombre} ${conflict.paciente.apellido}`
            : "otro paciente";
          setOverlapWarning(
            `Este profesional ya tiene un turno con ${pacName} de ${formatTime(conflict.start_time)} a ${formatTime(conflict.end_time)} (${ESTADO_TURNO_LABELS[conflict.estado] || conflict.estado})`,
          );
        }
      } catch {
        // silently fail
      } finally {
        setCheckingOverlap(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [form.user_id, form.start_time, form.end_time, editing]);

  // KPI stats from calendar turnos
  const kpiStats = useMemo(() => {
    const source = activeView === "tabla" ? turnos : calendarTurnos;
    const pendientes = source.filter((t) => t.estado === "pendiente").length;
    const confirmados = source.filter((t) => t.estado === "confirmado").length;
    const completados = source.filter((t) => t.estado === "completado").length;
    const cancelados = source.filter((t) => t.estado === "cancelado").length;
    const perdidos = source.filter((t) => t.estado === "perdido" && !t.fue_reprogramado).length;
    return { total: source.length, pendientes, confirmados, completados, cancelados, perdidos };
  }, [turnos, calendarTurnos, activeView]);

  const VIEW_OPTIONS = [
    { id: "kanban", label: "Kanban", icon: KanbanSquare },
    { id: "tabla", label: "Listado", icon: LayoutList },
    { id: "dia", label: "Día", icon: Calendar },
    { id: "semana", label: "Semana", icon: CalendarRange },
  ] as const;

  // Actions
  const openCreate = () => {
    setEditing(null);
    setIsReprogramacion(false);
    const defaultStart = `${fecha}T09:00`;
    const defaultEnd = `${fecha}T09:30`;
    setForm({
      paciente_id: "",
      user_id: "",
      start_time: defaultStart,
      end_time: defaultEnd,
      tipo_tratamiento: "",
      notas: "",
    });
    setDialogOpen(true);
  };

  const openCreateFromCalendar = (start: Date, end: Date) => {
    setEditing(null);
    setIsReprogramacion(false);
    setForm({
      paciente_id: "",
      user_id: "",
      start_time: toLocalDatetimeFromDate(start),
      end_time: toLocalDatetimeFromDate(end),
      tipo_tratamiento: "",
      notas: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (turno: Turno) => {
    setEditing(turno);
    setForm({
      paciente_id: turno.paciente_id,
      user_id: turno.user_id,
      start_time: toLocalDatetimeValue(turno.start_time),
      end_time: toLocalDatetimeValue(turno.end_time),
      tipo_tratamiento: turno.tipo_tratamiento || "",
      notas: turno.notas || "",
    });
    setDialogOpen(true);
  };

  const openStatusChange = (turno: Turno) => {
    setChangingStatus(turno);
    setNewEstado(turno.estado);
    setStatusDialogOpen(true);
  };

  const openDelete = async (turno: Turno) => {
    setDeleting(turno);
    setDeletePagosInfo(null);
    setLoadingDeleteCheck(true);
    setDeleteDialogOpen(true);
    try {
      const info = await turnosService.getPagosCount(turno.id);
      setDeletePagosInfo(info);
    } catch {
      setDeletePagosInfo({ count: 0, total: 0 });
    } finally {
      setLoadingDeleteCheck(false);
    }
  };

  const openPago = async (turno: Turno) => {
    setPagoTurno(turno);
    // Pre-llenar OS del paciente si tiene una registrada en el catálogo
    const pacienteOS = turno.paciente?.obra_social ?? "";
    const osMatch = obrasSociales.find(
      (os) => os.nombre.toLowerCase() === pacienteOS.toLowerCase()
    );
    setPagoForm({
      total: "",
      method: "",
      fuente_pago: pacienteOS ? "obra_social" : "particular",
      obra_social_id: osMatch?.id ?? "",
      obra_social_nombre: osMatch?.nombre ?? pacienteOS,
      codigo_prestacion: "",
      nro_autorizacion: "",
    });
    setPagoExistente(null);
    setLoadingPago(true);
    setPagoDialogOpen(true);
    try {
      const pagos = await pagosService.getByTurno(turno.id);
      const activo = pagos.find(
        (p) => p.estado === "pendiente" || p.estado === "aprobado",
      );
      setPagoExistente(activo || null);
    } catch {
      // silently fail
    } finally {
      setLoadingPago(false);
    }
  };

  const reloadAll = () => {
    if (activeView === "tabla") loadTurnos();
    else loadCalendarTurnos();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        const payload: UpdateTurnoPayload = {};
        if (form.paciente_id !== editing.paciente_id) payload.paciente_id = form.paciente_id;
        if (form.user_id !== editing.user_id) payload.user_id = form.user_id;
        const newStart = new Date(form.start_time).toISOString();
        const newEnd = new Date(form.end_time).toISOString();
        if (newStart !== editing.start_time) payload.start_time = newStart;
        if (newEnd !== editing.end_time) payload.end_time = newEnd;
        if (form.tipo_tratamiento !== (editing.tipo_tratamiento || ""))
          payload.tipo_tratamiento = form.tipo_tratamiento || undefined;
        if (form.notas !== (editing.notas || "")) payload.notas = form.notas;
        await turnosService.update(editing.id, payload);
        toast.success("Turno actualizado");
      } else {
        const payload: CreateTurnoPayload = {
          paciente_id: form.paciente_id,
          user_id: form.user_id,
          start_time: new Date(form.start_time).toISOString(),
          end_time: new Date(form.end_time).toISOString(),
          source: "dashboard",
        };
        if (form.tipo_tratamiento) payload.tipo_tratamiento = form.tipo_tratamiento;
        if (form.notas) payload.notas = form.notas;
        if (isReprogramacion) payload.es_reprogramacion = true;
        const created = await turnosService.create(payload);
        setIsReprogramacion(false);
        toast.success("Turno creado");
        // Ofrecer link de pago si el tratamiento tiene precio
        if (form.tipo_tratamiento) {
          const trat = tratamientos.find((t) => t.nombre === form.tipo_tratamiento);
          if (trat && trat.precio_base && trat.precio_base > 0) {
            setLinkPagoTurnoId(created.id);
            setLinkPagoMonto(trat.precio_base);
            setLinkPagoUrl(null);
            setLinkPagoDialogOpen(true);
          }
        }
      }
      setDialogOpen(false);
      reloadAll();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al guardar turno";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async () => {
    if (!changingStatus) return;
    try {
      await turnosService.update(changingStatus.id, { estado: newEstado });
      toast.success("Estado actualizado");
      setStatusDialogOpen(false);
      reloadAll();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al cambiar estado";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleStatusUpdate = async (turnoId: string, nuevoEstado: EstadoTurno) => {
    try {
      await turnosService.update(turnoId, { estado: nuevoEstado });
      toast.success(`Turno movido a ${ESTADO_TURNO_LABELS[nuevoEstado]}`);
      reloadAll();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al cambiar estado";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  // Mover turno (drag & drop desde calendario): optimistic update + rollback
  const handleMoveTurno = useCallback(
    async (turno: Turno, newStart: Date, newEnd: Date) => {
      // Validar overlap con otros turnos del mismo profesional
      const conflict = calendarTurnos.find((t) => {
        if (t.id === turno.id) return false;
        if (t.user_id !== turno.user_id) return false;
        if (t.estado === "cancelado" || t.estado === "perdido") return false;
        const tStart = new Date(t.start_time);
        const tEnd = new Date(t.end_time);
        return tStart < newEnd && tEnd > newStart;
      });
      if (conflict) {
        const pacName = conflict.paciente
          ? `${conflict.paciente.nombre} ${conflict.paciente.apellido}`
          : "otro paciente";
        toast.error(
          `Choca con turno de ${pacName} (${formatTime(conflict.start_time)} – ${formatTime(conflict.end_time)})`,
        );
        return;
      }

      const newStartIso = newStart.toISOString();
      const newEndIso = newEnd.toISOString();
      const previous = calendarTurnos;

      // Optimistic update
      setCalendarTurnos((prev) =>
        prev.map((t) =>
          t.id === turno.id ? { ...t, start_time: newStartIso, end_time: newEndIso } : t,
        ),
      );

      try {
        await turnosService.update(turno.id, {
          start_time: newStartIso,
          end_time: newEndIso,
        });
        const dia = newStart.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
        toast.success(`Turno movido a ${dia} · ${formatTime(newStartIso)}`);
      } catch (err: any) {
        // Rollback
        setCalendarTurnos(previous);
        const msg = err?.response?.data?.message || "No se pudo mover el turno";
        toast.error(Array.isArray(msg) ? msg[0] : msg);
      }
    },
    [calendarTurnos],
  );

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoTurno) return;
    const esOS = pagoForm.fuente_pago === "obra_social";
    const esMercadoPago = pagoForm.method === "mercadopago";
    try {
      await pagosService.create({
        turno_id: pagoTurno.id,
        total: pagoForm.total ? parseFloat(pagoForm.total) : undefined,
        method: esOS ? "obra_social" : pagoForm.method || undefined,
        fuente_pago: pagoForm.fuente_pago,
        ...(esOS && {
          obra_social_id: pagoForm.obra_social_id || undefined,
          obra_social_nombre: pagoForm.obra_social_nombre || undefined,
          codigo_prestacion: pagoForm.codigo_prestacion || undefined,
          nro_autorizacion: pagoForm.nro_autorizacion || undefined,
        }),
      });
      setPagoDialogOpen(false);
      if (esMercadoPago) {
        setLinkPagoTurnoId(pagoTurno.id);
        setLinkPagoMonto(pagoForm.total ? parseFloat(pagoForm.total) : 0);
        setLinkPagoUrl(null);
        setLinkPagoDialogOpen(true);
      } else {
        toast.success("Pago registrado");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al registrar pago";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleGenerarLink = async () => {
    if (!linkPagoTurnoId || !user?.clinica_id) return;
    setSendingLink(true);
    try {
      const data = await turnosService.getLinkPago(linkPagoTurnoId, user.clinica_id);
      setLinkPagoUrl(data.checkout_url);
      toast.success("Link de pago generado");
    } catch {
      toast.error("Error al generar el link de pago. Verificá la configuración de MercadoPago.");
    } finally {
      setSendingLink(false);
    }
  };

  const handleReprogramar = async (turno: Turno) => {
    try {
      await turnosService.reprogramar(turno.id);
      setEditing(null);
      setIsReprogramacion(true);
      setForm({
        paciente_id: turno.paciente_id,
        user_id: turno.user_id,
        start_time: "",
        end_time: "",
        tipo_tratamiento: turno.tipo_tratamiento || "",
        notas: turno.notas ? `Reprogramado: ${turno.notas}` : "Turno reprogramado",
      });
      setDialogOpen(true);
      reloadAll();
      toast.info("Selecciona nuevo horario para reprogramar el turno");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al reprogramar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const openConsentimiento = (turno: Turno) => {
    setConsentimientoTurno(turno);
    setConsentimientoUrl(turno.consentimiento_url || null);
    setConsentimientoDialogOpen(true);
  };

  const handleEnviarConsentimiento = async () => {
    if (!consentimientoTurno) return;
    setLoadingConsentimiento(true);
    try {
      const data = await turnosService.generarConsentimiento(consentimientoTurno.id);
      setConsentimientoUrl(data.url);
      setTurnos((prev) =>
        prev.map((t) =>
          t.id === consentimientoTurno.id
            ? { ...t, consentimiento_enviado: true, consentimiento_url: data.url }
            : t,
        ),
      );
      toast.success("Consentimiento generado y listo para enviar");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al generar el consentimiento";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoadingConsentimiento(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await turnosService.delete(deleting.id);
      toast.success("Turno eliminado");
      setDeleteDialogOpen(false);
      setDeleting(null);
      reloadAll();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al eliminar turno";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="animate-page-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona la agenda de turnos de tu clínica
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white shadow-[var(--shadow-primary)] hover:shadow-md transition-all"
        >
          <CalendarDays className="h-4 w-4" />
          Nuevo Turno
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Pendientes"
          value={kpiStats.pendientes}
          sub="por atender"
          icon={<Clock className="h-5 w-5" />}
          variant="warm"
        />
        <KpiCard
          label="Confirmados"
          value={kpiStats.confirmados}
          sub="con confirmación"
          icon={<CalendarDays className="h-5 w-5" />}
          variant="primary"
        />
        <KpiCard
          label="Completados"
          value={kpiStats.completados}
          sub="finalizados"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="accent"
        />
        <KpiCard
          label="Cancelados"
          value={kpiStats.cancelados}
          sub="no realizados"
          icon={<XCircle className="h-5 w-5" />}
          variant="danger"
        />
        <KpiCard
          label="Perdidos"
          value={kpiStats.perdidos}
          sub="sin reprogramar"
          icon={<UserX className="h-5 w-5" />}
          gradient="from-orange-500 to-amber-600"
        />
      </div>

      {/* View switcher: Kanban / Listado / Día / Semana */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div
          role="tablist"
          aria-label="Modo de visualización"
          className="inline-flex rounded-xl border border-[var(--border-light)] bg-card p-1 shadow-[var(--shadow-card)]"
        >
          {VIEW_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = activeView === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveView(opt.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-[var(--shadow-primary)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vista Kanban */}
      {activeView === "kanban" && (
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between pb-4 border-b border-border/50 mb-4">
            <div>
              <h2 className="text-base font-semibold">Tablero Kanban</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Arrastrá las tarjetas entre columnas para cambiar el estado del turno
              </p>
            </div>
          </div>
          <KanbanBoard
            turnos={calendarTurnos}
            onEdit={openEdit}
            onPago={openPago}
            onStatusChange={openStatusChange}
            onStatusUpdate={handleStatusUpdate}
            onDelete={openDelete}
            onReprogramar={handleReprogramar}
            onConsentimiento={openConsentimiento}
            onSlotClick={openCreateFromCalendar}
          />
        </div>
      )}

      {/* Calendar / Table toggle */}
      {activeView === "semana" && (
        <WeekCalendar
          turnos={calendarTurnos}
          currentDate={calendarDate}
          onDateChange={setCalendarDate}
          onSlotClick={openCreateFromCalendar}
          onEventClick={openEdit}
          onViewChange={setActiveView}
          onMoveTurno={handleMoveTurno}
        />
      )}

      {activeView === "dia" && (
        <DayCalendar
          turnos={calendarTurnos}
          currentDate={calendarDate}
          onDateChange={setCalendarDate}
          onSlotClick={openCreateFromCalendar}
          onEventClick={openEdit}
          onViewChange={setActiveView}
          onMoveTurno={handleMoveTurno}
        />
      )}

      {activeView === "tabla" && (
        <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between px-6 pt-6 pb-0">
            <div>
              <h2 className="text-base font-semibold">Agenda del Día</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Filtra por fecha y estado</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveView("semana")}
              className="flex items-center gap-2 rounded-xl border border-[var(--border-light)] px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            >
              Ver Calendario
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-4 px-6 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Fecha</span>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Estado</span>
              <Select
                value={filtroEstado}
                onValueChange={(v: string | null) => v && setFiltroEstado(v)}
              >
                <SelectTrigger className="w-44">
                  <span>
                    {{ all: "Todos los estados", pendiente: "Pendiente", confirmado: "Confirmado", completado: "Completado", cancelado: "Cancelado", perdido: "Perdido" }[filtroEstado]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="confirmado">Confirmado</SelectItem>
                  <SelectItem value="completado">Completado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">Profesional</span>
              <Select
                value={filtroProfesional}
                onValueChange={(v: string | null) => v && setFiltroOdontologo(v)}
              >
                <SelectTrigger className="w-52">
                  <span className="flex flex-1 text-left truncate text-sm">
                    {filtroProfesional !== "all" ? (
                      (() => {
                        const u = profesionales.find((o) => o.id === filtroProfesional);
                        return u ? `${u.nombre} ${u.apellido}` : "Profesional";
                      })()
                    ) : (
                      "Todos los profesionales"
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los profesionales</SelectItem>
                  {profesionales.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre} {u.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="px-6 pb-6">
            {isLoading ? (
              <TableSkeleton rows={5} cols={8} />
            ) : turnos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <svg className="h-12 w-12 mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
                </svg>
                <p className="text-sm font-medium">No hay turnos para esta fecha</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Horario</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Profesional</TableHead>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Origen</TableHead>
                    <TableHead className="max-w-[160px]">Notas</TableHead>
                    <TableHead className="w-[120px] text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {turnos.map((turno) => (
                    <TableRow key={turno.id} className="group">
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatTime(turno.start_time)} - {formatTime(turno.end_time)}
                      </TableCell>
                      <TableCell>
                        {turno.paciente ? (
                          <Link
                            href={`/dashboard/pacientes/${turno.paciente.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {turno.paciente.nombre} {turno.paciente.apellido}
                          </Link>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {turno.user ? (
                          <button
                            type="button"
                            className="text-primary hover:underline font-medium text-left"
                            onClick={() => {
                              setFiltroOdontologo(turno.user_id);
                              toast.info(`Filtrando turnos de ${turno.user!.nombre} ${turno.user!.apellido}`);
                            }}
                            title={`Filtrar turnos de ${turno.user.nombre} ${turno.user.apellido}`}
                          >
                            {turno.user.nombre} {turno.user.apellido}
                          </button>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {getTratamientoLabel(turno.tipo_tratamiento)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={turno.estado}
                          label={ESTADO_TURNO_LABELS[turno.estado]}
                          onClick={() => openStatusChange(turno)}
                        />
                      </TableCell>
                      <TableCell>
                        {turno.source === "whatsapp" ? (
                          <Badge variant="outline">WhatsApp</Badge>
                        ) : turno.source === "dashboard" ? (
                          <Badge variant="secondary">Dashboard</Badge>
                        ) : (
                          "\u2014"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {turno.notas || "\u2014"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {turno.estado === "perdido" && !turno.fue_reprogramado ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-all duration-200 hover:scale-110"
                              onClick={() => handleReprogramar(turno)}
                              title="Reprogramar"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all duration-200 hover:scale-110"
                              onClick={() => openPago(turno)}
                              disabled={turno.estado === "cancelado" || turno.estado === "perdido"}
                              title="Cobrar"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => openEdit(turno)}
                            disabled={
                              turno.estado === "cancelado" ||
                              turno.estado === "completado" ||
                              turno.estado === "perdido"
                            }
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 transition-all duration-200 hover:scale-110 ${
                              turno.consentimiento_aceptado
                                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                : "text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                            }`}
                            onClick={() => openConsentimiento(turno)}
                            title={turno.consentimiento_aceptado ? "Consentimiento firmado" : "Enviar consentimiento"}
                          >
                            {turno.consentimiento_aceptado ? (
                              <ShieldCheck className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => openDelete(turno)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Dialog Crear/Editar Turno */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Turno" : "Nuevo Turno"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del turno"
                : "Completa los datos para agendar un nuevo turno"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paciente_id">Paciente *</Label>
              <Select
                value={form.paciente_id}
                onValueChange={(v: string | null) =>
                  setForm({ ...form, paciente_id: v || "" })
                }
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate text-sm">
                    {form.paciente_id ? (
                      (() => {
                        const p = pacientes.find(
                          (pac) => pac.id === form.paciente_id,
                        );
                        return p
                          ? `${p.nombre} ${p.apellido} \u2014 DNI ${p.dni}`
                          : "Seleccionar paciente";
                      })()
                    ) : (
                      <span className="text-muted-foreground">
                        Seleccionar paciente
                      </span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {pacientes.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} {p.apellido} — DNI {p.dni}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_id">Profesional *</Label>
              <Select
                value={form.user_id}
                onValueChange={(v: string | null) =>
                  setForm({ ...form, user_id: v || "" })
                }
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate text-sm">
                    {form.user_id ? (
                      (() => {
                        const u = profesionales.find(
                          (o) => o.id === form.user_id,
                        );
                        return u
                          ? `${u.nombre} ${u.apellido}`
                          : "Seleccionar profesional";
                      })()
                    ) : (
                      <span className="text-muted-foreground">
                        Seleccionar profesional
                      </span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {profesionales.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre} {u.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_tratamiento">Tratamiento</Label>
              <Select
                value={form.tipo_tratamiento}
                onValueChange={(v: string | null) =>
                  setForm({ ...form, tipo_tratamiento: v || "" })
                }
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate text-sm">
                    {form.tipo_tratamiento ? (
                      getTratamientoLabel(form.tipo_tratamiento)
                    ) : (
                      <span className="text-muted-foreground">
                        Seleccionar tratamiento
                      </span>
                    )}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {tratamientos.map((t) => (
                    <SelectItem key={t.id} value={t.nombre}>
                      <span className="flex items-center gap-2">
                        {t.color && (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                        )}
                        {t.nombre}
                        {t.duracion_min && (
                          <span className="text-muted-foreground text-xs">
                            ({t.duracion_min} min)
                          </span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Inicio *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) =>
                    setForm({ ...form, start_time: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">Fin *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) =>
                    setForm({ ...form, end_time: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Observaciones del turno..."
                rows={3}
              />
            </div>

            {overlapWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-300">{overlapWarning}</p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !form.paciente_id || !form.user_id || !!overlapWarning || checkingOverlap}
              >
                {checkingOverlap
                  ? "Verificando..."
                  : isSaving
                    ? "Guardando..."
                    : editing
                      ? "Guardar Cambios"
                      : "Crear Turno"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Cambiar Estado */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Cambiar Estado</DialogTitle>
            <DialogDescription>
              Selecciona el nuevo estado del turno
            </DialogDescription>
          </DialogHeader>
          <Select
            value={newEstado}
            onValueChange={(v: string | null) =>
              v && setNewEstado(v as EstadoTurno)
            }
          >
            <SelectTrigger>
              <SelectValue>{ESTADO_TURNO_LABELS[newEstado] ?? newEstado}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
              <SelectItem value="perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleStatusChange}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminacion */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará el turno de{" "}
              <strong>
                {deleting?.paciente
                  ? `${deleting.paciente.nombre} ${deleting.paciente.apellido}`
                  : "este paciente"}
              </strong>{" "}
              del {deleting ? formatDate(deleting.start_time) : ""} a las{" "}
              {deleting ? formatTime(deleting.start_time) : ""}.
            </DialogDescription>
          </DialogHeader>
          {loadingDeleteCheck ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Verificando pagos asociados...
            </div>
          ) : deletePagosInfo && deletePagosInfo.count > 0 ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 p-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  Este turno tiene {deletePagosInfo.count} pago{deletePagosInfo.count > 1 ? "s" : ""} asociado{deletePagosInfo.count > 1 ? "s" : ""}
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  Total cobrado: ${Number(deletePagosInfo.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-1 font-medium">
                  Al eliminar el turno también se eliminarán todos los pagos asociados.
                </p>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loadingDeleteCheck}>
              {deletePagosInfo && deletePagosInfo.count > 0
                ? "Eliminar turno y pagos"
                : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Pago */}
      <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {pagoTurno?.paciente
                ? `${pagoTurno.paciente.nombre} ${pagoTurno.paciente.apellido}`
                : "Registrar pago para este turno"}
              {pagoTurno
                ? ` \u2014 ${formatDate(pagoTurno.start_time)} ${formatTime(pagoTurno.start_time)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {loadingPago ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Verificando pagos existentes...
            </div>
          ) : pagoExistente ? (
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 p-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-300">
                  Este turno ya tiene un pago {pagoExistente.estado}
                </p>
                <p className="text-amber-700 dark:text-amber-400 mt-1">
                  ${Number(pagoExistente.total).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  {pagoExistente.method ? ` · ${pagoExistente.method}` : ""}
                  {pagoExistente.fuente_pago === "obra_social" && pagoExistente.obra_social_nombre
                    ? ` · OS: ${pagoExistente.obra_social_nombre}` : ""}
                </p>
              </div>
            </div>
          ) : null}

          <form onSubmit={handlePago} className="space-y-4">
            {/* Fuente de pago toggle */}
            <div className="space-y-1.5">
              <Label>Fuente de pago</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["particular", "obra_social"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPagoForm({ ...pagoForm, fuente_pago: f })}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      pagoForm.fuente_pago === f
                        ? f === "particular"
                          ? "border-[var(--ht-primary)] bg-[var(--ht-primary)]/10 text-[var(--ht-primary)]"
                          : "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {f === "particular" ? "Particular" : "Obra Social"}
                  </button>
                ))}
              </div>
            </div>

            {/* Monto */}
            <div className="space-y-1.5">
              <Label htmlFor="pago-total">Monto ($) *</Label>
              <Input
                id="pago-total"
                type="number"
                step="0.01"
                value={pagoForm.total}
                onChange={(e) => setPagoForm({ ...pagoForm, total: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            {/* Método de pago — solo particular */}
            {pagoForm.fuente_pago === "particular" && (
              <div className="space-y-1.5">
                <Label htmlFor="pago-method">Método de pago *</Label>
                <Select
                  value={pagoForm.method}
                  onValueChange={(v: string | null) => setPagoForm({ ...pagoForm, method: v || "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="mercadopago">MercadoPago</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
                {pagoForm.method === "mercadopago" && (
                  <p className="text-xs text-[var(--ht-primary)] flex items-center gap-1.5 mt-1">
                    <Send className="h-3 w-3" />
                    Al registrar, se generará el link de cobro por MercadoPago
                  </p>
                )}
              </div>
            )}

            {/* Campos Obra Social */}
            {pagoForm.fuente_pago === "obra_social" && (
              <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20 p-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pago-os">Obra Social *</Label>
                  {obrasSociales.length > 0 ? (
                    <Select
                      value={pagoForm.obra_social_id}
                      onValueChange={(v) => {
                        const os = obrasSociales.find((o) => o.id === v);
                        setPagoForm({ ...pagoForm, obra_social_id: v ?? "", obra_social_nombre: os?.nombre ?? "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar obra social" />
                      </SelectTrigger>
                      <SelectContent>
                        {obrasSociales.map((os) => (
                          <SelectItem key={os.id} value={os.id}>
                            {os.nombre}{os.codigo ? ` (${os.codigo})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="pago-os"
                      value={pagoForm.obra_social_nombre}
                      onChange={(e) => setPagoForm({ ...pagoForm, obra_social_nombre: e.target.value })}
                      placeholder="Nombre de la obra social"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pago-codigo">Código prestación</Label>
                  <Input
                    id="pago-codigo"
                    value={pagoForm.codigo_prestacion}
                    onChange={(e) => setPagoForm({ ...pagoForm, codigo_prestacion: e.target.value })}
                    placeholder="Ej: 0501, AMB001"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pago-autorizacion">Nro. autorización</Label>
                  <Input
                    id="pago-autorizacion"
                    value={pagoForm.nro_autorizacion}
                    onChange={(e) => setPagoForm({ ...pagoForm, nro_autorizacion: e.target.value })}
                    placeholder="Número de autorización (opcional)"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPagoDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !pagoForm.total ||
                  (pagoForm.fuente_pago === "particular" && !pagoForm.method) ||
                  (pagoForm.fuente_pago === "obra_social" && !pagoForm.obra_social_id && !pagoForm.obra_social_nombre) ||
                  !!pagoExistente
                }
              >
                Registrar Pago
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Dialog Link de Pago MercadoPago */}
      <Dialog open={linkPagoDialogOpen} onOpenChange={(open) => { if (!open) setLinkPagoDialogOpen(false); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Generar link de pago</DialogTitle>
            <DialogDescription>
              {linkPagoMonto > 0
                ? `Cobro pendiente de $${Number(linkPagoMonto).toLocaleString("es-AR", { minimumFractionDigits: 2 })} listo para enviar.`
                : "¿Querés generar el link de cobro por MercadoPago?"}
            </DialogDescription>
          </DialogHeader>

          {linkPagoUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">Link generado correctamente</p>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={linkPagoUrl} className="text-xs font-mono" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => { navigator.clipboard.writeText(linkPagoUrl!); toast.success("Link copiado al portapapeles"); }}
                  title="Copiar link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-[var(--ht-primary)]/30 bg-[var(--ht-primary)]/5 p-3">
              <Send className="h-4 w-4 text-[var(--ht-primary)] shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Se generará un link de pago de MercadoPago que podés compartir con el paciente para que abone de forma online.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkPagoDialogOpen(false)}>
              {linkPagoUrl ? "Cerrar" : "No por ahora"}
            </Button>
            {!linkPagoUrl && (
              <Button
                onClick={handleGenerarLink}
                disabled={sendingLink}
                className="gap-2 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white"
              >
                <Send className="h-4 w-4" />
                {sendingLink ? "Generando..." : "Generar link de pago"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Dialog Consentimiento Informado */}
      <Dialog open={consentimientoDialogOpen} onOpenChange={(open) => { if (!open) { setConsentimientoDialogOpen(false); setConsentimientoUrl(null); } }}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Consentimiento informado
            </DialogTitle>
            <DialogDescription>
              {consentimientoTurno?.paciente
                ? `${consentimientoTurno.paciente.nombre} ${consentimientoTurno.paciente.apellido} · ${consentimientoTurno.tipo_tratamiento || "Tratamiento"}`
                : "Generá y enviá el consentimiento por WhatsApp"}
            </DialogDescription>
          </DialogHeader>

          {consentimientoTurno?.consentimiento_aceptado ? (
            <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Consentimiento firmado</p>
                {consentimientoTurno.consentimiento_aceptado_at && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {new Date(consentimientoTurno.consentimiento_aceptado_at).toLocaleString("es-AR")}
                  </p>
                )}
              </div>
            </div>
          ) : consentimientoUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">PDF generado — listo para compartir</p>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={consentimientoUrl} className="text-xs font-mono" />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => { navigator.clipboard.writeText(consentimientoUrl!); toast.success("Link copiado"); }}
                  title="Copiar link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Compartí este link o envialo por WhatsApp. El paciente debe responder <strong>ACEPTO</strong> para confirmar.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20 p-3">
              <FileText className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Se generará un PDF con los datos del paciente y el tratamiento. El paciente deberá responder <strong>ACEPTO</strong> por WhatsApp para confirmar.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setConsentimientoDialogOpen(false); setConsentimientoUrl(null); }}>
              {consentimientoUrl || consentimientoTurno?.consentimiento_aceptado ? "Cerrar" : "Cancelar"}
            </Button>
            {!consentimientoUrl && !consentimientoTurno?.consentimiento_aceptado && (
              <Button
                onClick={handleEnviarConsentimiento}
                disabled={loadingConsentimiento}
                className="gap-2 bg-gradient-to-r from-purple-600 to-purple-800 hover:opacity-90 text-white"
              >
                <FileText className="h-4 w-4" />
                {loadingConsentimiento ? "Generando PDF..." : "Generar consentimiento"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
