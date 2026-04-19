"use client";

import { useCallback, useEffect, useState } from "react";
import reportsService, {
  TurnosReportData,
  PacientesReportData,
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
} from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { desde, hasta } = getRango(rango);
      const [turnos, pacientes] = await Promise.all([
        reportsService.getTurnos({ desde, hasta }),
        reportsService.getPacientes(),
      ]);
      setTurnosData(turnos);
      setPacientesData(pacientes);
    } catch {
      toast.error("Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }, [rango]);

  useEffect(() => {
    load();
  }, [load]);

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
                  formatter={(v: number) => [v, "Turnos"]}
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
                  formatter={(v: number) => [v, "Nuevos pacientes"]}
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
      </div>
    </RoleGuard>
  );
}
