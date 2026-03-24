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
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Proveedor {
  id: string;
  clinica_id: string;
  nombre: string;
  contacto: string | null;
  email: string | null;
  cel: string | null;
  created_at: string;
}

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Proveedor | null>(null);
  const [deleting, setDeleting] = useState<Proveedor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    contacto: "",
    email: "",
    cel: "",
  });

  const loadProveedores = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get<Proveedor[]>("/proveedores");
      setProveedores(data);
    } catch {
      toast.error("Error al cargar proveedores");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProveedores();
  }, [loadProveedores]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: "", contacto: "", email: "", cel: "" });
    setDialogOpen(true);
  };

  const openEdit = (prov: Proveedor) => {
    setEditing(prov);
    setForm({
      nombre: prov.nombre || "",
      contacto: prov.contacto || "",
      email: prov.email || "",
      cel: prov.cel || "",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestiona tus proveedores de materiales
          </p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Proveedor</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            Directorio de proveedores de la clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : proveedores.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <p>No hay proveedores registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Celular</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedores.map((prov) => (
                  <TableRow key={prov.id}>
                    <TableCell className="font-medium">
                      {prov.nombre}
                    </TableCell>
                    <TableCell>{prov.contacto || "—"}</TableCell>
                    <TableCell>{prov.email || "—"}</TableCell>
                    <TableCell>{prov.cel || "—"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(prov)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => openDelete(prov)}
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
              {editing ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del proveedor"
                : "Registra un nuevo proveedor"}
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
                placeholder="Nombre del proveedor"
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cel">Celular</Label>
                <Input
                  id="cel"
                  value={form.cel}
                  onChange={(e) => setForm({ ...form, cel: e.target.value })}
                />
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
    </div>
  );
}
