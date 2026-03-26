"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import pacientesService, {
  Paciente,
  CreatePacientePayload,
  UpdatePacientePayload,
  PaginationMeta,
} from "@/services/pacientes.service";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
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
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Eye, Pencil, Trash2 } from "lucide-react";

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

export default function PacientesPage() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("apellido");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Paciente | null>(null);
  const [deleting, setDeleting] = useState<Paciente | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    cel: "",
    email: "",
    fecha_nacimiento: "",
  });

  const loadPacientes = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await pacientesService.getAll(search || undefined, {
        page,
        limit,
        sortBy,
        sortOrder,
      });
      setPacientes(result.data);
      setMeta(result.meta);
    } catch {
      toast.error("Error al cargar pacientes");
    } finally {
      setIsLoading(false);
    }
  }, [search, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPacientes();
    }, 300);
    return () => clearTimeout(timer);
  }, [loadPacientes]);

  const handleSort = (field: string, order: "ASC" | "DESC") => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ dni: "", nombre: "", apellido: "", cel: "", email: "", fecha_nacimiento: "" });
    setDialogOpen(true);
  };

  const openEdit = (paciente: Paciente) => {
    setEditing(paciente);
    setForm({
      dni: paciente.dni || "",
      nombre: paciente.nombre || "",
      apellido: paciente.apellido || "",
      cel: paciente.cel || "",
      email: paciente.email || "",
      fecha_nacimiento: paciente.fecha_nacimiento || "",
    });
    setDialogOpen(true);
  };

  const openDelete = (paciente: Paciente) => {
    setDeleting(paciente);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        await pacientesService.update(editing.id, {
          dni: form.dni || undefined,
          nombre: form.nombre,
          apellido: form.apellido,
          cel: form.cel || undefined,
          email: form.email || undefined,
          fecha_nacimiento: form.fecha_nacimiento || undefined,
        });
        toast.success("Paciente actualizado");
      } else {
        const payload: CreatePacientePayload = {
          dni: form.dni,
          nombre: form.nombre,
          apellido: form.apellido,
        };
        if (form.cel) payload.cel = form.cel;
        if (form.email) payload.email = form.email;
        if (form.fecha_nacimiento) payload.fecha_nacimiento = form.fecha_nacimiento;
        await pacientesService.create(payload);
        toast.success("Paciente creado");
      }
      setDialogOpen(false);
      loadPacientes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al guardar paciente";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await pacientesService.delete(deleting.id);
      toast.success("Paciente eliminado");
      setDeleteDialogOpen(false);
      setDeleting(null);
      loadPacientes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al eliminar paciente";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">
            Gestiona los pacientes de tu clínica
          </p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Paciente</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pacientes</CardTitle>
          <CardDescription>
            Busca por nombre, apellido o DNI
          </CardDescription>
          <div className="pt-2">
            <Input
              placeholder="Buscar pacientes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : pacientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>No se encontraron pacientes</p>
              {search && (
                <p className="text-sm">
                  Intenta con otro término de búsqueda
                </p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="DNI" field="dni" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Nombre" field="nombre" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Apellido" field="apellido" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead>Edad</TableHead>
                  <SortableHeader label="Celular" field="cel" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Email" field="email" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="w-[120px] text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pacientes.map((paciente) => (
                  <TableRow key={paciente.id}>
                    <TableCell>
                      <Badge variant="outline">{paciente.dni}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {paciente.nombre}
                    </TableCell>
                    <TableCell>{paciente.apellido}</TableCell>
                    <TableCell>{calcularEdad(paciente.fecha_nacimiento)}</TableCell>
                    <TableCell>{paciente.cel || "—"}</TableCell>
                    <TableCell>{paciente.email || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-all duration-200 hover:scale-110"
                          onClick={() =>
                            router.push(`/dashboard/pacientes/${paciente.id}`)
                          }
                          title="Ver ficha"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200 hover:scale-110"
                          onClick={() => openEdit(paciente)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 hover:scale-110"
                          onClick={() => openDelete(paciente)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!isLoading && meta.total > 0 && (
            <Pagination
              meta={meta}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          )}
        </CardContent>
      </Card>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Paciente" : "Nuevo Paciente"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del paciente"
                : "Completa los datos para registrar un nuevo paciente"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                required
                placeholder="12345678"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  value={form.apellido}
                  onChange={(e) =>
                    setForm({ ...form, apellido: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
              <Input
                id="fecha_nacimiento"
                type="date"
                value={form.fecha_nacimiento}
                onChange={(e) =>
                  setForm({ ...form, fecha_nacimiento: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cel">Celular</Label>
              <Input
                id="cel"
                value={form.cel}
                onChange={(e) => setForm({ ...form, cel: e.target.value })}
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="paciente@email.com"
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
                    : "Crear Paciente"}
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
              Esta acción no se puede deshacer. Se eliminará permanentemente al
              paciente{" "}
              <strong>
                {deleting?.nombre} {deleting?.apellido}
              </strong>
              .
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
