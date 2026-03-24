"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import dashboardService, {
  DashboardStats,
  TurnoHoy,
  IngresoMensual,
  FacturacionDiaria,
  TurnoSemana,
  TratamientoMes,
} from "@/services/dashboard.service";

const estadoColors: Record<string, string> = {
  completado:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  confirmado:
    "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  pendiente:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelado:
    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const mesesCortos: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [turnosHoy, setTurnosHoy] = useState<TurnoHoy[]>([]);
  const [ingresosMensuales, setIngresosMensuales] = useState<IngresoMensual[]>([]);
  const [facturacionDiaria, setFacturacionDiaria] = useState<FacturacionDiaria[]>([]);
  const [turnosSemana, setTurnosSemana] = useState<TurnoSemana[]>([]);
  const [tratamientos, setTratamientos] = useState<TratamientoMes[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        statsData,
        turnosData,
        ingresosData,
        facturacionData,
        turnosSemanaData,
        tratamientosData,
      ] = await Promise.all([
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

  // Distribución de estados desde turnos reales de hoy
  const estadoTurnos = (() => {
    const counts: Record<string, number> = {
      completado: 0, confirmado: 0, pendiente: 0, cancelado: 0,
    };
    turnosHoy.forEach((t) => {
      if (counts[t.estado] !== undefined) counts[t.estado]++;
    });
    return [
      { nombre: "Completados", valor: counts.completado, color: "#00C198" },
      { nombre: "Confirmados", valor: counts.confirmado, color: "#19D1F4" },
      { nombre: "Pendientes", valor: counts.pendiente, color: "#9FA9FB" },
      { nombre: "Cancelados", valor: counts.cancelado, color: "#ef4444" },
    ];
  })();

  // Formatear meses para el gráfico
  const ingresosFormateados = ingresosMensuales.map((item) => ({
    mes: mesesCortos[item.mes.split("-")[1]] || item.mes,
    ingresos: item.ingresos,
  }));

  const formatCurrency = (value: number) =>
    `$${value.toLocaleString("es-AR")}`;

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de tu clínica</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Hoy</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.turnosHoy ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">turnos programados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats?.totalPacientes ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">pacientes registrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
            <DollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : formatCurrency(stats?.ingresosMes ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">pagos aprobados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.lowStockCount ?? 0) > 0 ? "text-amber-500" : ""}`}>
              {isLoading ? "..." : stats?.lowStockCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">items bajo mínimo</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Ingresos Mensuales */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Ingresos Mensuales</CardTitle>
            <CardDescription>Últimos 6 meses de facturación aprobada</CardDescription>
          </CardHeader>
          <CardContent>
            {ingresosFormateados.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Sin datos de ingresos aún
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ingresosFormateados}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs" tick={{ fill: "currentColor" }} />
                  <YAxis className="text-xs" tick={{ fill: "currentColor" }} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-foreground)",
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Ingresos"]}
                  />
                  <Bar dataKey="ingresos" fill="#00C198" radius={[4, 4, 0, 0]} name="Ingresos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Estado de Turnos (Pie) */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Estado de Turnos</CardTitle>
            <CardDescription>Distribución de hoy</CardDescription>
          </CardHeader>
          <CardContent>
            {turnosHoy.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Sin turnos para hoy
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={estadoTurnos}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="valor"
                      nameKey="nombre"
                    >
                      {estadoTurnos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        color: "var(--color-foreground)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-4 mt-2">
                  {estadoTurnos.map((item) => (
                    <div key={item.nombre} className="flex items-center gap-2 text-sm">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.nombre}</span>
                      <span className="font-semibold">{item.valor}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Facturación diaria */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Facturación Diaria</CardTitle>
            <CardDescription>Ingresos aprobados del mes en curso</CardDescription>
          </CardHeader>
          <CardContent>
            {facturacionDiaria.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Sin facturación este mes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={facturacionDiaria}>
                  <defs>
                    <linearGradient id="gradientIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C198" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00C198" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dia" className="text-xs" tick={{ fill: "currentColor" }} />
                  <YAxis className="text-xs" tick={{ fill: "currentColor" }} tickFormatter={(v) => `$${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-foreground)",
                    }}
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Ingreso"]}
                  />
                  <Area type="monotone" dataKey="monto" stroke="#00C198" fill="url(#gradientIngresos)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Turnos de la semana */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Turnos de la Semana</CardTitle>
            <CardDescription>Programados vs completados</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={turnosSemana}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="dia" className="text-xs" tick={{ fill: "currentColor" }} />
                <YAxis className="text-xs" tick={{ fill: "currentColor" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    color: "var(--color-foreground)",
                  }}
                />
                <Line type="monotone" dataKey="turnos" stroke="#19D1F4" strokeWidth={2} dot={{ fill: "#19D1F4" }} name="Programados" />
                <Line type="monotone" dataKey="completados" stroke="#00C198" strokeWidth={2} dot={{ fill: "#00C198" }} name="Completados" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Tratamientos + Turnos Recientes */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Tratamientos del mes */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Tratamientos del Mes</CardTitle>
            <CardDescription>Más realizados según historial médico</CardDescription>
          </CardHeader>
          <CardContent>
            {tratamientos.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Sin tratamientos registrados este mes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={tratamientos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" tick={{ fill: "currentColor" }} />
                  <YAxis dataKey="nombre" type="category" className="text-xs" tick={{ fill: "currentColor" }} width={90} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      color: "var(--color-foreground)",
                    }}
                  />
                  <Bar dataKey="cantidad" fill="#143360" radius={[0, 4, 4, 0]} name="Realizados" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Turnos de Hoy */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Turnos de Hoy</CardTitle>
            <CardDescription>
              {turnosHoy.length > 0
                ? `${turnosHoy.length} turno${turnosHoy.length !== 1 ? "s" : ""} programado${turnosHoy.length !== 1 ? "s" : ""}`
                : "Sin turnos para hoy"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Cargando...
              </div>
            ) : turnosHoy.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No hay turnos programados para hoy
              </div>
            ) : (
              <div className="space-y-3">
                {turnosHoy.map((turno) => (
                  <div key={turno.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {turno.paciente?.nombre?.charAt(0) ?? "?"}
                        {turno.paciente?.apellido?.charAt(0) ?? ""}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {turno.paciente
                            ? `${turno.paciente.nombre} ${turno.paciente.apellido}`
                            : "Paciente"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {turno.user ? `Dr. ${turno.user.nombre} ${turno.user.apellido}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{formatTime(turno.start_time)}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${estadoColors[turno.estado] || ""}`}>
                        {turno.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  );
}
