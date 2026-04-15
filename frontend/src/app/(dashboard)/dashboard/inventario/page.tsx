"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { RoleGuard } from "@/components/guards/role-guard";
import api from "@/services/api";
import type { PaginationMeta } from "@/services/pacientes.service";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/ui/kpi-card";
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
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Plus,
  Pencil,
  Trash2,
  Search,
  Tag,
} from "lucide-react";
import categoriasService, { Categoria } from "@/services/categorias.service";

interface Proveedor {
  id: string;
  nombre: string;
}

interface InventarioItem {
  id: string;
  clinica_id: string;
  nombre: string;
  cantidad: number | null;
  stock_min: number | null;
  proveedor_id: string | null;
  categoria_id: string | null;
  updated_at: string;
  proveedor?: Proveedor | null;
  categoria?: { id: string; nombre: string } | null;
}

export default function InventarioPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <InventarioContent />
    </RoleGuard>
  );
}

function InventarioContent() {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("nombre");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [editing, setEditing] = useState<InventarioItem | null>(null);
  const [deleting, setDeleting] = useState<InventarioItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStock, setFilterStock] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [form, setForm] = useState({
    nombre: "",
    cantidad: "",
    stock_min: "",
    proveedor_id: "",
    categoria_id: "",
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [invRes, provRes, cats] = await Promise.all([
        api.get<{ data: InventarioItem[]; meta: PaginationMeta }>("/inventario", {
          params: { page, limit, sortBy, sortOrder },
        }),
        api.get<{ data: Proveedor[]; meta: PaginationMeta }>("/proveedores"),
        categoriasService.getAll(),
      ]);
      setItems(invRes.data.data);
      setMeta(invRes.data.meta);
      setProveedores(provRes.data.data);
      setCategorias(cats);
    } catch {
      toast.error("Error al cargar inventario");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, sortBy, sortOrder]);

  const handleSort = (field: string, order: "ASC" | "DESC") => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isLowStock = (item: InventarioItem) =>
    item.stock_min != null &&
    item.cantidad != null &&
    item.cantidad <= item.stock_min;

  const stats = useMemo(() => {
    const total = items.length;
    const low = items.filter(isLowStock).length;
    const ok = total - low;
    return { total, low, ok };
  }, [items]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nombre.toLowerCase().includes(q) ||
          item.proveedor?.nombre?.toLowerCase().includes(q),
      );
    }
    if (filterStock === "low") {
      filtered = filtered.filter(isLowStock);
    } else if (filterStock === "ok") {
      filtered = filtered.filter((item) => !isLowStock(item));
    }
    if (filterCat !== "all") {
      filtered = filtered.filter((item) =>
        filterCat === "__none__" ? !item.categoria_id : item.categoria_id === filterCat
      );
    }
    return filtered;
  }, [items, search, filterStock, filterCat]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: "", cantidad: "", stock_min: "", proveedor_id: "", categoria_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: InventarioItem) => {
    setEditing(item);
    setForm({
      nombre: item.nombre || "",
      cantidad: item.cantidad?.toString() || "",
      stock_min: item.stock_min?.toString() || "",
      proveedor_id: item.proveedor_id || "",
      categoria_id: item.categoria_id || "",
    });
    setDialogOpen(true);
  };

  const openDelete = (item: InventarioItem) => {
    setDeleting(item);
    setDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Record<string, any> = {
        nombre: form.nombre,
      };
      if (form.cantidad) payload.cantidad = parseInt(form.cantidad);
      if (form.stock_min) payload.stock_min = parseInt(form.stock_min);
      if (form.proveedor_id) payload.proveedor_id = form.proveedor_id;
      if (form.categoria_id) payload.categoria_id = form.categoria_id;

      if (editing) {
        await api.patch(`/inventario/${editing.id}`, payload);
        toast.success("Ítem actualizado");
      } else {
        await api.post("/inventario", payload);
        toast.success("Ítem creado");
      }
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al guardar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.delete(`/inventario/${deleting.id}`);
      toast.success("Ítem eliminado");
      setDeleteDialogOpen(false);
      setDeleting(null);
      loadData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al eliminar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleCreateCategoria = async () => {
    if (!newCatName.trim()) return;
    setIsSavingCat(true);
    try {
      const created = await categoriasService.create({ nombre: newCatName.trim() });
      setCategorias((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, categoria_id: created.id }));
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

  function stockPercent(item: InventarioItem): number {
    if (item.stock_min == null || item.stock_min === 0 || item.cantidad == null) return 100;
    return Math.min(Math.round((item.cantidad / (item.stock_min * 3)) * 100), 100);
  }

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Controla el stock de materiales de tu clínica
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white shadow-[var(--shadow-primary)] hover:shadow-md transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo Ítem
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label="Total Materiales"
          value={stats.total}
          sub="ítems en inventario"
          icon={<Boxes className="h-5 w-5" />}
          variant="primary"
        />
        <KpiCard
          label="Stock Normal"
          value={stats.ok}
          sub="ítems con stock suficiente"
          icon={<CheckCircle2 className="h-5 w-5" />}
          variant="accent"
        />
        <KpiCard
          label="Stock Bajo"
          value={stats.low}
          sub={stats.low > 0 ? "necesitan reposición" : "todo en orden"}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
          className={stats.low > 0 ? "ring-2 ring-[var(--ht-danger)]/30" : ""}
        />
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-0">
          <h2 className="text-base font-semibold">Stock de Materiales</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestiona cantidades y alertas de stock mínimo
          </p>
          <div className="flex flex-wrap items-end gap-3 py-4">
            <div className="space-y-1 flex-1 max-w-sm">
              <span className="text-xs font-medium text-muted-foreground">Buscar</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar material o proveedor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Nivel de stock</span>
              <Select
                value={filterStock}
                onValueChange={(v: string | null) => v && setFilterStock(v)}
              >
                <SelectTrigger className="w-44">
                  <span>
                    {{ all: "Todos los niveles", low: "Stock bajo", ok: "Stock normal" }[filterStock]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los niveles</SelectItem>
                  <SelectItem value="low">Stock bajo</SelectItem>
                  <SelectItem value="ok">Stock normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
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
        </div>
        <div className="px-6 pb-6">
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted mb-4">
                <Package className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium">
                {items.length === 0
                  ? "No hay materiales en el inventario"
                  : "No se encontraron resultados"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {items.length === 0
                  ? "Agregá tu primer material para comenzar"
                  : "Intentá con otro término de búsqueda"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader label="Material" field="nombre" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <SortableHeader label="Stock" field="cantidad" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} className="w-[180px]" />
                  <SortableHeader label="Mínimo" field="stock_min" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead>Categoría</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <SortableHeader label="Actualización" field="created_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
                  <TableHead className="w-[100px] text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const low = isLowStock(item);
                  const pct = stockPercent(item);
                  return (
                    <TableRow key={item.id} className={low ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                            low
                              ? "bg-red-100 dark:bg-red-900/40"
                              : "bg-blue-50 dark:bg-blue-950/30"
                          }`}>
                            <Package className={`h-4 w-4 ${
                              low ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                            }`} />
                          </div>
                          <span className="font-medium">{item.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className={`font-semibold ${low ? "text-red-600 dark:text-red-400" : ""}`}>
                              {item.cantidad ?? 0}
                            </span>
                            {low && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                Bajo
                              </Badge>
                            )}
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                low
                                  ? "bg-red-500"
                                  : pct > 60
                                    ? "bg-emerald-500"
                                    : "bg-amber-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.stock_min ?? "—"}
                      </TableCell>
                      <TableCell>
                        {item.categoria?.nombre ? (
                          <Badge variant="secondary" className="gap-1">
                            <Tag className="h-3 w-3" />
                            {item.categoria.nombre}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.proveedor?.nombre ? (
                          <Badge variant="outline">{item.proveedor.nombre}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.updated_at).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => openEdit(item)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => openDelete(item)}
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
          )}
          {!isLoading && meta.total > 0 && (
            <Pagination
              meta={meta}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
            />
          )}
        </div>
      </div>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Ítem" : "Nuevo Ítem"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del ítem"
                : "Agrega un nuevo material al inventario"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                placeholder="Ej: Guantes de látex"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  min="0"
                  value={form.cantidad}
                  onChange={(e) =>
                    setForm({ ...form, cantidad: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock_min">Stock Mínimo</Label>
                <Input
                  id="stock_min"
                  type="number"
                  min="0"
                  value={form.stock_min}
                  onChange={(e) =>
                    setForm({ ...form, stock_min: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proveedor_id">Proveedor</Label>
              <Select
                value={form.proveedor_id || "__none__"}
                onValueChange={(v: string | null) => setForm({ ...form, proveedor_id: v === "__none__" ? "" : v || "" })}
              >
                <SelectTrigger>
                  <span className={form.proveedor_id ? "" : "text-muted-foreground"}>
                    {proveedores.find((p) => p.id === form.proveedor_id)?.nombre || "Seleccionar proveedor"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin proveedor</SelectItem>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="categoria_id">Categoría</Label>
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
              <Select
                value={form.categoria_id || "__none__"}
                onValueChange={(v: string | null) => setForm({ ...form, categoria_id: v === "__none__" ? "" : v || "" })}
              >
                <SelectTrigger>
                  <span className={form.categoria_id ? "" : "text-muted-foreground"}>
                    {categorias.find((c) => c.id === form.categoria_id)?.nombre || "Seleccionar categoría"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin categoría</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              Se eliminará <strong>{deleting?.nombre}</strong> del inventario.
              Esta acción no se puede deshacer.
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
              Creá una categoría para organizar tu inventario
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="catName">Nombre *</Label>
              <Input
                id="catName"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej: Materiales desechables"
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
