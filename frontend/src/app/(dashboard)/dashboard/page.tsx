"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { useRouter } from "next/navigation";
import { WelcomeBanner } from "@/components/ui/welcome-banner";
import { useAuth } from "@/components/providers/auth-provider";
import { useClinica } from "@/components/providers/clinica-provider";
import dashboardService, {
  DashboardStats,
  TurnoHoy,
  IngresoMensual,
  FacturacionDiaria,
  TurnoSemana,
  TratamientoMes,
} from "@/services/dashboard.service";
import { GripVertical, Lock, Unlock } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { StatusBadge } from "@/components/ui/status-badge";
import { MONTH_LABELS, CHART_TOOLTIP_STYLE, CHART_COLORS } from "@/lib/constants";

// Sección IDs
type SectionId = "estadoTurnos" | "turnosHoy" | "turnosSemana" | "tratamientos" | "ingresosMensuales" | "facturacionDiaria";

const DEFAULT_ORDER_ADMIN: SectionId[] = ["ingresosMensuales", "estadoTurnos", "facturacionDiaria", "turnosSemana", "tratamientos", "turnosHoy"];
const DEFAULT_ORDER_OTHER: SectionId[] = ["estadoTurnos", "turnosHoy", "turnosSemana", "tratamientos"];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { clinica } = useClinica();
  const isProfessional = user?.role === "professional";
  const isAssistant = user?.role === "assistant";
  const isAdmin = user?.role === "admin";
  const kpiVisibility = clinica?.kpi_visibility?.[user?.role || ""] ?? null;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [turnosHoy, setTurnosHoy] = useState<TurnoHoy[]>([]);
  const [ingresosMensuales, setIngresosMensuales] = useState<IngresoMensual[]>([]);
  const [facturacionDiaria, setFacturacionDiaria] = useState<FacturacionDiaria[]>([]);
  const [turnosSemana, setTurnosSemana] = useState<TurnoSemana[]>([]);
  const [tratamientos, setTratamientos] = useState<TratamientoMes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [sectionOrder, setSectionOrder] = useState<SectionId[]>([]);
  const [draggedSection, setDraggedSection] = useState<SectionId | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Mostrar onboarding si la clinica no lo completó
  useEffect(() => {
    if (clinica && isAdmin && clinica.onboarding_completado === false) {
      setShowOnboarding(true);
    }
  }, [clinica, isAdmin]);

  // Cargar orden de secciones
  useEffect(() => {
    const key = `dashboard-order-${user?.role || "admin"}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setSectionOrder(JSON.parse(saved));
      } catch {
        setSectionOrder(isAdmin ? DEFAULT_ORDER_ADMIN : DEFAULT_ORDER_OTHER);
      }
    } else {
      setSectionOrder(isAdmin ? DEFAULT_ORDER_ADMIN : DEFAULT_ORDER_OTHER);
    }
  }, [isAdmin, user?.role]);

  // Guardar orden
  useEffect(() => {
    if (sectionOrder.length > 0) {
      const key = `dashboard-order-${user?.role || "admin"}`;
      localStorage.setItem(key, JSON.stringify(sectionOrder));
    }
  }, [sectionOrder, user?.role]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsData, turnosData, ingresosData, facturacionData, turnosSemanaData, tratamientosData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getTurnosHoy(),
        dashboardService.getIngresosMensuales(),
        dashboardService.getFacturacionDiaria(),
        dashboardService.getTurnosSemana(),
        dashboardService.getTratamientosMes(),
      ]);
      setStats(statsData);
      setTurnosHoy(turnosData);
      setIngresosMensuales(ingresosData);
      setFacturacionDiaria(facturacionData);
      setTurnosSemana(turnosSemanaData);
      setTratamientos(tratamientosData);
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const misTurnosHoy = isProfessional && user?.id
    ? turnosHoy.filter((t) => t.user?.id === user.id)
    : turnosHoy;

  const estadoTurnosData = (() => {
    const counts: Record<string, number> = { completado: 0, confirmado: 0, pendiente: 0, cancelado: 0 };
    misTurnosHoy.forEach((t) => { if (counts[t.estado] !== undefined) counts[t.estado]++; });
    return [
      { nombre: "Completados", valor: counts.completado, color: CHART_COLORS.success },
      { nombre: "Confirmados", valor: counts.confirmado, color: CHART_COLORS.info },
      { nombre: "Pendientes", valor: counts.pendiente, color: CHART_COLORS.warning },
      { nombre: "Cancelados", valor: counts.cancelado, color: CHART_COLORS.error },
    ];
  })();

  const ingresosFormateados = ingresosMensuales.map((item) => ({
    mes: MONTH_LABELS[item.mes.split("-")[1]] || item.mes,
    ingresos: item.ingresos,
  }));

  const formatCurrency = (value: number) => `$${value.toLocaleString("es-AR")}`;

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  // Drag handlers
  const handleDragStart = (id: SectionId) => { if (editMode) setDraggedSection(id); };
  const handleDragOver = (e: React.DragEvent, targetId: SectionId) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;
    setSectionOrder((prev) => {
      const next = [...prev];
      const fromIdx = next.indexOf(draggedSection);
      const toIdx = next.indexOf(targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggedSection);
      return next;
    });
  };
  const handleDragEnd = () => setDraggedSection(null);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-8">
        <WelcomeBanner />
        <div>
          <div className="h-8 w-64 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl border bg-card animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-xl border bg-card animate-pulse" />
          <div className="h-80 rounded-xl border bg-card animate-pulse" />
        </div>
      </div>
    );
  }

  // KPI icons
  const calendarSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
    </svg>
  );
  const usersSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
  const dollarSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
  const checkSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
  const alertSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  );
  const checkCircleSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
  const clockConfirmSvg = (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );

  // Helper para verificar visibilidad de KPI
  const isKpiVisible = (kpiId: string): boolean => {
    if (isAdmin) return true; // Admin siempre ve todo
    if (!kpiVisibility) return true; // Sin config, usa defaults del rol
    return kpiVisibility[kpiId] !== false;
  };

  // Helper para verificar visibilidad de sección
  const isSectionVisible = (sectionId: string): boolean => {
    if (isAdmin) return true;
    if (!kpiVisibility) return true;
    return kpiVisibility[`section:${sectionId}`] !== false;
  };

  // Conteo de turnos por estado (para KPIs)
  const turnosCompletadosHoy = misTurnosHoy.filter((t) => t.estado === "completado").length;
  const turnosConfirmadosRestantes = misTurnosHoy.filter((t) => t.estado === "confirmado").length;

  // KPIs por rol
  const allKpiCards: { id: string; label: string; value: string | number; sub: string; gradient: string; bgGlow: string; icon: React.ReactNode; href: string }[] = [];

  if (isProfessional) {
    allKpiCards.push(
      { id: "turnosHoy", label: "Mis Turnos Hoy", value: misTurnosHoy.length, sub: "turnos programados", gradient: "from-[var(--ht-primary)] to-[var(--ht-primary-dark)]", bgGlow: "bg-blue-500/10", icon: calendarSvg, href: "/dashboard/turnos" },
      { id: "completadosHoy", label: "Completados", value: turnosCompletadosHoy, sub: "turnos finalizados hoy", gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", bgGlow: "bg-emerald-500/10", icon: checkCircleSvg, href: "/dashboard/turnos" },
      { id: "confirmadosRestantes", label: "Confirmados", value: turnosConfirmadosRestantes, sub: "restantes por atender", gradient: "from-[var(--ht-primary-light)] to-[var(--ht-primary)]", bgGlow: "bg-sky-500/10", icon: clockConfirmSvg, href: "/dashboard/turnos" },
      { id: "pacientes", label: "Pacientes", value: stats?.totalPacientes ?? 0, sub: "pacientes registrados", gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", bgGlow: "bg-[var(--ht-accent)]/10", icon: usersSvg, href: "/dashboard/pacientes" },
    );
  } else if (isAssistant) {
    allKpiCards.push(
      { id: "turnosHoy", label: "Turnos Hoy", value: stats?.turnosHoy ?? 0, sub: "turnos programados", gradient: "from-[var(--ht-primary)] to-[var(--ht-primary-dark)]", bgGlow: "bg-blue-500/10", icon: calendarSvg, href: "/dashboard/turnos" },
      { id: "completadosHoy", label: "Completados", value: turnosCompletadosHoy, sub: "turnos finalizados hoy", gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", bgGlow: "bg-emerald-500/10", icon: checkCircleSvg, href: "/dashboard/turnos" },
      { id: "confirmadosRestantes", label: "Confirmados", value: turnosConfirmadosRestantes, sub: "restantes por atender", gradient: "from-[var(--ht-primary-light)] to-[var(--ht-primary)]", bgGlow: "bg-sky-500/10", icon: clockConfirmSvg, href: "/dashboard/turnos" },
      { id: "pacientes", label: "Pacientes", value: stats?.totalPacientes ?? 0, sub: "pacientes registrados", gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", bgGlow: "bg-[var(--ht-accent)]/10", icon: usersSvg, href: "/dashboard/pacientes" },
      { id: "pagosAprobados", label: "Pagos Aprobados", value: stats?.pagosAprobadosMes ?? 0, sub: "aprobados este mes", gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", bgGlow: "bg-emerald-500/10", icon: checkSvg, href: "/dashboard/pagos" },
    );
  } else {
    allKpiCards.push(
      { id: "turnosHoy", label: "Turnos Hoy", value: stats?.turnosHoy ?? 0, sub: "turnos programados", gradient: "from-[var(--ht-primary)] to-[var(--ht-primary-dark)]", bgGlow: "bg-blue-500/10", icon: calendarSvg, href: "/dashboard/turnos" },
      { id: "completadosHoy", label: "Completados", value: turnosCompletadosHoy, sub: "turnos finalizados hoy", gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", bgGlow: "bg-emerald-500/10", icon: checkCircleSvg, href: "/dashboard/turnos" },
      { id: "confirmadosRestantes", label: "Confirmados", value: turnosConfirmadosRestantes, sub: "restantes por atender", gradient: "from-[var(--ht-primary-light)] to-[var(--ht-primary)]", bgGlow: "bg-sky-500/10", icon: clockConfirmSvg, href: "/dashboard/turnos" },
      { id: "pacientes", label: "Pacientes", value: stats?.totalPacientes ?? 0, sub: "pacientes registrados", gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", bgGlow: "bg-[var(--ht-accent)]/10", icon: usersSvg, href: "/dashboard/pacientes" },
      { id: "ingresosMes", label: "Ingresos del Mes", value: formatCurrency(stats?.ingresosMes ?? 0), sub: "pagos aprobados", gradient: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]", bgGlow: "bg-emerald-500/10", icon: dollarSvg, href: "/dashboard/pagos" },
      { id: "stockBajo", label: "Stock Bajo", value: stats?.lowStockCount ?? 0, sub: "items bajo mínimo", gradient: (stats?.lowStockCount ?? 0) > 0 ? "from-amber-500 to-orange-600" : "from-slate-400 to-slate-500", bgGlow: (stats?.lowStockCount ?? 0) > 0 ? "bg-amber-500/10" : "bg-slate-500/10", icon: alertSvg, href: "/dashboard/inventario" },
    );
  }

  const kpiCards = allKpiCards.filter((card) => isKpiVisible(card.id));

  // Secciones renderizables
  const sectionComponents: Record<SectionId, { title: string; render: () => React.ReactNode; visible: boolean }> = {
    estadoTurnos: {
      title: isProfessional ? "Mis Turnos — Estado" : "Estado de Turnos Hoy",
      visible: isSectionVisible("estadoTurnos"),
      render: () => (
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-6">
            <h2 className="text-base font-semibold">{isProfessional ? "Mis Turnos — Estado" : "Estado de Turnos Hoy"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Distribución de hoy</p>
          </div>
          {misTurnosHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
              <svg className="h-12 w-12 mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
              <p className="text-sm">Sin turnos para hoy</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={estadoTurnosData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="valor" nameKey="nombre" stroke="none">
                    {estadoTurnosData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {estadoTurnosData.map((item) => (
                  <div key={item.nombre} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.nombre}</span>
                    </div>
                    <span className="font-semibold">{item.valor}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ),
    },
    turnosHoy: {
      title: isProfessional ? "Mis Turnos de Hoy" : "Turnos de Hoy",
      visible: isSectionVisible("turnosHoy"),
      render: () => (
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">{isProfessional ? "Mis Turnos de Hoy" : "Turnos de Hoy"}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {misTurnosHoy.length > 0 ? `${misTurnosHoy.length} turno${misTurnosHoy.length !== 1 ? "s" : ""} programado${misTurnosHoy.length !== 1 ? "s" : ""}` : "Sin turnos para hoy"}
              </p>
            </div>
            <button onClick={() => router.push("/dashboard/turnos")} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">Ver todos →</button>
          </div>
          {misTurnosHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <svg className="h-12 w-12 mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
              <p className="text-sm">No hay turnos programados para hoy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {misTurnosHoy.slice(0, 8).map((turno) => (
                <div key={turno.id} className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent)] text-white text-sm font-semibold shadow-sm">
                      {turno.paciente?.nombre?.charAt(0) ?? "?"}{turno.paciente?.apellido?.charAt(0) ?? ""}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{turno.paciente ? `${turno.paciente.nombre} ${turno.paciente.apellido}` : "Paciente"}</p>
                      <p className="text-xs text-muted-foreground">{turno.user ? `Dr. ${turno.user.nombre} ${turno.user.apellido}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground tabular-nums">{formatTime(turno.start_time)}</span>
                    <StatusBadge status={turno.estado} size="sm" />
                  </div>
                </div>
              ))}
              {misTurnosHoy.length > 8 && (
                <button onClick={() => router.push("/dashboard/turnos")} className="w-full rounded-xl border border-dashed p-3 text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
                  +{misTurnosHoy.length - 8} turnos más →
                </button>
              )}
            </div>
          )}
        </div>
      ),
    },
    turnosSemana: {
      title: isProfessional ? "Mis Turnos de la Semana" : "Turnos de la Semana",
      visible: isSectionVisible("turnosSemana"),
      render: () => (
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-6">
            <h2 className="text-base font-semibold">{isProfessional ? "Mis Turnos de la Semana" : "Turnos de la Semana"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Programados vs completados</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={turnosSemana}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="turnos" stroke={CHART_COLORS.info} strokeWidth={2} dot={{ fill: CHART_COLORS.info, r: 4 }} name="Programados" />
              <Line type="monotone" dataKey="completados" stroke={CHART_COLORS.success} strokeWidth={2} dot={{ fill: CHART_COLORS.success, r: 4 }} name="Completados" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Programados</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Completados</div>
          </div>
        </div>
      ),
    },
    tratamientos: {
      title: "Tratamientos del Mes",
      visible: isSectionVisible("tratamientos"),
      render: () => (
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-6">
            <h2 className="text-base font-semibold">Tratamientos del Mes</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Más realizados según historial médico</p>
          </div>
          {tratamientos.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
              <svg className="h-12 w-12 mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
              <p className="text-sm">Sin tratamientos este mes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tratamientos.map((t, i) => {
                const max = Math.max(...tratamientos.map((x) => x.cantidad), 1);
                const pct = (t.cantidad / max) * 100;
                const colors = ["bg-[var(--ht-primary)]", "bg-[var(--ht-accent)]", "bg-[var(--ht-accent-warm)]", "bg-[var(--chart-4)]", "bg-[var(--ht-primary-dark)]"];
                return (
                  <div key={t.nombre}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium truncate mr-2">{t.nombre}</span>
                      <span className="text-muted-foreground tabular-nums">{t.cantidad}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    ingresosMensuales: {
      title: "Ingresos Mensuales",
      visible: isSectionVisible("ingresosMensuales"),
      render: () => (
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">Ingresos Mensuales</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Últimos 6 meses de facturación aprobada</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-accent)] to-[var(--ht-accent-dark)] text-white shadow-lg">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
            </div>
          </div>
          {ingresosFormateados.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[260px] text-muted-foreground">
              <svg className="h-12 w-12 mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18" /><path d="M7 16v-3" /><path d="M12 16V9" /><path d="M17 16v-5" /></svg>
              <p className="text-sm">Sin datos de ingresos aún</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ingresosFormateados} barSize={36}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString("es-AR")}`, "Ingresos"]} />
                <Bar dataKey="ingresos" fill={CHART_COLORS.success} radius={[8, 8, 0, 0]} name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      ),
    },
    facturacionDiaria: {
      title: "Facturación Diaria",
      visible: isSectionVisible("facturacionDiaria"),
      render: () => (
        <div className="rounded-xl border border-[var(--border-light)] bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold">Facturación Diaria</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Ingresos aprobados del mes en curso</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-primary-dark)] text-white shadow-lg">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
            </div>
          </div>
          {facturacionDiaria.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[240px] text-muted-foreground">
              <svg className="h-12 w-12 mb-3 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              <p className="text-sm">Sin facturación este mes</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={facturacionDiaria}>
                <defs>
                  <linearGradient id="gradientIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [`$${Number(value).toLocaleString("es-AR")}`, "Ingreso"]} />
                <Area type="monotone" dataKey="monto" stroke="#0EA5E9" fill="url(#gradientIngresos)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      ),
    },
  };

  const visibleSections = sectionOrder.filter((id) => sectionComponents[id]?.visible);

  return (
    <div className="space-y-8 animate-page-in">
      {showOnboarding && (
        <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
      )}
      <WelcomeBanner />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen general de tu clínica —{" "}
            {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${editMode ? "bg-primary/5 dark:bg-primary/10 border-primary dark:border-primary/50 text-primary dark:text-primary" : "bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
          title={editMode ? "Bloquear disposición" : "Personalizar disposición"}
        >
          {editMode ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
          {editMode ? "Guardar" : "Personalizar"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((card) => (
          <button
            key={card.label}
            onClick={() => router.push(card.href)}
            className="stagger-item group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-left animate-page-in"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-current opacity-[0.04] rounded-full group-hover:opacity-[0.08] transition-opacity" />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg`}>{card.icon}</div>
              </div>
              <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{card.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Secciones reordenables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {visibleSections.map((sectionId) => {
          const section = sectionComponents[sectionId];
          return (
            <div
              key={sectionId}
              draggable={editMode}
              onDragStart={() => handleDragStart(sectionId)}
              onDragOver={(e) => handleDragOver(e, sectionId)}
              onDragEnd={handleDragEnd}
              className={`relative transition-all ${editMode ? "cursor-grab active:cursor-grabbing" : ""} ${draggedSection === sectionId ? "opacity-50 scale-[0.98]" : ""} ${editMode ? "ring-2 ring-dashed ring-primary/30 dark:ring-primary/20 rounded-xl" : ""}`}
            >
              {editMode && (
                <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-white shadow-md">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
              )}
              {section.render()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
