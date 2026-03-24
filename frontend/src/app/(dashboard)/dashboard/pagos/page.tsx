"use client";

import { useEffect, useState, useCallback } from "react";
import pagosService, {
  Pago,
  PagoFilters,
  PagoResumen,
  EstadoPago,
} from "@/services/pagos.service";
import turnosService, { Turno } from "@/services/turnos.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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

const estadoColors: Record<string, string> = {
  pendiente:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  aprobado:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rechazado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  mercadopago: "MercadoPago",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

function formatCurrency(value: number | null) {
  if (value == null) return "—";
  return `$${Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [resumen, setResumen] = useState<PagoResumen | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pago | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [filtroMethod, setFiltroMethod] = useState<string>("all");
  const [filtroDesde, setFiltroDesde] = useState<string>("");
  const [filtroHasta, setFiltroHasta] = useState<string>("");

  const [form, setForm] = useState({
    turno_id: "",
    total: "",
    method: "",
    estado: "pendiente" as EstadoPago,
  });

  const buildFilters = useCallback((): PagoFilters => {
    const filters: PagoFilters = {};
    if (filtroEstado !== "all") filters.estado = filtroEstado as EstadoPago;
    if (filtroMethod !== "all") filters.method = filtroMethod;
    if (filtroDesde) filters.desde = filtroDesde;
    if (filtroHasta) filters.hasta = filtroHasta;
    return filters;
  }, [filtroEstado, filtroMethod, filtroDesde, filtroHasta]);

  const loadPagos = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters = buildFilters();
      const [pagosData, resumenData] = await Promise.all([
        pagosService.getAll(filters),
        pagosService.getResumen({
          desde: filters.desde,
          hasta: filters.hasta,
        }),
      ]);
      setPagos(pagosData);
      setResumen(resumenData);
    } catch {
      toast.error("Error al cargar pagos");
    } finally {
      setIsLoading(false);
    }
  }, [buildFilters]);

  const loadTurnos = useCallback(async () => {
    try {
      const data = await turnosService.getAll({});
      setTurnos(data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadPagos();
  }, [loadPagos]);

  useEffect(() => {
    loadTurnos();
  }, [loadTurnos]);

  const openCreate = () => {
    setEditing(null);
    setForm({ turno_id: "", total: "", method: "", estado: "pendiente" });
    setDialogOpen(true);
  };

  const openEdit = (pago: Pago) => {
    setEditing(pago);
    setForm({
      turno_id: pago.turno_id,
      total: pago.total?.toString() || "",
      method: pago.method || "",
      estado: pago.estado,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        await pagosService.update(editing.id, {
          total: form.total ? parseFloat(form.total) : undefined,
          method: form.method || undefined,
          estado: form.estado,
        });
        toast.success("Pago actualizado");
      } else {
        await pagosService.create({
          turno_id: form.turno_id,
          total: form.total ? parseFloat(form.total) : undefined,
          method: form.method || undefined,
        });
        toast.success("Pago registrado");
      }
      setDialogOpen(false);
      loadPagos();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al guardar pago";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await pagosService.delete(id);
      toast.success("Pago eliminado");
      loadPagos();
    } catch {
      toast.error("Error al eliminar pago");
    }
  };

  const clearFilters = () => {
    setFiltroEstado("all");
    setFiltroMethod("all");
    setFiltroDesde("");
    setFiltroHasta("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona los pagos y facturación
          </p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Pago</Button>
      </div>

      {/* Resumen de ingresos */}
      {resumen && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Aprobados</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {formatCurrency(resumen.total)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {resumen.cantidad} pago{resumen.cantidad !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
          {resumen.por_metodo.map((m) => (
            <Card key={m.method}>
              <CardHeader className="pb-2">
                <CardDescription>
                  {methodLabels[m.method] || m.method}
                </CardDescription>
                <CardTitle className="text-2xl">
                  {formatCurrency(m.total)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {m.cantidad} pago{m.cantidad !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pagos</CardTitle>
          <CardDescription>Todos los pagos registrados</CardDescription>
          <div className="flex flex-wrap gap-3 pt-2">
            <Select
              value={filtroEstado}
              onValueChange={(v: string | null) => v && setFiltroEstado(v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="aprobado">Aprobado</SelectItem>
                <SelectItem value="rechazado">Rechazado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filtroMethod}
              onValueChange={(v: string | null) => v && setFiltroMethod(v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los métodos</SelectItem>
                <SelectItem value="efectivo">Efectivo</SelectItem>
                <SelectItem value="mercadopago">MercadoPago</SelectItem>
                <SelectItem value="transferencia">Transferencia</SelectItem>
                <SelectItem value="tarjeta">Tarjeta</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              className="w-40"
              placeholder="Desde"
            />
            <Input
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              className="w-40"
              placeholder="Hasta"
            />

            {(filtroEstado !== "all" ||
              filtroMethod !== "all" ||
              filtroDesde ||
              filtroHasta) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : pagos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Odontólogo</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagos.map((pago) => (
                  <TableRow key={pago.id}>
                    <TableCell>{formatDate(pago.created_at)}</TableCell>
                    <TableCell>
                      {pago.turno?.paciente
                        ? `${pago.turno.paciente.nombre} ${pago.turno.paciente.apellido}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {pago.turno?.user
                        ? `${pago.turno.user.nombre} ${pago.turno.user.apellido}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {pago.turno?.start_time
                        ? `${formatDate(pago.turno.start_time)} ${formatTime(pago.turno.start_time)}`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(pago.total)}
                    </TableCell>
                    <TableCell>
                      {pago.method
                        ? methodLabels[pago.method] || pago.method
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={estadoColors[pago.estado] || ""}>
                        {pago.estado.charAt(0).toUpperCase() +
                          pago.estado.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(pago)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(pago.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Crear/Editar Pago */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Pago" : "Registrar Pago"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del pago"
                : "Selecciona un turno y registra el pago"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="turno_id">Turno *</Label>
                <Select
                  value={form.turno_id}
                  onValueChange={(v: string | null) =>
                    setForm({ ...form, turno_id: v || "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar turno" />
                  </SelectTrigger>
                  <SelectContent>
                    {turnos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.paciente
                          ? `${t.paciente.nombre} ${t.paciente.apellido}`
                          : "Sin paciente"}{" "}
                        — {formatDate(t.start_time)}{" "}
                        {formatTime(t.start_time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="total">Total ($)</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Método de pago</Label>
              <Select
                value={form.method}
                onValueChange={(v: string | null) =>
                  setForm({ ...form, method: v || "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="mercadopago">MercadoPago</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editing && (
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(v: string | null) =>
                    v && setForm({ ...form, estado: v as EstadoPago })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
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
                disabled={isSaving || (!editing && !form.turno_id)}
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
