"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
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
  updated_at: string;
  proveedor?: Proveedor | null;
}

export default function InventarioPage() {
  const [items, setItems] = useState<InventarioItem[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InventarioItem | null>(null);
  const [deleting, setDeleting] = useState<InventarioItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    cantidad: "",
    stock_min: "",
    proveedor_id: "",
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [invRes, provRes] = await Promise.all([
        api.get<InventarioItem[]>("/inventario"),
        api.get<Proveedor[]>("/proveedores"),
      ]);
      setItems(invRes.data);
      setProveedores(provRes.data);
    } catch {
      toast.error("Error al cargar inventario");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: "", cantidad: "", stock_min: "", proveedor_id: "" });
    setDialogOpen(true);
  };

  const openEdit = (item: InventarioItem) => {
    setEditing(item);
    setForm({
      nombre: item.nombre || "",
      cantidad: item.cantidad?.toString() || "",
      stock_min: item.stock_min?.toString() || "",
      proveedor_id: item.proveedor_id || "",
    });
    setDialogOpen(true);
  };

  const openDelete = (item: InventarioItem) => {
    setDeleting(item);
    setDeleteDialogOpen(true);
  };

  const isLowStock = (item: InventarioItem) =>
    item.stock_min != null &&
    item.cantidad != null &&
    item.cantidad <= item.stock_min;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
          <p className="text-muted-foreground">
            Controla el stock de materiales de tu clínica
          </p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Ítem</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock de Materiales</CardTitle>
          <CardDescription>
            Los ítems con stock bajo se marcan en rojo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>No hay ítems en el inventario</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Stock Mínimo</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nombre}
                    </TableCell>
                    <TableCell>
                      {isLowStock(item) ? (
                        <Badge variant="destructive">
                          {item.cantidad}
                        </Badge>
                      ) : (
                        item.cantidad ?? "—"
                      )}
                    </TableCell>
                    <TableCell>{item.stock_min ?? "—"}</TableCell>
                    <TableCell>
                      {item.proveedor?.nombre || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.updated_at).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(item)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(item)}
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
                value={form.proveedor_id || undefined}
                onValueChange={(v: string | null) => setForm({ ...form, proveedor_id: v || "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {proveedores.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              Se eliminará <strong>{deleting?.nombre}</strong> del inventario.
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
