"use client";

import React, { useCallback, useEffect, useState } from "react";
import reportsService, {
  TurnosReportData,
  PacientesReportData,
  InsightsData,
  InformeIaData,
  NpsReportData,
  ObraSocialReportData,
  ProductividadProfesional,
  FinancieroData,
} from "@/services/reports.service";
import { RoleGuard } from "@/components/guards/role-guard";
import { KpiCard } from "@/components/ui/kpi-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  BarChart2,
  UserCheck,
  Heart,
  Clock,
  Repeat2,
  Activity,
  Lightbulb,
  Star,
  Sparkles,
  RefreshCw,
  Copy,
  FileText,
  ThumbsUp,
  Building2,
  Banknote,
  DollarSign,
  LayoutDashboard,
} from "lucide-react";

type Rango = "este_mes" | "mes_anterior" | "3_meses" | "6_meses";
type TabKey = "resumen" | "turnos" | "pacientes" | "finanzas" | "equipo" | "nps";

const RANGO_LABELS: Record<Rango, string> = {
  este_mes:     "Este mes",
  mes_anterior: "Mes anterior",
  "3_meses":    "Últimos 3 meses",
  "6_meses":    "Últimos 6 meses",
};

function getRango(rango: Rango): { desde: string; hasta: string } {
  const hoy = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (rango === "este_mes") {
    return { desde: fmt(new Date(hoy.getFullYear(), hoy.getMonth(), 1)), hasta: fmt(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)) };
  }
  if (rango === "mes_anterior") {
    return { desde: fmt(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)), hasta: fmt(new Date(hoy.getFullYear(), hoy.getMonth(), 0)) };
  }
  if (rango === "3_meses") {
    return { desde: fmt(new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1)), hasta: fmt(hoy) };
  }
  return { desde: fmt(new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1)), hasta: fmt(hoy) };
}

function formatMes(mesStr: string): string {
  const [year, month] = mesStr.split("-");
  return new Date(parseInt(year), parseInt(month) - 1, 1)
    .toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
}

const CHART_TOOLTIP = { borderRadius: "8px", border: "1px solid var(--border)", fontSize: 12 };

