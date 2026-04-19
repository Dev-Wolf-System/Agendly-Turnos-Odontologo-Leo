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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  UserPlus,
  Users,
  Phone,
  Mail,
  Calendar,
  ArrowUpDown,
  LayoutGrid,
  LayoutList,
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

function getInitials(nombre: string, apellido: string): string {
  return `${nombre?.charAt(0) || ""}${apellido?.charAt(0) || ""}`.toUpperCase();
}

const GRADIENT_COLORS = [
  "from-[var(--ht-primary)] to-[var(--ht-accent-dark)]",
  "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]",
  "from-blue-500 to-cyan-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-[var(--ht-accent)] to-fuchsia-600",
];

function getGradient(id: string): string {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
}

export default function PacientesPage() {
  const router = useRouter();
  const { maxPacientes, currentPacientes, canAddPaciente, loading: limitsLoading } = usePlanLimits();
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [form, setForm] = useState({
    dni: "",
    nombre: "",
    apellido: "",
    cel: "",
    email: "",
    fecha_nacimiento: "",
    obra_social: "",
    nro_afiliado: "",
    plan_os: "",
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

  const openCreate = () => {
    setEditing(null);
    setForm({ dni: "", nombre: "", apellido: "", cel: "", email: "", fecha_nacimiento: "", obra_social: "", nro_afiliado: "", plan_os: "" });
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
      obra_social: paciente.obra_social || "",
      nro_afiliado: paciente.nro_afiliado || "",
      plan_os: paciente.plan_os || "",
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
          obra_social: form.obra_social || undefined,
          nro_afiliado: form.nro_afiliado || undefined,
          plan_os: form.plan_os || undefined,
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
        if (form.obra_social) payload.obra_social = form.obra_social;
        if (form.nro_afiliado) payload.nro_afiliado = form.nro_afiliado;
        if (form.plan_os) payload.plan_os = form.plan_os;
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("ASC");
    }
    setPage(1);
  };

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meta.total} paciente{meta.total !== 1 ? "s" : ""} registrado{meta.total !== 1 ? "s" : ""}
            {maxPacientes !== null && (
              <span className={`ml-2 font-medium ${!canAddPaciente ? "text-red-500" : "text-muted-foreground"}`}>
                ({currentPacientes} de {maxPacientes})
              </span>
            )}
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={!canAddPaciente}
          title={!canAddPaciente ? `Límite de ${maxPacientes} pacientes alcanzado. Actualiza tu plan para agregar más.` : undefined}
          className="bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:from-[var(--ht-primary)] hover:to-[var(--ht-accent-dark)] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo Paciente
        </Button>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border bg-card p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido o DNI..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 rounded-xl border-muted bg-muted/30 focus:bg-background transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Ordenar */}
          <Select
            value={`${sortBy}:${sortOrder}`}
            onValueChange={(v: string | null) => {
              if (!v) return;
              const [field, order] = v.split(":");
              setSortBy(field);
              setSortOrder(order as "ASC" | "DESC");
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] rounded-xl">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
              <span>{({ "apellido:ASC": "Apellido A-Z", "apellido:DESC": "Apellido Z-A", "nombre:ASC": "Nombre A-Z", "nombre:DESC": "Nombre Z-A", "created_at:DESC": "Más recientes", "created_at:ASC": "Más antiguos" } as Record<string, string>)[`${sortBy}:${sortOrder}`] || "Ordenar por"}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apellido:ASC">Apellido A-Z</SelectItem>
              <SelectItem value="apellido:DESC">Apellido Z-A</SelectItem>
              <SelectItem value="nombre:ASC">Nombre A-Z</SelectItem>
              <SelectItem value="nombre:DESC">Nombre Z-A</SelectItem>
              <SelectItem value="created_at:DESC">Más recientes</SelectItem>
              <SelectItem value="created_at:ASC">Más antiguos</SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle vista */}
          <div className="flex items-center rounded-xl border bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-lg p-2 transition-all ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-lg p-2 transition-all ${viewMode === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "space-y-3"
        }>
          {[...Array(8)].map((_, i) => (
            <div key={i} className={`rounded-xl border bg-card ${viewMode === "grid" ? "p-5 h-52" : "p-4 h-20"} animate-pulse`}>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : pacientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground rounded-xl border bg-card">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)]/10 to-[var(--ht-accent)]/10 mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">No se encontraron pacientes</p>
          <p className="text-sm mt-1">
            {search ? "Intenta con otro término de búsqueda" : "Registra tu primer paciente para comenzar"}
          </p>
          {!search && (
            <Button onClick={openCreate} className="mt-4" variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Crear primer paciente
            </Button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* Vista de tarjetas */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pacientes.map((paciente) => (
            <div
              key={paciente.id}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
            >
              {/* Glow */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${getGradient(paciente.id)} opacity-[0.06] rounded-full group-hover:opacity-[0.12] transition-opacity`} />

              <div className="relative">
                {/* Avatar + Nombre */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getGradient(paciente.id)} text-white text-sm font-bold shadow-md`}>
                    {getInitials(paciente.nombre, paciente.apellido)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold truncate">
                      {paciente.nombre} {paciente.apellido}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] font-medium px-1.5 py-0">
                        DNI {paciente.dni}
                      </Badge>
                      {paciente.fecha_nacimiento && (
                        <span className="text-[10px] text-muted-foreground">
                          {calcularEdad(paciente.fecha_nacimiento)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-2 mb-4">
                  {paciente.cel && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span className="truncate">{paciente.cel}</span>
                    </div>
                  )}
                  {paciente.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{paciente.email}</span>
                    </div>
                  )}
                  {paciente.fecha_nacimiento && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(paciente.fecha_nacimiento).toLocaleDateString("es-AR")}</span>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-1 pt-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs text-[var(--ht-accent)] hover:text-[var(--ht-accent)] hover:bg-emerald-50 dark:hover:bg-emerald-900/40"
                    onClick={() => router.push(`/dashboard/pacientes/${paciente.id}`)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Ver ficha
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    onClick={() => openEdit(paciente)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    onClick={() => openDelete(paciente)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista de lista */
        <div className="space-y-2">
          {pacientes.map((paciente) => (
            <div
              key={paciente.id}
              className="group flex items-center gap-4 rounded-xl border bg-card px-5 py-3 shadow-sm hover:shadow-md transition-all duration-200 hover:bg-muted/30"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${getGradient(paciente.id)} text-white text-xs font-bold shadow-sm`}>
                {getInitials(paciente.nombre, paciente.apellido)}
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-1 sm:gap-4 items-center">
                <div className="sm:col-span-2">
                  <p className="text-sm font-semibold truncate">
                    {paciente.nombre} {paciente.apellido}
                  </p>
                  <Badge variant="outline" className="text-[10px] mt-0.5">
                    DNI {paciente.dni}
                  </Badge>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span className="truncate">{paciente.cel || "—"}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{paciente.email || "—"}</span>
                </div>
                <div className="hidden sm:block text-xs text-muted-foreground text-right">
                  {calcularEdad(paciente.fecha_nacimiento)}
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[var(--ht-accent)] hover:text-[var(--ht-accent)] hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-all hover:scale-110"
                  onClick={() => router.push(`/dashboard/pacientes/${paciente.id}`)}
                  title="Ver ficha"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all hover:scale-110"
                  onClick={() => openEdit(paciente)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all hover:scale-110"
                  onClick={() => openDelete(paciente)}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {!isLoading && meta.total > 0 && (
        <Pagination
          meta={meta}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      )}

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
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

            {/* Cobertura Médica */}
            <div className="pt-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Cobertura Médica</p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="obra_social">Obra Social / Prepaga</Label>
                  <Input
                    id="obra_social"
                    value={form.obra_social}
                    onChange={(e) => setForm({ ...form, obra_social: e.target.value })}
                    placeholder="OSDE, Swiss Medical, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nro_afiliado">Nro. Afiliado</Label>
                    <Input
                      id="nro_afiliado"
                      value={form.nro_afiliado}
                      onChange={(e) => setForm({ ...form, nro_afiliado: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan_os">Plan</Label>
                    <Input
                      id="plan_os"
                      value={form.plan_os}
                      onChange={(e) => setForm({ ...form, plan_os: e.target.value })}
                      placeholder="310 / Preferred / etc."
                    />
                  </div>
                </div>
              </div>
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
