"use client";

import { useEffect, useState, useCallback } from "react";
import turnosService, {
  Turno,
  EstadoTurno,
  CreateTurnoPayload,
  UpdateTurnoPayload,
} from "@/services/turnos.service";
import pagosService from "@/services/pagos.service";
import pacientesService, { Paciente } from "@/services/pacientes.service";
import usersService, { User } from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const estadoColors: Record<EstadoTurno, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  confirmado: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  completado: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  cancelado: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const estadoLabels: Record<EstadoTurno, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
};

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

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [odontologos, setOdontologos] = useState<User[]>([]);
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Turno | null>(null);
  const [changingStatus, setChangingStatus] = useState<Turno | null>(null);
  const [deleting, setDeleting] = useState<Turno | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    paciente_id: "",
    user_id: "",
    start_time: "",
    end_time: "",
    notas: "",
  });
  const [newEstado, setNewEstado] = useState<EstadoTurno>("pendiente");
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false);
  const [pagoTurno, setPagoTurno] = useState<Turno | null>(null);
  const [pagoForm, setPagoForm] = useState({ total: "", method: "" });

  const loadTurnos = useCallback(async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (fecha) params.fecha = fecha;
      if (filtroEstado !== "all") params.estado = filtroEstado;
      const data = await turnosService.getAll(params as any);
      setTurnos(data);
    } catch {
      toast.error("Error al cargar turnos");
    } finally {
      setIsLoading(false);
    }
  }, [fecha, filtroEstado]);

  const loadOptions = useCallback(async () => {
    try {
      const [pacs, users] = await Promise.all([
        pacientesService.getAll(),
        usersService.getAll(),
      ]);
      setPacientes(pacs);
      setOdontologos(users.filter((u) => u.role !== "assistant"));
    } catch {
      // silently fail — options will be empty
    }
  }, []);

  useEffect(() => {
    loadTurnos();
  }, [loadTurnos]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const openCreate = () => {
    setEditing(null);
    const defaultStart = `${fecha}T09:00`;
    const defaultEnd = `${fecha}T09:30`;
    setForm({
      paciente_id: "",
      user_id: "",
      start_time: defaultStart,
      end_time: defaultEnd,
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
      notas: turno.notas || "",
    });
    setDialogOpen(true);
  };

  const openStatusChange = (turno: Turno) => {
    setChangingStatus(turno);
    setNewEstado(turno.estado);
    setStatusDialogOpen(true);
  };

  const openDelete = (turno: Turno) => {
    setDeleting(turno);
    setDeleteDialogOpen(true);
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
        if (form.notas) payload.notas = form.notas;
        await turnosService.create(payload);
        toast.success("Turno creado");
      }
      setDialogOpen(false);
      loadTurnos();
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
      loadTurnos();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al cambiar estado";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const openPago = (turno: Turno) => {
    setPagoTurno(turno);
    setPagoForm({ total: "", method: "" });
    setPagoDialogOpen(true);
  };

  const handlePago = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoTurno) return;
    try {
      await pagosService.create({
        turno_id: pagoTurno.id,
        total: pagoForm.total ? parseFloat(pagoForm.total) : undefined,
        method: pagoForm.method || undefined,
      });
      toast.success("Pago registrado");
      setPagoDialogOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al registrar pago";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await turnosService.delete(deleting.id);
      toast.success("Turno eliminado");
      setDeleteDialogOpen(false);
      setDeleting(null);
      loadTurnos();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al eliminar turno";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Turnos</h1>
          <p className="text-muted-foreground">
            Gestiona la agenda de turnos de tu clínica
          </p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Turno</Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Agenda del Día</CardTitle>
          <CardDescription>
            Filtra por fecha y estado
          </CardDescription>
          <div className="flex gap-4 pt-2">
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-44"
            />
            <Select value={filtroEstado} onValueChange={(v: string | null) => v && setFiltroEstado(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : turnos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>No hay turnos para esta fecha</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horario</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Odontólogo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turnos.map((turno) => (
                  <TableRow key={turno.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {formatTime(turno.start_time)} - {formatTime(turno.end_time)}
                    </TableCell>
                    <TableCell>
                      {turno.paciente
                        ? `${turno.paciente.nombre} ${turno.paciente.apellido}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {turno.user
                        ? `${turno.user.nombre} ${turno.user.apellido}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <button onClick={() => openStatusChange(turno)}>
                        <Badge
                          className={`${estadoColors[turno.estado]} cursor-pointer hover:opacity-80`}
                        >
                          {estadoLabels[turno.estado]}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell>
                      {turno.source === "whatsapp" ? (
                        <Badge variant="outline">WhatsApp</Badge>
                      ) : turno.source === "dashboard" ? (
                        <Badge variant="secondary">Dashboard</Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate">
                      {turno.notas || "—"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPago(turno)}
                        disabled={turno.estado === "cancelado"}
                      >
                        Cobrar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(turno)}
                        disabled={
                          turno.estado === "cancelado" ||
                          turno.estado === "completado"
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(turno)}
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
                onValueChange={(v: string | null) => setForm({ ...form, paciente_id: v || "" })}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate text-sm">
                    {form.paciente_id
                      ? (() => {
                          const p = pacientes.find((pac) => pac.id === form.paciente_id);
                          return p ? `${p.nombre} ${p.apellido} — DNI ${p.dni}` : "Seleccionar paciente";
                        })()
                      : <span className="text-muted-foreground">Seleccionar paciente</span>}
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
              <Label htmlFor="user_id">Odontólogo *</Label>
              <Select
                value={form.user_id}
                onValueChange={(v: string | null) => setForm({ ...form, user_id: v || "" })}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate text-sm">
                    {form.user_id
                      ? (() => {
                          const u = odontologos.find((o) => o.id === form.user_id);
                          return u ? `${u.nombre} ${u.apellido}` : "Seleccionar odontólogo";
                        })()
                      : <span className="text-muted-foreground">Seleccionar odontólogo</span>}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {odontologos.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre} {u.apellido}
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
                disabled={
                  isSaving || !form.paciente_id || !form.user_id
                }
              >
                {isSaving
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
            onValueChange={(v: string | null) => v && setNewEstado(v as EstadoTurno)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="completado">Completado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
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

      {/* Dialog Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Pago */}
      <Dialog open={pagoDialogOpen} onOpenChange={setPagoDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              {pagoTurno?.paciente
                ? `Cobrar a ${pagoTurno.paciente.nombre} ${pagoTurno.paciente.apellido}`
                : "Registrar pago para este turno"}
              {pagoTurno
                ? ` — ${formatDate(pagoTurno.start_time)} ${formatTime(pagoTurno.start_time)}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePago} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pago-total">Total ($) *</Label>
              <Input
                id="pago-total"
                type="number"
                step="0.01"
                value={pagoForm.total}
                onChange={(e) =>
                  setPagoForm({ ...pagoForm, total: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pago-method">Método de pago</Label>
              <Select
                value={pagoForm.method}
                onValueChange={(v: string | null) =>
                  setPagoForm({ ...pagoForm, method: v || "" })
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPagoDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={!pagoForm.total}>
                Registrar Pago
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