export default function ReportesPage() {
  const [rango, setRango] = useState<Rango>("este_mes");
  const [activeTab, setActiveTab] = useState<TabKey>("resumen");
  const [turnosData, setTurnosData] = useState<TurnosReportData | null>(null);
  const [pacientesData, setPacientesData] = useState<PacientesReportData | null>(null);
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [npsData, setNpsData] = useState<NpsReportData | null>(null);
  const [osData, setOsData] = useState<ObraSocialReportData | null>(null);
  const [productividadData, setProductividadData] = useState<ProductividadProfesional[] | null>(null);
  const [financieroData, setFinancieroData] = useState<FinancieroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [informeIa, setInformeIa] = useState<InformeIaData | null>(null);
  const [generandoInforme, setGenerandoInforme] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { desde, hasta } = getRango(rango);
      const [turnos, pacientes, insights, nps, os, productividad, financiero] = await Promise.all([
        reportsService.getTurnos({ desde, hasta }),
        reportsService.getPacientes(),
        reportsService.getInsights({ desde, hasta }),
        reportsService.getNps({ desde, hasta }),
        reportsService.getObraSocial({ desde, hasta }),
        reportsService.getProductividad({ desde, hasta }).catch(() => [] as ProductividadProfesional[]),
        reportsService.getFinanciero().catch(() => null),
      ]);
      setTurnosData(turnos);
      setPacientesData(pacientes);
      setInsightsData(insights);
      setNpsData(nps);
      setOsData(os);
      setProductividadData(productividad);
      setFinancieroData(financiero);
    } catch {
      toast.error("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }, [rango]);

  useEffect(() => { load(); }, [load]);

  const handleGenerarInforme = async () => {
    setGenerandoInforme(true);
    try {
      const { desde, hasta } = getRango(rango);
      setInformeIa(await reportsService.generarInformeIa({ desde, hasta }));
    } catch {
      toast.error("Error al generar el informe IA");
    } finally {
      setGenerandoInforme(false);
    }
  };

  const handleDescargarPdf = async () => {
    if (!informeIa) return;
    setDescargandoPdf(true);
    try {
      await reportsService.downloadInformePdf(informeIa.texto, informeIa.rango);
      toast.success("PDF descargado");
    } catch {
      toast.error("Error al descargar el PDF");
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { desde, hasta } = getRango(rango);
      await reportsService.downloadXlsx({ desde, hasta });
      toast.success("Excel descargado");
    } catch {
      toast.error("Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  // ── derived values ──
  const completados = turnosData?.por_estado["completado"] || 0;
  const cancelados = turnosData?.por_estado["cancelado"] || 0;
  const total = turnosData?.total || 0;
  const tasaAsistencia = total > 0 ? Math.round((completados / total) * 100) : 0;

  const chartDataTurnos = (turnosData?.por_mes || []).map((m) => ({ mes: formatMes(m.mes), turnos: m.total }));
  const chartDataPacientes = (pacientesData?.nuevos_por_mes || []).map((m) => ({ mes: formatMes(m.mes), nuevos: m.total }));

  const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "resumen",   label: "Resumen",   icon: <LayoutDashboard className="h-3.5 w-3.5" /> },
    { key: "turnos",    label: "Turnos",    icon: <Calendar className="h-3.5 w-3.5" /> },
    { key: "pacientes", label: "Pacientes", icon: <Users className="h-3.5 w-3.5" /> },
    { key: "finanzas",  label: "Finanzas",  icon: <DollarSign className="h-3.5 w-3.5" /> },
    { key: "equipo",    label: "Equipo",    icon: <UserCheck className="h-3.5 w-3.5" /> },
    { key: "nps",       label: "NPS",       icon: <ThumbsUp className="h-3.5 w-3.5" /> },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="animate-page-in space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
            <p className="text-sm text-muted-foreground mt-1">Métricas y análisis de tu clínica</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={rango} onValueChange={(v) => setRango(v as Rango)}>
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue>{RANGO_LABELS[rango]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="este_mes">Este mes</SelectItem>
                <SelectItem value="mes_anterior">Mes anterior</SelectItem>
                <SelectItem value="3_meses">Últimos 3 meses</SelectItem>
                <SelectItem value="6_meses">Últimos 6 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={exporting || loading} variant="outline" className="rounded-xl gap-2">
              <Download className="h-4 w-4" />
              {exporting ? "Exportando..." : "Exportar Excel"}
            </Button>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-0.5 sm:gap-1 rounded-lg bg-muted p-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="rounded-xl border bg-card p-5 h-28 animate-pulse" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: RESUMEN
        ══════════════════════════════════════════════════ */}
        {!loading && activeTab === "resumen" && (
          <div className="space-y-6">

            {/* KPIs ejecutivos */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" />
                Indicadores clave del período
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <KpiCard
                  label="Facturado"
                  value={`$${(osData?.total_facturado || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
                  icon={<DollarSign className="h-5 w-5" />}
                  variant="accent"
                  sub={osData?.total_facturado ? `${osData.por_obra_social.length} coberturas` : "Sin cobros registrados"}
                  trend={financieroData && (financieroData.variacion_facturado_pct !== 0) ? {
                    value: `${Math.abs(financieroData.variacion_facturado_pct)}%`,
                    direction: financieroData.variacion_facturado_pct > 0 ? "up" : "down",
                    positive: financieroData.variacion_facturado_pct > 0,
                  } : undefined}
                />
                <KpiCard
                  label="Tasa de asistencia"
                  value={`${tasaAsistencia}%`}
                  icon={<CheckCircle className="h-5 w-5" />}
                  variant={tasaAsistencia >= 70 ? "accent" : tasaAsistencia >= 50 ? "warm" : "danger"}
                  sub={`${completados} completados de ${total}`}
                  progress={tasaAsistencia}
                />
                <KpiCard
                  label="Total turnos"
                  value={total}
                  icon={<Calendar className="h-5 w-5" />}
                  variant="primary"
                  sub={`${cancelados} cancelados (${turnosData?.cancelaciones_pct ?? 0}%)`}
                />
                <KpiCard
                  label="Pacientes en sistema"
                  value={pacientesData?.total || 0}
                  icon={<Users className="h-5 w-5" />}
                  variant="primary"
                  sub={`${pacientesData?.nuevos_este_mes || 0} nuevos este período`}
                />
                <KpiCard
                  label="NPS Score"
                  value={npsData?.nps_score !== null && npsData?.nps_score !== undefined ? npsData.nps_score : "—"}
                  icon={<ThumbsUp className="h-5 w-5" />}
                  variant={!npsData?.nps_score ? "primary" : npsData.nps_score >= 50 ? "accent" : npsData.nps_score >= 0 ? "warm" : "danger"}
                  sub={npsData?.total_respuestas ? `${npsData.total_respuestas} respuestas` : "Sin respuestas aún"}
                />
                <KpiCard
                  label="Retención"
                  value={`${insightsData?.tasa_retencion ?? 0}%`}
                  icon={<Repeat2 className="h-5 w-5" />}
                  variant={(insightsData?.tasa_retencion ?? 0) >= 40 ? "accent" : "warm"}
                  sub={`${insightsData?.pacientes_recurrentes ?? 0} pacientes recurrentes`}
                />
              </div>
            </div>

            {/* Callouts pico */}
            {insightsData && (insightsData.dia_pico || insightsData.hora_pico) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {insightsData.dia_pico && (
                  <div className="rounded-xl border border-[var(--ht-primary)]/20 bg-[var(--ht-primary)]/5 p-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ht-primary)]/15">
                      <Lightbulb className="h-4 w-4 text-[var(--ht-primary)]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--ht-primary)]">Día más activo</p>
                      <p className="text-sm font-bold mt-0.5">{insightsData.dia_pico}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Mayor demanda de turnos</p>
                    </div>
                  </div>
                )}
                {insightsData.hora_pico && (
                  <div className="rounded-xl border border-[var(--ht-accent)]/20 bg-[var(--ht-accent)]/5 p-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ht-accent)]/15">
                      <Clock className="h-4 w-4 text-[var(--ht-accent-dark)]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--ht-accent-dark)]">Hora pico</p>
                      <p className="text-sm font-bold mt-0.5">{insightsData.hora_pico}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Mayor concentración</p>
                    </div>
                  </div>
                )}
                {(insightsData.pacientes_recurrentes > 0) && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                      <Repeat2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-600">Fidelización</p>
                      <p className="text-sm font-bold mt-0.5">{insightsData.pacientes_recurrentes} pacientes</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Volvieron al menos una vez</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Informe IA */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Informe IA</span>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>
            <InformeIaPanel
              informeIa={informeIa}
              generandoInforme={generandoInforme}
              descargandoPdf={descargandoPdf}
              onGenerar={handleGenerarInforme}
              onDescargarPdf={handleDescargarPdf}
              onCopiar={() => { if (informeIa) { navigator.clipboard.writeText(informeIa.texto); toast.success("Informe copiado"); } }}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: TURNOS
        ══════════════════════════════════════════════════ */}
        {!loading && activeTab === "turnos" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total Turnos" value={total} icon={<Calendar className="h-5 w-5" />} variant="primary" />
              <KpiCard
                label="Completados"
                value={completados}
                icon={<CheckCircle className="h-5 w-5" />}
                variant="accent"
                sub={total > 0 ? `${Math.round((completados / total) * 100)}% del total` : undefined}
              />
              <KpiCard
                label="Cancelados"
                value={cancelados}
                icon={<XCircle className="h-5 w-5" />}
                variant="danger"
                sub={total > 0 ? `${turnosData?.cancelaciones_pct}% del total` : undefined}
              />
              <KpiCard label="Tasa de Asistencia" value={`${tasaAsistencia}%`} icon={<TrendingUp className="h-5 w-5" />} variant="warm" progress={tasaAsistencia} />
            </div>

            {chartDataTurnos.length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Turnos por mes</h3>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartDataTurnos} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [v ?? 0, "Turnos"]} />
                    <Bar dataKey="turnos" fill="var(--ht-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {(turnosData?.por_profesional || []).length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Turnos por profesional</h3>
                </div>
                <div className="space-y-3">
                  {(turnosData?.por_profesional || []).sort((a, b) => b.total - a.total).map((p) => {
                    const pct = total > 0 ? Math.round((p.total / total) * 100) : 0;
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-36 shrink-0 text-sm font-medium truncate">{p.nombre} {p.apellido}</div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-16 text-right text-sm tabular-nums text-muted-foreground">{p.total} ({pct}%)</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Distribución día/hora */}
            {insightsData && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {insightsData.distribucion_por_dia.some(d => d.total > 0) && (
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart2 className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Por día de la semana</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={insightsData.distribucion_por_dia} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(0, 3)} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [v ?? 0, "Turnos"]} />
                        <Bar dataKey="total" fill="var(--ht-primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {insightsData.distribucion_por_hora.some(h => h.total > 0) && (
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Por franja horaria (8:00–17:00)</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={insightsData.distribucion_por_hora} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradHora" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--ht-accent)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--ht-accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [v ?? 0, "Turnos"]} />
                        <Area type="monotone" dataKey="total" stroke="var(--ht-accent-dark)" fill="url(#gradHora)" strokeWidth={2} dot={{ r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: PACIENTES
        ══════════════════════════════════════════════════ */}
        {!loading && activeTab === "pacientes" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Total Pacientes" value={pacientesData?.total || 0} icon={<Users className="h-5 w-5" />} variant="primary" />
              <KpiCard label="Nuevos este período" value={pacientesData?.nuevos_este_mes || 0} icon={<UserCheck className="h-5 w-5" />} variant="accent" />
              <KpiCard label="Pacientes únicos" value={insightsData?.pacientes_unicos || 0} icon={<Activity className="h-5 w-5" />} variant="primary" sub="Con turno en el período" />
              <KpiCard label="Recurrentes" value={insightsData?.pacientes_recurrentes || 0} icon={<Repeat2 className="h-5 w-5" />} variant="accent" sub={`${insightsData?.tasa_retencion ?? 0}% retención`} />
            </div>

            {chartDataPacientes.length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Nuevos pacientes por mes</h3>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartDataPacientes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [v ?? 0, "Nuevos pacientes"]} />
                    <Bar dataKey="nuevos" fill="var(--ht-accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {(pacientesData?.por_obra_social || []).length > 0 && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Pacientes por cobertura médica</h3>
                </div>
                <div className="space-y-3">
                  {(pacientesData?.por_obra_social || []).slice(0, 8).map((os) => {
                    const pct = Math.round((os.total / (pacientesData?.total || 1)) * 100);
                    return (
                      <div key={os.obra_social} className="flex items-center gap-3">
                        <div className="w-40 shrink-0 text-sm font-medium truncate">{os.obra_social}</div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[var(--ht-accent)] to-[var(--ht-accent-dark)] rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="w-20 text-right text-sm tabular-nums text-muted-foreground">{os.total} ({pct}%)</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: FINANZAS
        ══════════════════════════════════════════════════ */}
        {!loading && activeTab === "finanzas" && (
          <div className="space-y-6">

            {/* Mes vs mes */}
            {financieroData && (
              <>
                <div>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Comparativa mensual
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard
                      label="Facturado este mes"
                      value={`$${financieroData.mes_actual.facturado.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
                      icon={<DollarSign className="h-5 w-5" />}
                      variant="accent"
                      sub={`${financieroData.mes_actual.pagos} cobros`}
                      trend={financieroData.variacion_facturado_pct !== 0 ? {
                        value: `${Math.abs(financieroData.variacion_facturado_pct)}%`,
                        direction: financieroData.variacion_facturado_pct > 0 ? "up" : "down",
                        positive: financieroData.variacion_facturado_pct > 0,
                      } : undefined}
                    />
                    <KpiCard
                      label="Mes anterior"
                      value={`$${financieroData.mes_anterior.facturado.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
                      icon={<Banknote className="h-5 w-5" />}
                      variant="primary"
                      sub={`${financieroData.mes_anterior.pagos} cobros`}
                    />
                    <KpiCard
                      label="Turnos completados"
                      value={financieroData.mes_actual.turnos_completados}
                      icon={<CheckCircle className="h-5 w-5" />}
                      variant="accent"
                      sub={`anterior: ${financieroData.mes_anterior.turnos_completados}`}
                      trend={financieroData.variacion_turnos_pct !== 0 ? {
                        value: `${Math.abs(financieroData.variacion_turnos_pct)}%`,
                        direction: financieroData.variacion_turnos_pct > 0 ? "up" : "down",
                        positive: financieroData.variacion_turnos_pct > 0,
                      } : undefined}
                    />
                    <KpiCard label="Cobros este mes" value={financieroData.mes_actual.pagos} icon={<TrendingUp className="h-5 w-5" />} variant="primary" sub="Pagos aprobados" />
                  </div>
                </div>

                {financieroData.ultimos_6_meses.length > 1 && (
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Facturación últimos 6 meses</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={financieroData.ultimos_6_meses.map((m) => ({ mes: formatMes(m.mes), facturado: m.facturado }))} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradFinanciero" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--ht-accent)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--ht-accent)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={CHART_TOOLTIP} formatter={(v) => [`$${Number(v).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`, "Facturado"]} />
                        <Area type="monotone" dataKey="facturado" stroke="var(--ht-accent-dark)" fill="url(#gradFinanciero)" strokeWidth={2} dot={{ r: 3 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}

            {/* Obras sociales */}
            {osData && osData.por_obra_social.length > 0 && (
              <>
                <div>
                  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    Por cobertura
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <KpiCard label="Total Facturado" value={`$${osData.total_facturado.toLocaleString("es-AR", { minimumFractionDigits: 0 })}`} icon={<Banknote className="h-5 w-5" />} variant="accent" />
                    <KpiCard label="Total Turnos OS" value={osData.total_turnos} icon={<Building2 className="h-5 w-5" />} variant="primary" sub={`${osData.por_obra_social.length} coberturas`} />
                    <KpiCard label="Facturado OS" value={`$${osData.por_obra_social.filter(o => o.obra_social !== "Particular").reduce((s, o) => s + o.facturado, 0).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`} icon={<Heart className="h-5 w-5" />} variant="warm" sub="Con cobertura" />
                    <KpiCard label="Facturado Particular" value={`$${(osData.por_obra_social.find(o => o.obra_social === "Particular")?.facturado || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`} icon={<Users className="h-5 w-5" />} variant="primary" sub="Sin cobertura" />
                  </div>
                </div>

                {osData.total_facturado > 0 && (
                  <div className="rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Banknote className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Facturación por cobertura</h3>
                    </div>
                    <div className="space-y-3">
                      {osData.por_obra_social.filter(os => os.facturado > 0).slice(0, 10).map((os) => {
                        const pct = osData.total_facturado > 0 ? Math.round((os.facturado / osData.total_facturado) * 100) : 0;
                        return (
                          <div key={os.obra_social} className="flex items-center gap-3">
                            <div className="w-36 shrink-0 text-sm font-medium truncate">{os.obra_social}</div>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="w-36 text-right text-xs tabular-nums text-muted-foreground">${os.facturado.toLocaleString("es-AR", { minimumFractionDigits: 0 })} ({pct}%)</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3 border-b">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Detalle por cobertura</h3>
                  </div>
                  <div className="divide-y">
                    {osData.por_obra_social.map((os) => (
                      <div key={os.obra_social} className="grid grid-cols-4 gap-2 px-5 py-3 text-sm hover:bg-muted/30">
                        <div className="font-medium truncate col-span-1">{os.obra_social}</div>
                        <div className="text-center tabular-nums text-muted-foreground"><span className="font-medium text-foreground">{os.turnos}</span> turnos</div>
                        <div className="text-center tabular-nums text-muted-foreground"><span className="font-medium text-foreground">{os.pacientes}</span> pac.</div>
                        <div className="text-right tabular-nums">
                          {os.facturado > 0
                            ? <span className="font-medium text-emerald-600">${os.facturado.toLocaleString("es-AR", { minimumFractionDigits: 0 })}</span>
                            : <span className="text-muted-foreground">—</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: EQUIPO
        ══════════════════════════════════════════════════ */}
        {!loading && activeTab === "equipo" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Profesionales activos" value={(productividadData || []).length} icon={<UserCheck className="h-5 w-5" />} variant="primary" sub="Con turnos en el período" />
              <KpiCard
                label="Mejor asistencia"
                value={productividadData && productividadData.length > 0 ? `${Math.max(...productividadData.map(p => p.tasa_asistencia))}%` : "—"}
                icon={<Star className="h-5 w-5" />}
                variant="accent"
                sub="Tasa más alta del equipo"
              />
              <KpiCard
                label="Total completados"
                value={(productividadData || []).reduce((s, p) => s + p.completados, 0)}
                icon={<CheckCircle className="h-5 w-5" />}
                variant="accent"
              />
              <KpiCard
                label="Total facturado equipo"
                value={`$${(productividadData || []).reduce((s, p) => s + p.facturado, 0).toLocaleString("es-AR", { minimumFractionDigits: 0 })}`}
                icon={<DollarSign className="h-5 w-5" />}
                variant="primary"
              />
            </div>

            {productividadData && productividadData.length > 0 ? (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Desempeño individual — período seleccionado</h3>
                </div>
                <div className="grid grid-cols-7 gap-2 px-5 py-2 border-b bg-muted/30 text-xs text-muted-foreground uppercase tracking-wide">
                  <div className="col-span-2">Profesional</div>
                  <div className="hidden sm:block">Especialidad</div>
                  <div className="text-center">Total</div>
                  <div className="text-center">Complet.</div>
                  <div className="text-center">Asistencia</div>
                  <div className="text-right">Facturado</div>
                </div>
                <div className="divide-y">
                  {productividadData.map((p) => {
                    const tasaColor = p.tasa_asistencia >= 80 ? "text-emerald-600 bg-emerald-500/10" : p.tasa_asistencia >= 50 ? "text-amber-600 bg-amber-500/10" : "text-red-500 bg-red-500/10";
                    return (
                      <div key={p.id} className="grid grid-cols-7 gap-2 px-5 py-3 text-sm hover:bg-muted/30">
                        <div className="col-span-2 font-medium truncate">{p.nombre} {p.apellido}</div>
                        <div className="hidden sm:block text-muted-foreground truncate">{p.especialidad || <span className="opacity-40">—</span>}</div>
                        <div className="text-center tabular-nums font-semibold">{p.total}</div>
                        <div className="text-center tabular-nums text-emerald-600">{p.completados}</div>
                        <div className="text-center">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tasaColor}`}>{p.tasa_asistencia}%</span>
                        </div>
                        <div className="text-right tabular-nums">
                          {p.facturado > 0
                            ? <span className="font-medium text-emerald-600">${p.facturado.toLocaleString("es-AR", { minimumFractionDigits: 0 })}</span>
                            : <span className="text-muted-foreground">—</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-10 text-center text-muted-foreground text-sm">
                <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No hay datos de productividad para este período.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB: NPS
        ══════════════════════════════════════════════════ */}
        {!loading && activeTab === "nps" && npsData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="NPS Score"
                value={npsData.nps_score !== null ? npsData.nps_score : "—"}
                icon={<ThumbsUp className="h-5 w-5" />}
                variant={npsData.nps_score === null ? "primary" : npsData.nps_score >= 50 ? "accent" : npsData.nps_score >= 0 ? "warm" : "danger"}
                sub={npsData.total_respuestas > 0 ? `${npsData.total_respuestas} respuestas` : "Sin respuestas"}
              />
              <KpiCard label="Promedio" value={npsData.promedio !== null ? `${npsData.promedio}/10` : "—"} icon={<Star className="h-5 w-5" />} variant="primary" />
              <KpiCard
                label="Promotores (9-10)"
                value={npsData.promotores}
                icon={<CheckCircle className="h-5 w-5" />}
                variant="accent"
                sub={npsData.total_respuestas > 0 ? `${Math.round((npsData.promotores / npsData.total_respuestas) * 100)}%` : undefined}
              />
              <KpiCard
                label="Detractores (1-6)"
                value={npsData.detractores}
                icon={<XCircle className="h-5 w-5" />}
                variant="danger"
                sub={npsData.total_respuestas > 0 ? `${Math.round((npsData.detractores / npsData.total_respuestas) * 100)}%` : undefined}
              />
            </div>

            {npsData.respuestas.length > 0 ? (
              <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b">
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Últimas respuestas</h3>
                </div>
                <div className="divide-y">
                  {npsData.respuestas.slice(0, 20).map((r) => {
                    const color = r.score >= 9 ? "text-emerald-600 bg-emerald-50" : r.score >= 7 ? "text-amber-600 bg-amber-50" : "text-red-600 bg-red-50";
                    return (
                      <div key={r.turno_id} className="flex items-center gap-4 px-5 py-3 text-sm hover:bg-muted/30">
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-base ${color}`}>{r.score}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{r.paciente}</p>
                          <p className="text-xs text-muted-foreground">{r.profesional}</p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {new Date(r.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground text-sm">
                <ThumbsUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>Aún no hay respuestas NPS en este período.</p>
                <p className="text-xs mt-1">Las encuestas se envían automáticamente 2 horas después de cada turno completado.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </RoleGuard>
  );
}

// ── Panel Informe IA ───────────────────────────────────────────────────────────
function InformeIaPanel({
  informeIa, generandoInforme, descargandoPdf, onGenerar, onDescargarPdf, onCopiar,
}: {
  informeIa: InformeIaData | null;
  generandoInforme: boolean;
  descargandoPdf: boolean;
  onGenerar: () => void;
  onDescargarPdf: () => void;
  onCopiar: () => void;
}) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {(!informeIa || generandoInforme) && (
        <div className="flex items-start justify-between gap-4 p-5 border-b bg-gradient-to-r from-violet-500/5 to-transparent">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Informe ejecutivo generado por IA</h3>
              <p className="text-xs text-muted-foreground mt-0.5">GPT-4o analiza los datos del período y genera KPIs, gráficos y recomendaciones.</p>
            </div>
          </div>
          <Button onClick={onGenerar} disabled={generandoInforme} className="shrink-0 rounded-xl gap-2 bg-violet-600 hover:bg-violet-700 text-white" size="sm">
            {generandoInforme ? <><RefreshCw className="h-4 w-4 animate-spin" />Generando...</> : <><Sparkles className="h-4 w-4" />Generar informe</>}
          </Button>
        </div>
      )}

      {generandoInforme && (
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin text-violet-500" />
            <span>Analizando datos y redactando informe... (puede tardar 15-20 segundos)</span>
          </div>
          <div className="grid grid-cols-3 gap-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        </div>
      )}

      {!generandoInforme && informeIa && (
        <InformeIaDisplay informeIa={informeIa} onDescargarPdf={onDescargarPdf} onCopiar={onCopiar} onRegenerar={onGenerar} descargandoPdf={descargandoPdf} />
      )}

      {!generandoInforme && !informeIa && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
          <Sparkles className="h-8 w-8 opacity-30" />
          <p className="text-sm">Hacé clic en "Generar informe" para obtener un análisis ejecutivo con KPIs y recomendaciones.</p>
        </div>
      )}
    </div>
  );
}

// ── Parseo Markdown ────────────────────────────────────────────────────────────
type MdSection = { title: string; bullets: string[]; paragraphs: string[] };

function parseMdSections(texto: string): MdSection[] {
  const sections: MdSection[] = [];
  let cur: MdSection | null = null;
  for (const line of texto.split("\n")) {
    const h2 = line.match(/^##\s+(.+)/);
    if (h2) {
      if (cur) sections.push(cur);
      cur = { title: h2[1].trim(), bullets: [], paragraphs: [] };
    } else if (cur) {
      const bullet = line.match(/^[-*]\s+(.+)/);
      if (bullet) cur.bullets.push(bullet[1].replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").trim());
      else if (line.trim()) cur.paragraphs.push(line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").trim());
    }
  }
  if (cur) sections.push(cur);
  return sections;
}

// ── KPI card del informe IA ────────────────────────────────────────────────────
type KpiType = "info" | "success" | "danger" | "warning" | "neutral";
const KPI_STYLES: Record<KpiType, { border: string; bg: string; valueColor: string }> = {
  info:    { border: "border-t-[#0EA5E9]", bg: "bg-[#EFF6FF]",  valueColor: "text-[#0F172A]" },
  success: { border: "border-t-[#10B981]", bg: "bg-[#ECFDF5]",  valueColor: "text-[#059669]" },
  danger:  { border: "border-t-[#EF4444]", bg: "bg-[#FEF2F2]",  valueColor: "text-[#EF4444]" },
  warning: { border: "border-t-[#F59E0B]", bg: "bg-[#FFFBEB]",  valueColor: "text-[#D97706]" },
  neutral: { border: "border-t-[#CBD5E1]", bg: "bg-[#F8FAFC]",  valueColor: "text-[#0F172A]" },
};
function KpiCardItem({ label, value, sub, type }: { label: string; value: string | number; sub: string; type: KpiType }) {
  const s = KPI_STYLES[type];
  return (
    <div className={`rounded-xl border border-[#E2E8F0] border-t-[3px] p-4 shadow-sm ${s.border} ${s.bg}`}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-[#64748B] mb-2">{label}</p>
      <p className={`text-3xl font-bold leading-none mb-1 ${s.valueColor}`}>{value}</p>
      <p className="text-xs text-[#64748B]">{sub}</p>
    </div>
  );
}

// ── Sección del informe IA ─────────────────────────────────────────────────────
function InformeSection({ title, accentColor, icon, rows, insight, alert }: {
  title: string; accentColor: string; icon: React.ReactNode;
  rows: { key: string; val: string }[]; insight?: string; alert?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm" style={{ background: accentColor + "20", color: accentColor }}>{icon}</div>
        <h3 className="text-[15px] font-semibold text-[#0F172A] flex items-center gap-2">
          {title}
          {alert && <span className="inline-flex items-center rounded-full border border-[#FCA5A5] bg-[#FEF2F2] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#EF4444]">{alert}</span>}
        </h3>
        <div className="h-px flex-1 bg-[#E2E8F0]" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[#E2E8F0] shadow-sm">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-2.5 text-sm last:border-b-0 hover:bg-[#F8FAFC]">
            <span className="text-[#334155]">{r.key}</span>
            <span className="font-medium text-[#0F172A]">{r.val}</span>
          </div>
        ))}
      </div>
      {insight && (
        <div className="rounded-lg border border-[#E2E8F0] border-l-[3px] border-l-[#38BDF8] bg-[#F8FAFC] px-4 py-2.5 text-xs leading-relaxed text-[#64748B]">{insight}</div>
      )}
    </div>
  );
}

// ── Componente principal del informe IA ───────────────────────────────────────
function InformeIaDisplay({ informeIa, onDescargarPdf, onCopiar, onRegenerar, descargandoPdf }: {
  informeIa: InformeIaData; onDescargarPdf: () => void; onCopiar: () => void; onRegenerar: () => void; descargandoPdf: boolean;
}) {
  const { kpis, texto, rango, clinicaNombre } = informeIa;
  const sections = parseMdSections(texto);
  const fmtDate = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" }); };
  const periodo = rango ? `${fmtDate(rango.desde)} – ${fmtDate(rango.hasta)}` : "";
  const findSec = (kw: string) => sections.find(s => s.title.toLowerCase().includes(kw));
  const tasaAsist = kpis.tasaAsistencia;
  const tasaRet = kpis.tasaRetencion;
  const kpiCards: { label: string; value: string | number; sub: string; type: KpiType }[] = [
    { label: "Total turnos",    value: kpis.totalTurnos,     sub: "Programados",   type: "info" },
    { label: "Tasa asistencia", value: `${tasaAsist}%`,      sub: `${kpis.completados} completados`, type: tasaAsist === 0 ? "danger" : tasaAsist >= 50 ? "success" : "warning" },
    { label: "Pacientes",       value: kpis.totalPacientes,  sub: `${kpis.nuevosPacientes} nuevo${kpis.nuevosPacientes !== 1 ? "s" : ""} este período`, type: "neutral" },
    { label: "Facturado",       value: `$${kpis.totalFacturado.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`, sub: kpis.totalFacturado === 0 ? "Sin ingresos" : `OS: $${kpis.totalOS.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`, type: kpis.totalFacturado === 0 ? "danger" : "success" },
    { label: "Profesionales",   value: kpis.profesionales,   sub: kpis.topProfesional ?? "Sin datos", type: "info" },
    { label: "Retención",       value: `${tasaRet}%`,        sub: "Pacientes recurrentes", type: tasaRet === 0 ? "danger" : tasaRet < 30 ? "warning" : "success" },
  ];
  const resumenSec = findSec("resumen");
  const turnosSec = findSec("turno");
  const pacientesSec = findSec("paciente");
  const factSec = findSec("factura");
  const recsSec = findSec("recomendac") ?? findSec("observac");
  const summaryText = resumenSec ? [...resumenSec.paragraphs, ...resumenSec.bullets].join(" ") : "";
  const cancelados = kpis.cancelados;
  const pendientes = kpis.totalTurnos - kpis.completados - cancelados;

  return (
    <div className="overflow-hidden rounded-b-xl">
      <div className="relative overflow-hidden px-8 py-6" style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%)" }}>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-10" style={{ background: "white" }} />
        <p className="text-[11px] font-medium uppercase tracking-widest text-white/60 mb-1.5">Informe de Gestión Clínica</p>
        <h2 className="text-2xl font-bold text-white mb-1 leading-tight">{clinicaNombre || "Clínica"}</h2>
        {periodo && <p className="text-sm text-white/70 font-light">{periodo}</p>}
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] text-white/85">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
          Generado por Avax Health · {new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
        </div>
      </div>
      <div className="space-y-6 p-6">
        <p className="text-[10px] font-medium uppercase tracking-wider text-[#64748B]">Indicadores del período</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{kpiCards.map((k) => <KpiCardItem key={k.label} {...k} />)}</div>
        {summaryText && (
          <div className="relative overflow-hidden rounded-xl border border-[#BAE6FD] p-5" style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #ECFDF5 100%)" }}>
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-[#0EA5E9]" />
            <p className="pl-2 text-sm leading-relaxed text-[#334155]">{summaryText}</p>
          </div>
        )}
        <InformeSection title="Turnos" accentColor="#0EA5E9" icon={<Calendar className="h-4 w-4" />}
          rows={[
            { key: "Total programados", val: String(kpis.totalTurnos) },
            { key: "Completados",       val: String(kpis.completados) },
            { key: "Cancelados",        val: `${cancelados} (${kpis.cancelacionesPct}%)` },
            { key: "Pendientes",        val: String(Math.max(0, pendientes)) },
            ...(kpis.topProfesional ? [{ key: "Profesional más activo", val: kpis.topProfesional }] : []),
          ]}
          insight={turnosSec?.paragraphs[0] ?? turnosSec?.bullets[0]}
        />
        <InformeSection title="Pacientes" accentColor="#10B981" icon={<Users className="h-4 w-4" />}
          rows={[
            { key: "Total en sistema",    val: String(kpis.totalPacientes) },
            { key: "Nuevos este período", val: String(kpis.nuevosPacientes) },
            { key: "Retención",           val: `${kpis.tasaRetencion}%` },
          ]}
          insight={pacientesSec?.paragraphs[0] ?? pacientesSec?.bullets[0]}
        />
        <InformeSection title="Facturación" accentColor="#EF4444" icon={<TrendingUp className="h-4 w-4" />}
          rows={[
            { key: "Total cobrado",   val: `$${kpis.totalFacturado.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { key: "Por obra social", val: `$${kpis.totalOS.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
            { key: "Particular",      val: `$${kpis.totalParticular.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
          ]}
          insight={factSec?.paragraphs[0] ?? factSec?.bullets[0]}
          alert={kpis.totalFacturado === 0 ? "ATENCIÓN" : undefined}
        />
        {recsSec && recsSec.bullets.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: "#F59E0B20", color: "#F59E0B" }}><Star className="h-4 w-4" /></div>
              <h3 className="text-[15px] font-semibold text-[#0F172A]">Recomendaciones</h3>
              <div className="h-px flex-1 bg-[#E2E8F0]" />
            </div>
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] shadow-sm">
              {recsSec.bullets.map((rec, i) => (
                <div key={i} className="flex gap-3.5 border-b border-[#E2E8F0] px-5 py-3 text-sm text-[#334155] last:border-b-0 hover:bg-[#F8FAFC]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#BAE6FD] bg-[#EFF6FF] text-[10px] font-bold text-[#0369A1] mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                  <span className="leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-4">
          <span className="text-sm font-semibold text-[#0EA5E9]">Avax Health</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-xl gap-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50" onClick={onRegenerar}><RefreshCw className="h-3.5 w-3.5" />Regenerar</Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={onCopiar}><Copy className="h-3.5 w-3.5" />Copiar</Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={onDescargarPdf} disabled={descargandoPdf}><FileText className="h-3.5 w-3.5" />{descargandoPdf ? "Descargando..." : "Descargar PDF"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
