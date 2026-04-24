"use client";

import { useEffect, useState, useCallback } from "react";
import listaEsperaService, {
  ListaEspera,
  EstadoListaEspera,
  CreateListaEsperaPayload,
} from "@/services/lista-espera.service";
import pacientesService, { Paciente } from "@/services/pacientes.service";
import usersService, { User } from "@/services/users.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Dialog,
  DialogContent,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Clock,
  Users,
  Bell,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  ClockAlert,
  UserPlus,
} from "lucide-react";

const ESTADO_CONFIG: Record<EstadoListaEspera, { label: string; className: string }> = {
  activa:     { label: "En espera",  className: "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  notificada: { label: "Notificada", className: "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  convertida: { label: "Convertida", className: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  vencida:    { label: "Vencida",    className: "border-red-300 text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
};

function formatFecha(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ListaEsperaPage() {
  const [lista, setLista] = useState<ListaEspera[]>([]);
  const [filtroEstado, setFiltroEstado] = useState("activa");
  const [isLoading, setIsLoading] = useState(true);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [profesionales, setProfesionales] = useState<User[]>([]);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ListaEspera | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<ListaEspera | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<CreateListaEsperaPayload & { estado?: EstadoListaEspera; notas: string }>({
    paciente_id: "",
    profesional_id: "",
    fecha_preferida: "",
    notas: "",
  });

  const loadLista = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listaEsperaService.getAll(filtroEstado === "all" ? undefined : filtroEstado);
      setLista(data);
    } catch {
      toast.error("Error al cargar la lista de espera");
    } finally {
      setIsLoading(false);
    }
  }, [filtroEstado]);

  useEffect(() => { loadLista(); }, [loadLista]);

  useEffect(() => {
    Promise.all([
      pacientesService.getAll(undefined, { limit: 1000 }),
      usersService.getAll(),
    ]).then(([pacs, users]) => {
      setPacientes(pacs.data);
      setProfesionales(users.filter((u) => u.role === "professional"));
    }).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingEntry(null);
    setForm({ paciente_id: "", profesional_id: "", fecha_preferida: "", notas: "" });
    setDialogOpen(true);
  };

  const openEdit = (entry: ListaEspera) => {
    setEditingEntry(entry);
    setForm({
      paciente_id: entry.paciente_id,
      profesional_id: entry.profesional_id ?? "",
      fecha_preferida: entry.fecha_preferida ?? "",
      notas: entry.notas ?? "",
      estado: entry.estado,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingEntry) {
        await listaEsperaService.update(editingEntry.id, {
          estado: form.estado,
          profesional_id: form.profesional_id || undefined,
          fecha_preferida: form.fecha_preferida || undefined,
          notas: form.notas || undefined,
        });
        toast.success("Entrada actualizada");
      } else {
        await listaEsperaService.create({
          paciente_id: form.paciente_id,
          profesional_id: form.profesional_id || undefined,
          fecha_preferida: form.fecha_preferida || undefined,
          notas: form.notas || undefined,
        });
        toast.success("Paciente agregado a la lista de espera");
      }
      setDialogOpen(false);
      loadLista();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message ?? "Error al guardar";
      toast.error(Array.isArray(msg) ? msg[0] : (msg as string));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEntry) return;
    try {
      await listaEsperaService.delete(deletingEntry.id);
      toast.success("Entrada eliminada");
      setDeleteDialogOpen(false);
      setDeletingEntry(null);
      loadLista();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleQuickEstado = async (entry: ListaEspera, estado: EstadoListaEspera) => {
    try {
      await listaEsperaService.update(entry.id, { estado });
      toast.success(`Marcado como ${ESTADO_CONFIG[estado].label}`);
      loadLista();
    } catch {
      toast.error("Error al actualizar");
    }
  };

  // KPIs
  const totalActivos = lista.filter((e) => e.estado === "activa").length;
  const totalNotificados = lista.filter((e) => e.estado === "notificada").length;
  const totalConvertidos = lista.filter((e) => e.estado === "convertida").length;

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lista de Espera</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pacientes que esperan un turno disponible
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white shadow-[var(--shadow-primary)]"
        >
          <UserPlus className="h-4 w-4" />
          Agregar a lista
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="En espera" value={totalActivos} icon={<Clock className="h-5 w-5" />} variant="warm" sub="esperando turno" />
        <KpiCard label="Notificados" value={totalNotificados} icon={<Bell className="h-5 w-5" />} variant="primary" sub="slot liberado" />
        <KpiCard label="Convertidos" value={totalConvertidos} icon={<CheckCircle2 className="h-5 w-5" />} variant="accent" sub="turnos asignados" />
      </div>

      {/* Filtros + Tabla */}
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-base font-semibold">Pacientes en espera</h2>
          <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v ?? "activa")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="activa">En espera</SelectItem>
              <SelectItem value="notificada">Notificados</SelectItem>
              <SelectItem value="convertida">Convertidos</SelectItem>
              <SelectItem value="vencida">Vencidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2 px-6 pb-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />)}
          </div>
        ) : lista.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
            <Users className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium">Sin pacientes en lista de espera</p>
            <p className="text-sm mt-0.5">Los pacientes aparecerán aquí cuando se los agregue</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Fecha preferida</TableHead>
                  <TableHead>En lista desde</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[120px] text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((entry) => {
                  const cfg = ESTADO_CONFIG[entry.estado];
                  return (
                    <TableRow key={entry.id} className="group">
                      <TableCell className="font-medium">
                        {entry.paciente
                          ? `${entry.paciente.nombre} ${entry.paciente.apellido}`
                          : "—"}
                        {entry.paciente?.cel && (
                          <p className="text-xs text-muted-foreground">{entry.paciente.cel}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {entry.profesional
                          ? `${entry.profesional.nombre} ${entry.profesional.apellido}`
                          : <span className="text-muted-foreground">Cualquiera</span>}
                      </TableCell>
                      <TableCell className="text-sm">{formatFecha(entry.fecha_preferida)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatFecha(entry.created_at)}</TableCell>
                      <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                        {entry.notas || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {entry.estado === "activa" && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              title="Marcar como notificado"
                              onClick={() => handleQuickEstado(entry, "notificada")}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          )}
                          {(entry.estado === "activa" || entry.estado === "notificada") && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              title="Marcar como convertido (turno asignado)"
                              onClick={() => handleQuickEstado(entry, "convertida")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                            onClick={() => openEdit(entry)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            onClick={() => { setDeletingEntry(entry); setDeleteDialogOpen(true); }}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Editar entrada" : "Agregar a lista de espera"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingEntry && (
              <div className="space-y-1.5">
                <Label htmlFor="le-paciente">Paciente *</Label>
                <Select value={form.paciente_id} onValueChange={(v) => setForm({ ...form, paciente_id: v ?? "" })}>
                  <SelectTrigger>
                    <span className="flex flex-1 text-left truncate text-sm">
                      {form.paciente_id ? (
                        (() => {
                          const p = pacientes.find((x) => x.id === form.paciente_id);
                          return p ? `${p.nombre} ${p.apellido} — DNI ${p.dni}` : "Seleccionar paciente";
                        })()
                      ) : <span className="text-muted-foreground">Seleccionar paciente</span>}
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
            )}

            <div className="space-y-1.5">
              <Label htmlFor="le-prof">Profesional preferido</Label>
              <Select value={form.profesional_id ?? ""} onValueChange={(v) => setForm({ ...form, profesional_id: v ?? "" })}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left truncate text-sm">
                    {form.profesional_id ? (
                      (() => {
                        const u = profesionales.find((x) => x.id === form.profesional_id);
                        return u ? `${u.nombre} ${u.apellido}` : "Cualquier profesional";
                      })()
                    ) : <span className="text-muted-foreground">Cualquier profesional</span>}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cualquier profesional</SelectItem>
                  {profesionales.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.nombre} {u.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="le-fecha">Fecha preferida</Label>
              <Input
                id="le-fecha"
                type="date"
                value={form.fecha_preferida ?? ""}
                onChange={(e) => setForm({ ...form, fecha_preferida: e.target.value })}
              />
            </div>

            {editingEntry && (
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v as EstadoListaEspera })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">En espera</SelectItem>
                    <SelectItem value="notificada">Notificada</SelectItem>
                    <SelectItem value="convertida">Convertida (turno asignado)</SelectItem>
                    <SelectItem value="vencida">Vencida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="le-notas">Notas</Label>
              <Textarea
                id="le-notas"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Motivo de la espera, preferencias horarias..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSaving || (!editingEntry && !form.paciente_id)}>
                {isSaving ? "Guardando..." : editingEntry ? "Guardar cambios" : "Agregar a lista"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Eliminar de la lista</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar a{" "}
            <strong>
              {deletingEntry?.paciente
                ? `${deletingEntry.paciente.nombre} ${deletingEntry.paciente.apellido}`
                : "este paciente"}
            </strong>{" "}
            de la lista de espera?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
