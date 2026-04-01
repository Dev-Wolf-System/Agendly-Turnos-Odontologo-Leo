"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { RoleGuard } from "@/components/guards/role-guard";
import Link from "next/link";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Stethoscope,
  ClipboardList,
  MessageSquareText,
  CalendarDays,
  FileText,
  UserRound,
  X,
} from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  if (days < 30) return `Hace ${Math.floor(days / 7)} semana${Math.floor(days / 7) > 1 ? "s" : ""}`;
  if (days < 365) return `Hace ${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? "es" : ""}`;
  return `Hace ${Math.floor(days / 365)} año${Math.floor(days / 365) > 1 ? "s" : ""}`;
}

export default function HistorialMedicoPage() {
  return (
    <RoleGuard allowedRoles={["admin", "professional"]}>
      <HistorialMedicoContent />
    </RoleGuard>
  );
}

function HistorialMedicoContent() {
  const searchParams = useSearchParams();
  const preloadPacienteId = searchParams.get("paciente_id");
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
      const result = await pacientesService.getAll(search);
      setPacientes(result.data);
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

  // Auto-seleccionar paciente si viene desde ficha
  useEffect(() => {
    if (preloadPacienteId && !selectedPaciente) {
      pacientesService.getAll("").then((result) => {
        const found = result.data.find((p) => p.id === preloadPacienteId);
        if (found) {
          setSelectedPaciente(found);
          loadHistorial(found.id);
        }
      }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadPacienteId]);

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

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Registro
          </Button>
        )}
      </div>

      {/* Buscador de pacientes */}
      <Card className="overflow-visible">
        <CardContent className="pt-6">
          {!selectedPaciente ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar paciente por nombre, apellido o DNI..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 max-w-lg"
                />
                {/* Resultados de búsqueda */}
                {pacientes.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full max-w-lg rounded-xl border bg-popover shadow-lg overflow-hidden">
                    {pacientes.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPaciente(p)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {p.nombre.charAt(0)}
                          {p.apellido.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {p.nombre} {p.apellido}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            DNI: {p.dni || "—"} {p.cel ? `· ${p.cel}` : ""}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {isLoading && (
                  <div className="absolute z-50 mt-1 w-full max-w-lg rounded-xl border bg-popover p-4 shadow-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Buscando pacientes...
                    </div>
                  </div>
                )}
              </div>
              {!search && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                    <Stethoscope className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Historial Clínico</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Buscá un paciente para ver su historial médico completo,
                    diagnósticos, tratamientos y observaciones clínicas.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Paciente seleccionado — tarjeta compacta */
            <div className="flex items-center gap-4 rounded-xl border bg-gradient-to-r from-primary/5 to-transparent p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                {selectedPaciente.nombre.charAt(0)}
                {selectedPaciente.apellido.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-base">
                  {selectedPaciente.nombre} {selectedPaciente.apellido}
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  <span>DNI: {selectedPaciente.dni || "—"}</span>
                  {selectedPaciente.cel && (
                    <>
                      <span className="text-border">·</span>
                      <span>{selectedPaciente.cel}</span>
                    </>
                  )}
                  {selectedPaciente.email && (
                    <>
                      <span className="text-border">·</span>
                      <span>{selectedPaciente.email}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/dashboard/pacientes/${selectedPaciente.id}`}>
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent transition-colors">
                    <UserRound className="h-3 w-3" />
                    Ver ficha
                  </Badge>
                </Link>
                <Badge variant="secondary" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {historial.length} registro{historial.length !== 1 ? "s" : ""}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSelectedPaciente(null);
                    setHistorial([]);
                  }}
                  title="Cambiar paciente"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline del historial */}
      {selectedPaciente && (
        <div>
          {isLoadingHistorial ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
              <p className="text-sm">Cargando historial clínico...</p>
            </div>
          ) : historial.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Sin registros clínicos</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Este paciente aún no tiene historial médico registrado.
                    Creá el primer registro para comenzar a documentar su atención clínica.
                  </p>
                  <Button onClick={openCreate} className="mt-5 gap-2">
                    <Plus className="h-4 w-4" />
                    Crear primer registro
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative space-y-4">
              {/* Línea vertical de timeline */}
              <div className="absolute left-[23px] top-4 bottom-4 w-px bg-border" />

              {historial.map((registro, index) => (
                <div key={registro.id} className="relative flex gap-4">
                  {/* Nodo del timeline */}
                  <div className="relative z-10 shrink-0">
                    <div
                      className={`flex h-[46px] w-[46px] items-center justify-center rounded-full border-2 ${
                        index === 0
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      <Stethoscope className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Card del registro */}
                  <Card className="flex-1 group hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {formatFullDate(registro.created_at)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {timeAgo(registro.created_at)}
                            </Badge>
                          </div>
                          {registro.turno && (
                            <Link
                              href={`/dashboard/turnos?turno_id=${registro.turno.id}`}
                              className="text-xs text-primary hover:underline pl-5 inline-block"
                            >
                              Turno: {new Date(registro.turno.start_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                              {" - "}
                              {new Date(registro.turno.end_time).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => openEdit(registro)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => openDelete(registro)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-4">
                      <div className="grid gap-3 sm:grid-cols-3">
                        {/* Diagnóstico */}
                        <div className="rounded-lg border bg-red-50/50 dark:bg-red-950/20 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-red-100 dark:bg-red-900/40">
                              <Search className="h-3 w-3 text-red-600 dark:text-red-400" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                              Diagnóstico
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {registro.diagnostico || (
                              <span className="text-muted-foreground italic">Sin diagnóstico</span>
                            )}
                          </p>
                        </div>

                        {/* Tratamiento */}
                        <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/40">
                              <Stethoscope className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              Tratamiento
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {registro.tratamiento || (
                              <span className="text-muted-foreground italic">Sin tratamiento</span>
                            )}
                          </p>
                        </div>

                        {/* Observaciones */}
                        <div className="rounded-lg border bg-amber-50/50 dark:bg-amber-950/20 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-100 dark:bg-amber-900/40">
                              <MessageSquareText className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                            </div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                              Observaciones
                            </span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {registro.observaciones || (
                              <span className="text-muted-foreground italic">Sin observaciones</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
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
              <Label htmlFor="diagnostico" className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-red-500" />
                Diagnóstico
              </Label>
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
              <Label htmlFor="tratamiento" className="flex items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5 text-blue-500" />
                Tratamiento
              </Label>
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
              <Label htmlFor="observaciones" className="flex items-center gap-2">
                <MessageSquareText className="h-3.5 w-3.5 text-amber-500" />
                Observaciones
              </Label>
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
              este registro médico del {deleting ? formatDate(deleting.created_at) : ""}.
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
