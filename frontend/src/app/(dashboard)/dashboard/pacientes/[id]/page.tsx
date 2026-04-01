"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import pacientesService, {
  FichaPaciente,
} from "@/services/pacientes.service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  ClipboardPlus,
  Phone,
  Mail,
  CreditCard,
  Activity,
  Clock,
  DollarSign,
  AlertCircle,
  Stethoscope,
  User,
  FileText,
} from "lucide-react";

function calcularEdad(fechaNacimiento: string | null): string {
  if (!fechaNacimiento) return "—";
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  return `${edad} años`;
}

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFechaCorta(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

function formatHora(fecha: string): string {
  return new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonto(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(monto);
}

const estadoConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  pendiente: { variant: "outline", className: "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  confirmado: { variant: "default", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  completado: { variant: "secondary", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  cancelado: { variant: "destructive", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
  aprobado: { variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  rechazado: { variant: "destructive", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
};

function EstadoBadge({ estado }: { estado: string }) {
  const config = estadoConfig[estado] || { variant: "outline" as const, className: "" };
  return (
    <Badge variant={config.variant} className={`text-xs font-medium capitalize ${config.className}`}>
      {estado}
    </Badge>
  );
}

const gradients = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-600",
];

function getGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

export default function FichaPacientePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ficha, setFicha] = useState<FichaPaciente | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    pacientesService
      .getFicha(id)
      .then(setFicha)
      .catch(() => toast.error("Error al cargar la ficha del paciente"))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-2xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <User className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium">Paciente no encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">No se pudo acceder a la ficha de este paciente</p>
        <Button
          variant="outline"
          className="mt-6 rounded-xl"
          onClick={() => router.push("/dashboard/pacientes")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Pacientes
        </Button>
      </div>
    );
  }

  const { paciente, proximosTurnos, historialTurnos, historialMedico, pagos, kpis } = ficha;
  const gradient = getGradient(paciente.id);

  return (
    <div className="space-y-6 p-1">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-card">
        {/* Background decoration */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.04] dark:opacity-[0.08]`} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground rounded-xl"
            onClick={() => router.push("/dashboard/pacientes")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Pacientes
          </Button>

          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar */}
            <div className={`shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <span className="text-2xl font-bold text-white">
                {getInitials(paciente.nombre, paciente.apellido)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {paciente.nombre} {paciente.apellido}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      DNI: {paciente.dni}
                    </span>
                    {paciente.fecha_nacimiento && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {calcularEdad(paciente.fecha_nacimiento)}
                      </span>
                    )}
                    {paciente.cel && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {paciente.cel}
                      </span>
                    )}
                    {paciente.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {paciente.email}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 shrink-0">
                  <Link href={`/dashboard/turnos?paciente_id=${id}`}>
                    <Button size="sm" className="rounded-xl gap-1.5 shadow-sm">
                      <CalendarPlus className="h-4 w-4" />
                      Nuevo Turno
                    </Button>
                  </Link>
                  <Link href={`/dashboard/historial-medico?paciente_id=${id}`}>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                      <ClipboardPlus className="h-4 w-4" />
                      Agregar Historial
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden rounded-2xl border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wider">Total Turnos</p>
                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-1">{kpis.totalTurnos}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 dark:bg-blue-400/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wider">Último Turno</p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                  {kpis.ultimoTurno ? formatFecha(kpis.ultimoTurno) : "—"}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 dark:bg-purple-400/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wider">Total Pagado</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {formatMonto(kpis.totalPagado)}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider">Saldo Pendiente</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                  {formatMonto(kpis.saldoPendiente)}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimos Procedimientos - Timeline */}
      {historialMedico.length > 0 && (
        <Card className="rounded-2xl overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">Últimos Procedimientos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-4">
                {historialMedico.slice(0, 5).map((h, idx) => (
                  <div key={h.id} className="relative flex gap-4 pl-1">
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-[22px] h-[22px] rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                      idx === 0
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/30 bg-background"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-4 ${idx === historialMedico.slice(0, 5).length - 1 ? "pb-0" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm leading-tight">
                            {h.tratamiento || "Sin tratamiento registrado"}
                          </p>
                          {h.diagnostico && (
                            <p className="text-sm text-muted-foreground">
                              Dx: {h.diagnostico}
                            </p>
                          )}
                          {h.observaciones && (
                            <p className="text-xs text-muted-foreground/80 mt-1">
                              {h.observaciones}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-md">
                          {formatFechaCorta(h.fecha)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="proximos" className="space-y-4">
        <TabsList className="rounded-xl bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="proximos" className="rounded-lg data-[state=active]:shadow-sm gap-1.5 text-xs sm:text-sm">
            <CalendarPlus className="h-3.5 w-3.5 hidden sm:block" />
            Próximos ({proximosTurnos.length})
          </TabsTrigger>
          <TabsTrigger value="historial-turnos" className="rounded-lg data-[state=active]:shadow-sm gap-1.5 text-xs sm:text-sm">
            <Calendar className="h-3.5 w-3.5 hidden sm:block" />
            Historial ({historialTurnos.length})
          </TabsTrigger>
          <TabsTrigger value="historial-medico" className="rounded-lg data-[state=active]:shadow-sm gap-1.5 text-xs sm:text-sm">
            <Activity className="h-3.5 w-3.5 hidden sm:block" />
            Clínico ({historialMedico.length})
          </TabsTrigger>
          <TabsTrigger value="pagos" className="rounded-lg data-[state=active]:shadow-sm gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5 hidden sm:block" />
            Pagos ({pagos.length})
          </TabsTrigger>
        </TabsList>

        {/* Próximos Turnos */}
        <TabsContent value="proximos">
          <Card className="rounded-2xl">
            <CardContent className="p-0">
              {proximosTurnos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <CalendarPlus className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Sin turnos programados</p>
                  <p className="text-sm mt-0.5">Este paciente no tiene turnos futuros</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Hora</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Odontólogo</TableHead>
                        <TableHead className="font-semibold">Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proximosTurnos.map((turno) => (
                        <TableRow key={turno.id} className="group">
                          <TableCell className="font-medium">{formatFecha(turno.start_time)}</TableCell>
                          <TableCell>{formatHora(turno.start_time)}</TableCell>
                          <TableCell><EstadoBadge estado={turno.estado} /></TableCell>
                          <TableCell>
                            {turno.profesional
                              ? `${turno.profesional.nombre} ${turno.profesional.apellido}`
                              : "—"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {turno.notas || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial de Turnos */}
        <TabsContent value="historial-turnos">
          <Card className="rounded-2xl">
            <CardContent className="p-0">
              {historialTurnos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Sin historial de turnos</p>
                  <p className="text-sm mt-0.5">No hay turnos anteriores registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Hora</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Odontólogo</TableHead>
                        <TableHead className="font-semibold">Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historialTurnos.map((turno) => (
                        <TableRow key={turno.id} className="group">
                          <TableCell className="font-medium">{formatFecha(turno.start_time)}</TableCell>
                          <TableCell>{formatHora(turno.start_time)}</TableCell>
                          <TableCell><EstadoBadge estado={turno.estado} /></TableCell>
                          <TableCell>
                            {turno.profesional
                              ? `${turno.profesional.nombre} ${turno.profesional.apellido}`
                              : "—"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {turno.notas || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial Médico */}
        <TabsContent value="historial-medico">
          <Card className="rounded-2xl">
            <CardContent className="p-0">
              {historialMedico.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <Activity className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Sin historial clínico</p>
                  <p className="text-sm mt-0.5">No hay registros médicos para este paciente</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Diagnóstico</TableHead>
                        <TableHead className="font-semibold">Tratamiento</TableHead>
                        <TableHead className="font-semibold">Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historialMedico.map((h) => (
                        <TableRow key={h.id} className="group">
                          <TableCell className="font-medium whitespace-nowrap">{formatFecha(h.fecha)}</TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2">{h.diagnostico || "—"}</span>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2">{h.tratamiento || "—"}</span>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2 text-muted-foreground">{h.observaciones || "—"}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagos */}
        <TabsContent value="pagos">
          <Card className="rounded-2xl">
            <CardContent className="p-0">
              {pagos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Sin pagos registrados</p>
                  <p className="text-sm mt-0.5">No hay pagos para este paciente</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Monto</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos.map((pago) => (
                        <TableRow key={pago.id} className="group">
                          <TableCell className="font-medium">{formatFecha(pago.fecha)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatMonto(pago.total)}
                          </TableCell>
                          <TableCell><EstadoBadge estado={pago.estado} /></TableCell>
                          <TableCell className="text-muted-foreground capitalize">{pago.method || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
