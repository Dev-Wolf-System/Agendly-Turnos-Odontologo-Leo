"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { RoleGuard } from "@/components/guards/role-guard";
import api from "@/services/api";
import type { PaginationMeta } from "@/services/pacientes.service";
import { Pagination } from "@/components/ui/pagination";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Search,
  Mail,
  Phone,
  User,
  Tag,
} from "lucide-react";
import categoriasService, { Categoria } from "@/services/categorias.service";

interface Proveedor {
  id: string;
  clinica_id: string;
  nombre: string;
  contacto: string | null;
  email: string | null;
  cel: string | null;
  created_at: string;
  categorias?: Categoria[];
}

export default function ProveedoresPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ProveedoresContent />
    </RoleGuard>
  );
}

function ProveedoresContent() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deleting, setDeleting] = useState<Proveedor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [form, setForm] = useState({
    nombre: "",
    contacto: "",
    email: "",
    cel: "",
    categoria_ids: [] as string[],
  });

  const loadProveedores = useCallback(async () => {
    try {
      setIsLoading(true);
      const [provRes, cats] = await Promise.all([
        api.get<{ data: Proveedor[]; meta: PaginationMeta }>("/proveedores", {
          params: { page, limit, sortBy: "nombre", sortOrder: "ASC" },
        }),
        categoriasService.getAll(),
      ]);
      setProveedores(provRes.data.data);
      setMeta(provRes.data.meta);
      setCategorias(cats);
    } catch {
      toast.error("Error al cargar proveedores");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  const filtered = useMemo(() => {
    let result = proveedores;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.contacto?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q),
      );
    }
    if (filterCat !== "all") {
      result = result.filter((p) =>
        filterCat === "__none__"
          ? !p.categorias || p.categorias.length === 0
          : p.categorias?.some((c) => c.id === filterCat)
      );
    }
    return result;
  }, [proveedores, search, filterCat]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: "", contacto: "", email: "", cel: "", categoria_ids: [] });
    setDialogOpen(true);
  };

  const openEdit = (prov: Proveedor) => {
    setEditing(prov);
    setForm({
      nombre: prov.nombre || "",
      contacto: prov.contacto || "",
      email: prov.email || "",
      cel: prov.cel || "",
      categoria_ids: prov.categorias?.map((c) => c.id) || [],
    });
    setDialogOpen(true);
  };

  const openDelete = (prov: Proveedor) => {
    setDeleting(prov);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Record<string, any> = { nombre: form.nombre };
      if (form.contacto) payload.contacto = form.contacto;
      if (form.email) payload.email = form.email;
      if (form.cel) payload.cel = form.cel;
      payload.categoria_ids = form.categoria_ids;

      if (editing) {
        await api.patch(`/proveedores/${editing.id}`, payload);
        toast.success("Proveedor actualizado");
      } else {
        await api.post("/proveedores", payload);
        toast.success("Proveedor creado");
      }
      setDialogOpen(false);
      loadProveedores();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al guardar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategoria = async () => {
    if (!newCatName.trim()) return;
    setIsSavingCat(true);
    try {
      const created = await categoriasService.create({ nombre: newCatName.trim() });
      setCategorias((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, categoria_ids: [...prev.categoria_ids, created.id] }));
      setCatDialogOpen(false);
      setNewCatName("");
      toast.success("Categoría creada");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al crear categoría";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSavingCat(false);
    }
  };

  const toggleCategoria = (catId: string) => {
    setForm((prev) => ({
      ...prev,
      categoria_ids: prev.categoria_ids.includes(catId)
        ? prev.categoria_ids.filter((id) => id !== catId)
        : [...prev.categoria_ids, catId],
    }));
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/proveedores/${deleting.id}`);
      toast.success("Proveedor eliminado");
      setDeleteDialogOpen(false);
      setDeleting(null);
      loadProveedores();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al eliminar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">
            Directorio de proveedores de materiales dentales
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* KPI + Search */}
      <div className="flex flex-wrap items-end gap-4">
        <Card className="shrink-0">
          <CardContent className="flex items-center gap-3 py-3 px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#e0f5f1] dark:bg-[#2a7a6e]/40">
              <Building2 className="h-5 w-5 text-[#5bbcad] dark:text-[#9dddd3]" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{meta.total}</p>
              <p className="text-xs text-muted-foreground mt-0.5">proveedores activos</p>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-1 flex-1 max-w-md">
          <span className="text-xs font-medium text-muted-foreground">Buscar</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, contacto o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="space-y-1 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">Categoría</span>
          <Select
            value={filterCat}
            onValueChange={(v: string | null) => v && setFilterCat(v)}
          >
            <SelectTrigger className="w-48">
              <span>
                {filterCat === "all"
                  ? "Todas las categorías"
                  : filterCat === "__none__"
                    ? "Sin categoría"
                    : categorias.find((c) => c.id === filterCat)?.nombre || "Categoría"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="__none__">Sin categoría</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de proveedores */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <div className="space-y-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-muted" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-3/4 bg-muted rounded" />
                      <div className="h-3 w-1/2 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-muted rounded" />
                  <div className="h-3 w-2/3 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                {proveedores.length === 0
                  ? "Sin proveedores registrados"
                  : "No se encontraron resultados"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {proveedores.length === 0
                  ? "Registrá tu primer proveedor para vincular materiales del inventario."
                  : "Intentá con otro término de búsqueda."}
              </p>
              {proveedores.length === 0 && (
                <Button onClick={openCreate} className="mt-5 gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar proveedor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((prov) => (
              <Card key={prov.id} className="group hover:shadow-md transition-shadow duration-200">
                <CardContent className="py-5">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#7cd1c4] to-[#4aa89b] text-white text-sm font-bold shrink-0">
                      {prov.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold truncate">{prov.nombre}</h3>
                          {prov.contacto && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <User className="h-3 w-3 shrink-0" />
                              <span className="truncate">{prov.contacto}</span>
                            </p>
                          )}
                        </div>
                        {/* Acciones hover */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => openEdit(prov)}
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => openDelete(prov)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="mt-3 space-y-1.5">
                        {prov.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            <span className="truncate">{prov.email}</span>
                          </div>
                        )}
                        {prov.cel && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                            <span>{prov.cel}</span>
                          </div>
                        )}
                        {!prov.email && !prov.cel && (
                          <p className="text-xs text-muted-foreground italic">Sin datos de contacto</p>
                        )}
                      </div>

                      {/* Categorías */}
                      {prov.categorias && prov.categorias.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {prov.categorias.map((cat) => (
                            <Badge key={cat.id} variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                              <Tag className="h-2.5 w-2.5" />
                              {cat.nombre}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Registrado: {new Date(prov.created_at).toLocaleDateString("es-AR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <Badge variant="secondary" className="text-xs">Activo</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {meta.total > 0 && (
            <Pagination
              meta={meta}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          )}
        </>
      )}

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del proveedor"
                : "Registra un nuevo proveedor de materiales"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la empresa *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                placeholder="Ej: Dental Express S.A."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contacto">Persona de contacto</Label>
              <Input
                id="contacto"
                value={form.contacto}
                onChange={(e) =>
                  setForm({ ...form, contacto: e.target.value })
                }
                placeholder="Nombre del referente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="ventas@empresa.com"
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
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Categorías</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs gap-1 text-primary"
                  onClick={() => setCatDialogOpen(true)}
                >
                  <Plus className="h-3 w-3" />
                  Nueva
                </Button>
              </div>
              {categorias.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No hay categorías creadas
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto rounded-md border p-2">
                  {categorias.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 accent-primary"
                        checked={form.categoria_ids.includes(cat.id)}
                        onChange={() => toggleCategoria(cat.id)}
                      />
                      <span className="truncate">{cat.nombre}</span>
                    </label>
                  ))}
                </div>
              )}
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
                {isSaving ? "Guardando..." : "Guardar"}
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
              Se eliminará el proveedor <strong>{deleting?.nombre}</strong>.
              Los ítems de inventario asociados no se eliminarán.
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

      {/* Dialog Nueva Categoría */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Nueva Categoría
            </DialogTitle>
            <DialogDescription>
              Creá una categoría para clasificar proveedores
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="catNameProv">Nombre *</Label>
              <Input
                id="catNameProv"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej: Instrumental quirúrgico"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateCategoria();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCatDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCategoria}
              disabled={isSavingCat || !newCatName.trim()}
            >
              {isSavingCat ? "Creando..." : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
