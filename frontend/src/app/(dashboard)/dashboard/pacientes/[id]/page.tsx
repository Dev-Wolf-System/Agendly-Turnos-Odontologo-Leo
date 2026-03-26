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

function formatFechaHora(fecha: string): string {
  return new Date(fecha).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

const estadoBadge: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pendiente: "outline",
  confirmado: "default",
  completado: "secondary",
  cancelado: "destructive",
  aprobado: "default",
  rechazado: "destructive",
};

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
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg">Paciente no encontrado</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/pacientes")}
        >
          Volver a Pacientes
        </Button>
      </div>
    );
  }

  const { paciente, proximosTurnos, historialTurnos, historialMedico, pagos, kpis } = ficha;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            onClick={() => router.push("/dashboard/pacientes")}
          >
            &larr; Volver a Pacientes
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            {paciente.nombre} {paciente.apellido}
          </h1>
          <p className="text-muted-foreground">
            DNI: {paciente.dni} &middot; {calcularEdad(paciente.fecha_nacimiento)}
            {paciente.cel && <> &middot; {paciente.cel}</>}
            {paciente.email && <> &middot; {paciente.email}</>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/turnos?paciente_id=${id}`}>
            <Button variant="outline" size="sm">
              + Nuevo Turno
            </Button>
          </Link>
          <Link href={`/dashboard/historial-medico?paciente_id=${id}`}>
            <Button variant="outline" size="sm">
              + Agregar Historial
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Turnos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{kpis.totalTurnos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ultimo Turno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {kpis.ultimoTurno ? formatFecha(kpis.ultimoTurno) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Historial Clinico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              {historialMedico.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {historialMedico.length === 1 ? "procedimiento" : "procedimientos"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pagado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatMonto(kpis.totalPagado)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">
              {formatMonto(kpis.saldoPendiente)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ultimos Procedimientos */}
      {historialMedico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ultimos Procedimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {historialMedico.slice(0, 5).map((h) => (
                <div
                  key={h.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm">
                      {h.tratamiento || "Sin tratamiento registrado"}
                    </p>
                    {h.diagnostico && (
                      <p className="text-sm text-muted-foreground">
                        Dx: {h.diagnostico}
                      </p>
                    )}
                    {h.observaciones && (
                      <p className="text-xs text-muted-foreground">
                        {h.observaciones}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0 ml-4">
                    {formatFecha(h.fecha)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="proximos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="proximos">
            Proximos Turnos ({proximosTurnos.length})
          </TabsTrigger>
          <TabsTrigger value="historial-turnos">
            Historial Turnos ({historialTurnos.length})
          </TabsTrigger>
          <TabsTrigger value="historial-medico">
            Historial Medico ({historialMedico.length})
          </TabsTrigger>
          <TabsTrigger value="pagos">
            Pagos ({pagos.length})
          </TabsTrigger>
        </TabsList>

        {/* Proximos Turnos */}
        <TabsContent value="proximos">
          <Card>
            <CardHeader>
              <CardTitle>Proximos Turnos</CardTitle>
            </CardHeader>
            <CardContent>
              {proximosTurnos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay turnos programados
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Odontologo</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proximosTurnos.map((turno) => (
                      <TableRow key={turno.id}>
                        <TableCell>{formatFecha(turno.start_time)}</TableCell>
                        <TableCell>
                          {new Date(turno.start_time).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={estadoBadge[turno.estado] || "outline"}>
                            {turno.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {turno.odontologo
                            ? `${turno.odontologo.nombre} ${turno.odontologo.apellido}`
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {turno.notas || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial de Turnos */}
        <TabsContent value="historial-turnos">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Turnos</CardTitle>
            </CardHeader>
            <CardContent>
              {historialTurnos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay turnos anteriores
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Hora</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Odontologo</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialTurnos.map((turno) => (
                      <TableRow key={turno.id}>
                        <TableCell>{formatFecha(turno.start_time)}</TableCell>
                        <TableCell>
                          {new Date(turno.start_time).toLocaleTimeString("es-AR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={estadoBadge[turno.estado] || "outline"}>
                            {turno.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {turno.odontologo
                            ? `${turno.odontologo.nombre} ${turno.odontologo.apellido}`
                            : "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {turno.notas || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historial Medico */}
        <TabsContent value="historial-medico">
          <Card>
            <CardHeader>
              <CardTitle>Historial Medico</CardTitle>
            </CardHeader>
            <CardContent>
              {historialMedico.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay registros de historial medico
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Diagnostico</TableHead>
                      <TableHead>Tratamiento</TableHead>
                      <TableHead>Observaciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historialMedico.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell>{formatFecha(h.fecha)}</TableCell>
                        <TableCell className="max-w-[200px]">
                          {h.diagnostico || "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {h.tratamiento || "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          {h.observaciones || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pagos */}
        <TabsContent value="pagos">
          <Card>
            <CardHeader>
              <CardTitle>Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {pagos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay pagos registrados
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Metodo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => (
                      <TableRow key={pago.id}>
                        <TableCell>{formatFecha(pago.fecha)}</TableCell>
                        <TableCell className="font-medium">
                          {formatMonto(pago.total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={estadoBadge[pago.estado] || "outline"}>
                            {pago.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>{pago.method || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
