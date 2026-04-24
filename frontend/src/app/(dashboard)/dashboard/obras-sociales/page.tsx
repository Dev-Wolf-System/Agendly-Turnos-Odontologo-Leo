"use client";

import { useEffect, useState, useCallback } from "react";
import obrasSocialesService, {
  ObraSocial,
  CreateObraSocialPayload,
} from "@/services/obras-sociales.service";
import pagosService, { Pago } from "@/services/pagos.service";
import type { PaginationMeta } from "@/services/pacientes.service";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Building2,
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";

function formatFecha(d: string) {
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatMonto(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n);
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400" },
  aprobado:  { label: "Aprobado",  className: "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" },
  rechazado: { label: "Rechazado", className: "border-red-300 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400" },
};

export default function ObrasSocialesPage() {
  const [activeTab, setActiveTab] = useState<"catalogo" | "prestaciones">("catalogo");

  // ── Catálogo ──────────────────────────────────────────────────
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [loadingOS, setLoadingOS] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingOS, setEditingOS] = useState<ObraSocial | null>(null);
  const [deletingOS, setDeletingOS] = useState<ObraSocial | null>(null);
  const [isSavingOS, setIsSavingOS] = useState(false);
  const emptyForm = { nombre: "", codigo: "", url: "", telefono: "", email: "", activo: true };
  const [osForm, setOsForm] = useState(emptyForm);

  const loadCatalogo = useCallback(async () => {
    setLoadingOS(true);
    try {
      setObrasSociales(await obrasSocialesService.getAll());
    } catch {
      toast.error("Error al cargar catálogo");
    } finally {
      setLoadingOS(false);
    }
  }, []);

  useEffect(() => { loadCatalogo(); }, [loadCatalogo]);

  const openCreateOS = () => { setEditingOS(null); setOsForm(emptyForm); setDialogOpen(true); };
  const openEditOS = (os: ObraSocial) => {
    setEditingOS(os);
    setOsForm({ nombre: os.nombre, codigo: os.codigo ?? "", url: os.url ?? "", telefono: os.telefono ?? "", email: os.email ?? "", activo: os.activo });
    setDialogOpen(true);
  };

  const handleSubmitOS = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOS(true);
    try {
      const payload: CreateObraSocialPayload = {
        nombre: osForm.nombre,
        codigo: osForm.codigo || undefined,
        url: osForm.url || undefined,
        telefono: osForm.telefono || undefined,
        email: osForm.email || undefined,
        activo: osForm.activo,
      };
      if (editingOS) {
        await obrasSocialesService.update(editingOS.id, payload);
        toast.success("Obra social actualizada");
      } else {
        await obrasSocialesService.create(payload);
        toast.success("Obra social creada");
      }
      setDialogOpen(false);
      loadCatalogo();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message ?? "Error al guardar";
      toast.error(Array.isArray(msg) ? msg[0] : (msg as string));
    } finally {
      setIsSavingOS(false);
    }
  };

  const handleDeleteOS = async () => {
    if (!deletingOS) return;
    try {
      await obrasSocialesService.delete(deletingOS.id);
      toast.success("Obra social eliminada");
      setDeleteDialogOpen(false);
      setDeletingOS(null);
      loadCatalogo();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const handleToggleActive = async (os: ObraSocial) => {
    try {
      await obrasSocialesService.update(os.id, { activo: !os.activo });
      loadCatalogo();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  // ── Prestaciones ──────────────────────────────────────────────
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [pagosMeta, setPagosMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [pagosPage, setPagosPage] = useState(1);
  const [loadingPagos, setLoadingPagos] = useState(false);
  const [filtroOS, setFiltroOS] = useState("all");
  const [filtroEstado, setFiltroEstado] = useState("all");
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const loadPrestaciones = useCallback(async () => {
    setLoadingPagos(true);
    try {
      const filters: Record<string, string> = { fuente_pago: "obra_social" };
      if (filtroOS !== "all") filters.obra_social_id = filtroOS;
      if (filtroEstado !== "all") filters.estado = filtroEstado;
      if (filtroDesde) filters.desde = filtroDesde;
      if (filtroHasta) filters.hasta = filtroHasta;
      const result = await pagosService.getAll(filters as any, { page: pagosPage, limit: 20 });
      setPagos(result.data);
      setPagosMeta(result.meta);
    } catch {
      toast.error("Error al cargar prestaciones");
    } finally {
      setLoadingPagos(false);
    }
  }, [filtroOS, filtroEstado, filtroDesde, filtroHasta, pagosPage]);

  useEffect(() => {
    if (activeTab === "prestaciones") loadPrestaciones();
  }, [activeTab, loadPrestaciones]);

  // KPIs de prestaciones
  const kpiCobrado = pagos.filter(p => p.estado === "aprobado").reduce((s, p) => s + Number(p.total ?? 0), 0);
  const kpiPendiente = pagos.filter(p => p.estado === "pendiente").reduce((s, p) => s + Number(p.total ?? 0), 0);
  const kpiTotal = pagosMeta.total;

  const tabs = [
    { key: "catalogo" as const, label: "Catálogo", icon: Building2 },
    { key: "prestaciones" as const, label: "Prestaciones", icon: FileText },
  ];

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Obras Sociales</h1>
          <p className="text-sm text-muted-foreground mt-1">Catálogo de coberturas y cuenta corriente de prestaciones</p>
        </div>
        {activeTab === "catalogo" && (
          <Button
            onClick={openCreateOS}
            className="gap-2 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white shadow-[var(--shadow-primary)]"
          >
            <Plus className="h-4 w-4" />
            Nueva Obra Social
          </Button>
        )}
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-xl bg-muted/50 border border-[var(--border-light)] p-1 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === t.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── CATÁLOGO ── */}
      {activeTab === "catalogo" && (
        <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
          <div className="px-6 pt-6 pb-4">
            <p className="text-sm text-muted-foreground">
              {obrasSociales.length} obra{obrasSociales.length !== 1 ? "s" : ""} social{obrasSociales.length !== 1 ? "es" : ""} registrada{obrasSociales.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="px-6 pb-6">
            {loadingOS ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 rounded-lg bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : obrasSociales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted mb-4">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold">Sin obras sociales configuradas</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Registrá las obras sociales y prepagas que atiendés para facilitar la gestión de pacientes.
                </p>
                <Button onClick={openCreateOS} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Agregar obra social
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {obrasSociales.map((os) => (
                  <div key={os.id} className="flex items-center justify-between p-4 rounded-lg border bg-background hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${os.activo ? "bg-emerald-100 dark:bg-emerald-950/40" : "bg-muted"}`}>
                        <Shield className={`h-4 w-4 ${os.activo ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{os.nombre}</p>
                        <div className="flex gap-3 mt-0.5 flex-wrap">
                          {os.codigo && <span className="text-xs text-muted-foreground">Cód: {os.codigo}</span>}
                          {os.telefono && <span className="text-xs text-muted-foreground">Tel: {os.telefono}</span>}
                          {os.email && <span className="text-xs text-muted-foreground">{os.email}</span>}
                          {!os.activo && <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Inactiva</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={os.activo} onCheckedChange={() => handleToggleActive(os)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" onClick={() => openEditOS(os)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => { setDeletingOS(os); setDeleteDialogOpen(true); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PRESTACIONES ── */}
      {activeTab === "prestaciones" && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard label="Total cobrado OS" value={formatMonto(kpiCobrado)} icon={<CheckCircle2 className="h-5 w-5" />} variant="accent" />
            <KpiCard label="Pendiente cobro" value={formatMonto(kpiPendiente)} icon={<Clock className="h-5 w-5" />} variant="warm" />
            <KpiCard label="Prestaciones (página)" value={kpiTotal} icon={<DollarSign className="h-5 w-5" />} variant="primary" />
          </div>

          {/* Filtros */}
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] p-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filtros
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Obra social</span>
                <Select value={filtroOS} onValueChange={(v) => { setFiltroOS(v ?? "all"); setPagosPage(1); }}>
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las obras sociales</SelectItem>
                    {obrasSociales.map((os) => (
                      <SelectItem key={os.id} value={os.id}>{os.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Estado</span>
                <Select value={filtroEstado} onValueChange={(v) => { setFiltroEstado(v ?? "all"); setPagosPage(1); }}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Desde</span>
                <Input type="date" value={filtroDesde} onChange={(e) => { setFiltroDesde(e.target.value); setPagosPage(1); }} className="w-36" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Hasta</span>
                <Input type="date" value={filtroHasta} onChange={(e) => { setFiltroHasta(e.target.value); setPagosPage(1); }} className="w-36" />
              </div>
              {(filtroOS !== "all" || filtroEstado !== "all" || filtroDesde || filtroHasta) && (
                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setFiltroOS("all"); setFiltroEstado("all"); setFiltroDesde(""); setFiltroHasta(""); setPagosPage(1); }}>
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Tabla */}
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] overflow-hidden">
            {loadingPagos ? (
              <div className="space-y-2 p-4">
                {[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-muted/40 animate-pulse" />)}
              </div>
            ) : pagos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                <FileText className="h-10 w-10 mb-3 opacity-30" />
                <p className="font-medium">Sin prestaciones registradas</p>
                <p className="text-sm mt-0.5">No hay pagos de obra social con los filtros actuales</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Obra Social</TableHead>
                      <TableHead>Tratamiento</TableHead>
                      <TableHead>Cód. Prestación</TableHead>
                      <TableHead>Nro. Autorización</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagos.map((pago) => {
                      const cfg = estadoConfig[pago.estado] ?? { label: pago.estado, className: "" };
                      return (
                        <TableRow key={pago.id}>
                          <TableCell className="text-sm whitespace-nowrap">{formatFecha(pago.created_at)}</TableCell>
                          <TableCell className="text-sm">
                            {pago.turno?.paciente
                              ? `${pago.turno.paciente.nombre} ${pago.turno.paciente.apellido}`
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm">{pago.obra_social_nombre || "—"}</TableCell>
                          <TableCell className="text-sm">{pago.turno?.tipo_tratamiento || "—"}</TableCell>
                          <TableCell className="text-sm font-mono">{pago.codigo_prestacion || "—"}</TableCell>
                          <TableCell className="text-sm font-mono">{pago.nro_autorizacion || "—"}</TableCell>
                          <TableCell className="text-sm font-semibold text-right whitespace-nowrap">
                            {pago.total != null ? formatMonto(Number(pago.total)) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-xs capitalize ${cfg.className}`}>
                              {cfg.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {!loadingPagos && pagosMeta.total > 0 && (
            <Pagination meta={pagosMeta} onPageChange={setPagosPage} onLimitChange={() => {}} />
          )}
        </div>
      )}

      {/* Dialog crear/editar OS */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{editingOS ? "Editar Obra Social" : "Nueva Obra Social"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitOS} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="os-nombre">Nombre *</Label>
              <Input id="os-nombre" value={osForm.nombre} onChange={(e) => setOsForm({ ...osForm, nombre: e.target.value })} required placeholder="OSDE, Swiss Medical, IOMA..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="os-codigo">Código</Label>
                <Input id="os-codigo" value={osForm.codigo} onChange={(e) => setOsForm({ ...osForm, codigo: e.target.value })} placeholder="Ej: 401" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="os-telefono">Teléfono</Label>
                <Input id="os-telefono" value={osForm.telefono} onChange={(e) => setOsForm({ ...osForm, telefono: e.target.value })} placeholder="0800-xxx-xxxx" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="os-email">Email</Label>
              <Input id="os-email" type="email" value={osForm.email} onChange={(e) => setOsForm({ ...osForm, email: e.target.value })} placeholder="contacto@obrasocial.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="os-url">Sitio web</Label>
              <Input id="os-url" value={osForm.url} onChange={(e) => setOsForm({ ...osForm, url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="os-activo" checked={osForm.activo} onCheckedChange={(v) => setOsForm({ ...osForm, activo: v })} />
              <Label htmlFor="os-activo">Activa</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSavingOS}>{isSavingOS ? "Guardando..." : "Guardar"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog eliminar OS */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Eliminar Obra Social</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <strong>{deletingOS?.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteOS}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
