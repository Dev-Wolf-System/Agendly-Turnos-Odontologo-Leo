"use client";

import { useCallback, useEffect, useState } from "react";
import reportsService, {
  TurnosReportData,
  PacientesReportData,
  InsightsData,
  InformeIaData,
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
  LineChart,
  Line,
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";

type Rango = "este_mes" | "mes_anterior" | "3_meses" | "6_meses";

function getRango(rango: Rango): { desde: string; hasta: string } {
  const hoy = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (rango === "este_mes") {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    return { desde: fmt(desde), hasta: fmt(hasta) };
  }
  if (rango === "mes_anterior") {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
    return { desde: fmt(desde), hasta: fmt(hasta) };
  }
  if (rango === "3_meses") {
    const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 2, 1);
    return { desde: fmt(desde), hasta: fmt(hoy) };
  }
  // 6_meses
  const desde = new Date(hoy.getFullYear(), hoy.getMonth() - 5, 1);
  return { desde: fmt(desde), hasta: fmt(hoy) };
}

function formatMes(mesStr: string): string {
  const [year, month] = mesStr.split("-");
  const d = new Date(parseInt(year), parseInt(month) - 1, 1);
  return d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
}

export default function ReportesPage() {
  const [rango, setRango] = useState<Rango>("este_mes");
  const [turnosData, setTurnosData] = useState<TurnosReportData | null>(null);
  const [pacientesData, setPacientesData] = useState<PacientesReportData | null>(null);
  const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [informeIa, setInformeIa] = useState<InformeIaData | null>(null);
  const [generandoInforme, setGenerandoInforme] = useState(false);
  const [descargandoPdf, setDescargandoPdf] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { desde, hasta } = getRango(rango);
      const [turnos, pacientes, insights] = await Promise.all([
        reportsService.getTurnos({ desde, hasta }),
        reportsService.getPacientes(),
        reportsService.getInsights({ desde, hasta }),
      ]);
      setTurnosData(turnos);
      setPacientesData(pacientes);
      setInsightsData(insights);
    } catch {
      toast.error("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }, [rango]);

  useEffect(() => {
    load();
  }, [load]);

  const handleGenerarInforme = async () => {
    setGenerandoInforme(true);
    try {
      const { desde, hasta } = getRango(rango);
      const data = await reportsService.generarInformeIa({ desde, hasta });
      setInformeIa(data);
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

  const handleCopiarInforme = () => {
    if (!informeIa) return;
    navigator.clipboard.writeText(informeIa.texto);
    toast.success("Informe copiado al portapapeles");
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

  const completados = turnosData?.por_estado["completado"] || 0;
  const cancelados = turnosData?.por_estado["cancelado"] || 0;
  const total = turnosData?.total || 0;
  const tasaAsistencia = total > 0 ? Math.round((completados / total) * 100) : 0;

  const chartDataTurnos = (turnosData?.por_mes || []).map((m) => ({
    mes: formatMes(m.mes),
    turnos: m.total,
  }));

  const chartDataPacientes = (pacientesData?.nuevos_por_mes || []).map((m) => ({
    mes: formatMes(m.mes),
    nuevos: m.total,
  }));

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="animate-page-in space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Métricas y análisis de tu clínica
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={rango}
              onValueChange={(v) => setRango(v as Rango)}
            >
              <SelectTrigger className="w-[180px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="este_mes">Este mes</SelectItem>
                <SelectItem value="mes_anterior">Mes anterior</SelectItem>
                <SelectItem value="3_meses">Últimos 3 meses</SelectItem>
                <SelectItem value="6_meses">Últimos 6 meses</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleExport}
              disabled={exporting || loading}
              variant="outline"
              className="rounded-xl gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exportando..." : "Exportar Excel"}
            </Button>
          </div>
        </div>

        {/* KPIs Turnos */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Turnos
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-5 h-28 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Turnos"
                value={total}
                icon={<Calendar className="h-5 w-5" />}
                variant="primary"
              />
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
              <KpiCard
                label="Tasa de Asistencia"
                value={`${tasaAsistencia}%`}
                icon={<TrendingUp className="h-5 w-5" />}
                variant="warm"
                progress={tasaAsistencia}
              />
            </div>
          )}
        </div>

        {/* Gráfico Turnos por Mes */}
        {!loading && chartDataTurnos.length > 0 && (
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
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: 12 }}
                  formatter={(v) => [v ?? 0, "Turnos"]}
                />
                <Bar dataKey="turnos" fill="var(--ht-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Por profesional */}
        {!loading && (turnosData?.por_profesional || []).length > 0 && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Turnos por profesional</h3>
            </div>
            <div className="space-y-3">
              {(turnosData?.por_profesional || [])
                .sort((a, b) => b.total - a.total)
                .map((p) => {
                  const pct = total > 0 ? Math.round((p.total / total) * 100) : 0;
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-36 shrink-0 text-sm font-medium truncate">
                        {p.nombre} {p.apellido}
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] rounded-full transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-16 text-right text-sm tabular-nums text-muted-foreground">
                        {p.total} ({pct}%)
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* KPIs Pacientes */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pacientes
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-5 h-28 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Total Pacientes"
                value={pacientesData?.total || 0}
                icon={<Users className="h-5 w-5" />}
                variant="primary"
              />
              <KpiCard
                label="Nuevos este mes"
                value={pacientesData?.nuevos_este_mes || 0}
                icon={<UserCheck className="h-5 w-5" />}
                variant="accent"
              />
            </div>
          )}
        </div>

        {/* Gráfico Nuevos Pacientes */}
        {!loading && chartDataPacientes.length > 0 && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Nuevos pacientes por mes</h3>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartDataPacientes} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: 12 }}
                  formatter={(v) => [v ?? 0, "Nuevos pacientes"]}
                />
                <Bar dataKey="nuevos" fill="var(--ht-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Por obra social */}
        {!loading && (pacientesData?.por_obra_social || []).length > 0 && (
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Pacientes por obra social</h3>
            </div>
            <div className="space-y-3">
              {(pacientesData?.por_obra_social || [])
                .slice(0, 8)
                .map((os) => {
                  const totalPac = pacientesData?.total || 1;
                  const pct = Math.round((os.total / totalPac) * 100);
                  return (
                    <div key={os.obra_social} className="flex items-center gap-3">
                      <div className="w-40 shrink-0 text-sm font-medium truncate">
                        {os.obra_social}
                      </div>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[var(--ht-accent)] to-[var(--ht-accent-dark)] rounded-full transition-[width] duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-20 text-right text-sm tabular-nums text-muted-foreground">
                        {os.total} ({pct}%)
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}

        {/* ── SECCIÓN INFORME IA ── */}
        {!loading && (
          <>
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Informe IA</span>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {/* Header de la card */}
              <div className="flex items-start justify-between gap-4 p-5 border-b">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                    <Sparkles className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Informe narrativo generado por IA</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      GPT-4o analiza los datos del período y genera un resumen ejecutivo con observaciones y recomendaciones.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleGenerarInforme}
                  disabled={generandoInforme}
                  className="shrink-0 rounded-xl gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                  size="sm"
                >
                  {generandoInforme ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {informeIa ? "Regenerar" : "Generar informe"}
                    </>
                  )}
                </Button>
              </div>

              {/* Contenido */}
              {generandoInforme && (
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin text-violet-500" />
                    <span>Analizando datos y redactando informe... (puede tardar 10-20 segundos)</span>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                    <Skeleton className="h-4 w-full mt-4" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              )}

              {!generandoInforme && informeIa && (
                <>
                  <div className="p-6 prose prose-sm max-w-none dark:prose-invert
                    prose-headings:text-foreground prose-headings:font-semibold
                    prose-p:text-muted-foreground prose-li:text-muted-foreground
                    prose-strong:text-foreground prose-h2:text-base prose-h3:text-sm">
                    <ReactMarkdown>{informeIa.texto}</ReactMarkdown>
                  </div>
                  <div className="flex items-center justify-end gap-2 px-5 py-3 border-t bg-muted/30">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2"
                      onClick={handleCopiarInforme}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copiar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl gap-2"
                      onClick={handleDescargarPdf}
                      disabled={descargandoPdf}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {descargandoPdf ? "Descargando..." : "Descargar PDF"}
                    </Button>
                  </div>
                </>
              )}

              {!generandoInforme && !informeIa && (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                  <Sparkles className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Hacé clic en "Generar informe" para obtener un análisis ejecutivo del período seleccionado.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── SECCIÓN INSIGHTS ── */}
        {!loading && insightsData && (
          <>
            {/* Divider */}
            <div className="flex items-center gap-3 pt-2">
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-1.5 rounded-full bg-[var(--ht-primary)]/10 px-3 py-1">
                <Activity className="h-3.5 w-3.5 text-[var(--ht-primary)]" />
                <span className="text-xs font-semibold text-[var(--ht-primary)] uppercase tracking-wide">Insights</span>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* KPIs de salud */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Salud de la clínica
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  label="Tasa de retención"
                  value={`${insightsData.tasa_retencion}%`}
                  icon={<Repeat2 className="h-5 w-5" />}
                  variant="primary"
                />
                <KpiCard
                  label="Turnos completados"
                  value={`${insightsData.tasa_completados}%`}
                  icon={<CheckCircle className="h-5 w-5" />}
                  variant="accent"
                />
                <KpiCard
                  label="Promedio / día hábil"
                  value={insightsData.promedio_turnos_dia}
                  icon={<Calendar className="h-5 w-5" />}
                  variant="primary"
                />
                <KpiCard
                  label="Pacientes únicos"
                  value={insightsData.pacientes_unicos}
                  icon={<Users className="h-5 w-5" />}
                  variant="accent"
                />
              </div>
            </div>

            {/* Callouts automáticos */}
            {(insightsData.dia_pico || insightsData.hora_pico) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {insightsData.dia_pico && (
                  <div className="rounded-xl border border-[var(--ht-primary)]/20 bg-[var(--ht-primary)]/5 p-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--ht-primary)]/15">
                      <Lightbulb className="h-4 w-4 text-[var(--ht-primary)]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--ht-primary)]">Día más activo</p>
                      <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{insightsData.dia_pico}</p>
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
                      <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{insightsData.hora_pico}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Mayor concentración de turnos</p>
                    </div>
                  </div>
                )}
                {insightsData.pacientes_recurrentes > 0 && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
                      <Repeat2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-600">Fidelización</p>
                      <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{insightsData.pacientes_recurrentes} pacientes</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Volvieron al menos una vez</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Distribución por día de la semana */}
            {insightsData.distribucion_por_dia.some(d => d.total > 0) && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Demanda por día de la semana</h3>
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={insightsData.distribucion_por_dia} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(0, 3)} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: 12 }}
                      formatter={(v) => [v ?? 0, "Turnos"]}
                    />
                    <Bar dataKey="total" fill="var(--ht-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribución por hora */}
            {insightsData.distribucion_por_hora.some(h => h.total > 0) && (
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold">Turnos por franja horaria (8:00 – 17:00)</h3>
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
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)", fontSize: 12 }}
                      formatter={(v) => [v ?? 0, "Turnos"]}
                    />
                    <Area type="monotone" dataKey="total" stroke="var(--ht-accent-dark)" fill="url(#gradHora)" strokeWidth={2} dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </RoleGuard>
  );
}
