"use client";

import { useEffect, useState, useCallback } from "react";
import historialMedicoService, {
  HistorialMedico,
  CreateHistorialPayload,
  UpdateHistorialPayload,
} from "@/services/historial-medico.service";
import pacientesService, { Paciente } from "@/services/pacientes.service";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function HistorialMedicoPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [historial, setHistorial] = useState<HistorialMedico[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HistorialMedico | null>(null);
  const [deleting, setDeleting] = useState<HistorialMedico | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    diagnostico: "",
    tratamiento: "",
    observaciones: "",
  });

  const searchPacientes = useCallback(async () => {
    if (!search.trim()) {
      setPacientes([]);
      return;
    }
    try {
      setIsLoading(true);
      const data = await pacientesService.getAll(search);
      setPacientes(data);
    } catch {
      toast.error("Error al buscar pacientes");
    } finally {
      setIsLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPacientes();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchPacientes]);

  const loadHistorial = useCallback(async (pacienteId: string) => {
    try {
      setIsLoadingHistorial(true);
      const data = await historialMedicoService.getByPaciente(pacienteId);
      setHistorial(data);
    } catch {
      toast.error("Error al cargar historial médico");
    } finally {
      setIsLoadingHistorial(false);
    }
  }, []);

  const selectPaciente = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setPacientes([]);
    setSearch("");
    loadHistorial(paciente.id);
  };

  const openCreate = () => {
    if (!selectedPaciente) {
      toast.error("Seleccioná un paciente primero");
      return;
    }
    setEditing(null);
    setForm({ diagnostico: "", tratamiento: "", observaciones: "" });
    setDialogOpen(true);
  };

  const openEdit = (registro: HistorialMedico) => {
    setEditing(registro);
    setForm({
      diagnostico: registro.diagnostico || "",
      tratamiento: registro.tratamiento || "",
      observaciones: registro.observaciones || "",
    });
    setDialogOpen(true);
  };

  const openDelete = (registro: HistorialMedico) => {
    setDeleting(registro);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaciente) return;
    setIsSaving(true);
    try {
      if (editing) {
        const payload: UpdateHistorialPayload = {};
        if (form.diagnostico !== (editing.diagnostico || ""))
          payload.diagnostico = form.diagnostico;
        if (form.tratamiento !== (editing.tratamiento || ""))
          payload.tratamiento = form.tratamiento;
        if (form.observaciones !== (editing.observaciones || ""))
          payload.observaciones = form.observaciones;
        await historialMedicoService.update(editing.id, payload);
        toast.success("Registro actualizado");
      } else {
        const payload: CreateHistorialPayload = {
          paciente_id: selectedPaciente.id,
        };
        if (form.diagnostico) payload.diagnostico = form.diagnostico;
        if (form.tratamiento) payload.tratamiento = form.tratamiento;
        if (form.observaciones) payload.observaciones = form.observaciones;
        await historialMedicoService.create(payload);
        toast.success("Registro creado");
      }
      setDialogOpen(false);
      loadHistorial(selectedPaciente.id);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Error al guardar registro";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting || !selectedPaciente) return;
    try {
      await historialMedicoService.delete(deleting.id);
      toast.success("Registro eliminado");
      setDeleteDialogOpen(false);
      setDeleting(null);
      loadHistorial(selectedPaciente.id);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Error al eliminar registro";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Historial Médico
          </h1>
          <p className="text-muted-foreground">
            Consultá y gestioná el historial clínico de cada paciente
          </p>
        </div>
        {selectedPaciente && (
          <Button onClick={openCreate}>+ Nuevo Registro</Button>
        )}
      </div>

      {/* Buscador de pacientes */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Paciente</CardTitle>
          <CardDescription>
            Buscá por nombre, apellido o DNI para ver su historial
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Input
              placeholder="Buscar paciente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
            {/* Resultados de búsqueda */}
            {pacientes.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-w-md rounded-md border bg-popover shadow-lg">
                {pacientes.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPaciente(p)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors first:rounded-t-md last:rounded-b-md"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {p.nombre.charAt(0)}
                      {p.apellido.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {p.nombre} {p.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        DNI: {p.dni || "—"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {isLoading && (
              <div className="absolute z-10 mt-1 w-full max-w-md rounded-md border bg-popover p-4 text-center text-sm text-muted-foreground shadow-lg">
                Buscando...
              </div>
            )}
          </div>

          {/* Paciente seleccionado */}
          {selectedPaciente && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                {selectedPaciente.nombre.charAt(0)}
                {selectedPaciente.apellido.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium">
                  {selectedPaciente.nombre} {selectedPaciente.apellido}
                </p>
                <p className="text-sm text-muted-foreground">
                  DNI: {selectedPaciente.dni || "—"} · Cel:{" "}
                  {selectedPaciente.cel || "—"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPaciente(null);
                  setHistorial([]);
                }}
              >
                Cambiar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Historial del paciente */}
      {selectedPaciente && (
        <Card>
          <CardHeader>
            <CardTitle>
              Historial de {selectedPaciente.nombre} {selectedPaciente.apellido}
            </CardTitle>
            <CardDescription>
              {historial.length} registro{historial.length !== 1 ? "s" : ""}{" "}
              encontrado{historial.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHistorial ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                Cargando historial...
              </div>
            ) : historial.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <p>No hay registros médicos para este paciente</p>
                <p className="text-sm">
                  Creá el primer registro con el botón &quot;+ Nuevo
                  Registro&quot;
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Diagnóstico</TableHead>
                    <TableHead>Tratamiento</TableHead>
                    <TableHead>Observaciones</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historial.map((registro) => (
                    <TableRow key={registro.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {formatDate(registro.created_at)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {registro.diagnostico || "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {registro.tratamiento || "—"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {registro.observaciones || "—"}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(registro)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDelete(registro)}
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
      )}

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Registro" : "Nuevo Registro Médico"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modificá los datos del registro médico"
                : `Registro para ${selectedPaciente?.nombre} ${selectedPaciente?.apellido}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="diagnostico">Diagnóstico</Label>
              <Textarea
                id="diagnostico"
                value={form.diagnostico}
                onChange={(e) =>
                  setForm({ ...form, diagnostico: e.target.value })
                }
                placeholder="Descripción del diagnóstico..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tratamiento">Tratamiento</Label>
              <Textarea
                id="tratamiento"
                value={form.tratamiento}
                onChange={(e) =>
                  setForm({ ...form, tratamiento: e.target.value })
                }
                placeholder="Tratamiento realizado o indicado..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                value={form.observaciones}
                onChange={(e) =>
                  setForm({ ...form, observaciones: e.target.value })
                }
                placeholder="Notas adicionales..."
                rows={2}
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
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Guardando..."
                  : editing
                    ? "Guardar Cambios"
                    : "Crear Registro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente
              este registro médico.
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
    </div>
  );
}
