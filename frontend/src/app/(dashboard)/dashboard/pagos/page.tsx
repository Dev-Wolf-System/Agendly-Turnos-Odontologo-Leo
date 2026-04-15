"use client";

import { useEffect, useState, useCallback } from "react";
import { RoleGuard } from "@/components/guards/role-guard";
import { useAuth } from "@/components/providers/auth-provider";
import Link from "next/link";
import pagosService, {
  Pago,
  PagoFilters,
  PagoResumen,
  EstadoPago,
} from "@/services/pagos.service";
import type { PaginationMeta } from "@/services/pacientes.service";
import { Pagination } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import turnosService, { Turno, TRATAMIENTOS_LABELS } from "@/services/turnos.service";
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
import { TableSkeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Pencil,
  Trash2,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Banknote,
  CreditCard,
  ArrowRightLeft,
  Smartphone,
  Download,
  Search,
  TrendingUp,
  Receipt,
  AlertTriangle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { StatusBadge } from "@/components/ui/status-badge";

/* ─── Constantes ─── */

const METHOD_CONFIG: Record<
  string,
  { label: string; icon: typeof Banknote; color: string; chartColor: string }
> = {
  efectivo: {
    label: "Efectivo",
    icon: Banknote,
    color: "text-green-600",
    chartColor: "#22c55e",
  },
  mercadopago: {
    label: "MercadoPago",
    icon: Smartphone,
    color: "text-sky-600",
    chartColor: "#0ea5e9",
  },
  transferencia: {
    label: "Transferencia",
    icon: ArrowRightLeft,
    color: "text-[var(--ht-accent)]",
    chartColor: "#8b5cf6",
  },
  tarjeta: {
    label: "Tarjeta",
    icon: CreditCard,
    color: "text-orange-600",
    chartColor: "#f97316",
  },
};

/* ─── Helpers ─── */

function formatCurrency(value: number | null) {
  if (value == null) return "—";
  return `$${Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function exportCSV(pagos: Pago[]) {
  const header =
    "Fecha,Paciente,Profesional,Turno,Tratamiento,Total,Método,Estado";
  const rows = pagos.map((p) => {
    const paciente = p.turno?.paciente
      ? `${p.turno.paciente.nombre} ${p.turno.paciente.apellido}`
      : "";
    const profesional = p.turno?.user
      ? `${p.turno.user.nombre} ${p.turno.user.apellido}`
      : "";
    const turno = p.turno?.start_time
      ? `${formatDate(p.turno.start_time)} ${formatTime(p.turno.start_time)}`
      : "";
    const tratamiento = p.turno?.tipo_tratamiento
      ? TRATAMIENTOS_LABELS[p.turno.tipo_tratamiento] ||
        p.turno.tipo_tratamiento
      : "";
    const total = p.total != null ? p.total.toString() : "";
    const method = METHOD_CONFIG[p.method || ""]?.label || p.method || "";
    return `${formatDate(p.created_at)},"${paciente}","${profesional}","${turno}","${tratamiento}",${total},${method},${p.estado}`;
  });
  const csv = [header, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pagos_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Componente ─── */

export default function PagosPage() {
  return (
    <RoleGuard allowedRoles={["admin", "assistant"]}>
      <PagosContent />
    </RoleGuard>
  );
}

function PagosContent() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [resumen, setResumen] = useState<PagoResumen | null>(null);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Pago | null>(null);
  const [editing, setEditing] = useState<Pago | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("all");
  const [filtroMethod, setFiltroMethod] = useState<string>("all");
  const [filtroDesde, setFiltroDesde] = useState<string>("");
  const [filtroHasta, setFiltroHasta] = useState<string>("");
  const [filtroPaciente, setFiltroPaciente] = useState<string>("");

  const [form, setForm] = useState({
    turno_id: "",
    total: "",
    method: "",
    estado: "pendiente" as EstadoPago,
  });

  const buildFilters = useCallback((): PagoFilters => {
    const filters: PagoFilters = {};
    if (filtroEstado !== "all") filters.estado = filtroEstado as EstadoPago;
    if (filtroMethod !== "all") filters.method = filtroMethod;
    if (filtroDesde) filters.desde = filtroDesde;
    if (filtroHasta) filters.hasta = filtroHasta;
    return filters;
  }, [filtroEstado, filtroMethod, filtroDesde, filtroHasta]);

  const loadPagos = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters = buildFilters();
      const [pagosResult, resumenData] = await Promise.all([
        pagosService.getAll(filters, { page, limit, sortBy, sortOrder }),
        pagosService.getResumen({
          desde: filters.desde,
          hasta: filters.hasta,
        }),
      ]);
      setPagos(pagosResult.data);
      setMeta(pagosResult.meta);
      setResumen(resumenData);
    } catch {
      toast.error("Error al cargar pagos");
    } finally {
      setIsLoading(false);
    }
  }, [buildFilters, page, limit, sortBy, sortOrder]);

  const handleSort = (field: string, order: "ASC" | "DESC") => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  const loadTurnos = useCallback(async () => {
    try {
      const data = await turnosService.getAll({});
      setTurnos(data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    loadPagos();
  }, [loadPagos]);

  useEffect(() => {
    loadTurnos();
  }, [loadTurnos]);

  const openCreate = () => {
    setEditing(null);
    setForm({ turno_id: "", total: "", method: "", estado: "pendiente" });
    setDialogOpen(true);
  };

  const openEdit = (pago: Pago) => {
    setEditing(pago);
    setForm({
      turno_id: pago.turno_id,
      total: pago.total?.toString() || "",
      method: pago.method || "",
      estado: pago.estado,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        await pagosService.update(editing.id, {
          total: form.total ? parseFloat(form.total) : undefined,
          method: form.method || undefined,
          estado: form.estado,
        });
        toast.success("Pago actualizado");
      } else {
        await pagosService.create({
          turno_id: form.turno_id,
          total: form.total ? parseFloat(form.total) : undefined,
          method: form.method || undefined,
        });
        toast.success("Pago registrado");
      }
      setDialogOpen(false);
      loadPagos();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al guardar pago";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await pagosService.delete(deleteDialog.id);
      toast.success("Pago eliminado");
      setDeleteDialog(null);
      loadPagos();
    } catch {
      toast.error("Error al eliminar pago");
    }
  };

  const handleQuickStatus = async (pago: Pago, estado: EstadoPago) => {
    try {
      await pagosService.update(pago.id, { estado });
      toast.success(
        estado === "aprobado" ? "Pago aprobado" : "Pago rechazado"
      );
      loadPagos();
    } catch {
      toast.error("Error al actualizar estado");
    }
  };

  const clearFilters = () => {
    setFiltroEstado("all");
    setFiltroMethod("all");
    setFiltroDesde("");
    setFiltroHasta("");
    setFiltroPaciente("");
    setPage(1);
  };

  const hasFilters =
    filtroEstado !== "all" ||
    filtroMethod !== "all" ||
    filtroDesde ||
    filtroHasta ||
    filtroPaciente;

  // Filtro local por paciente (nombre)
  const pagosFiltrados = filtroPaciente
    ? pagos.filter((p) => {
        const nombre =
          `${p.turno?.paciente?.nombre || ""} ${p.turno?.paciente?.apellido || ""}`.toLowerCase();
        return nombre.includes(filtroPaciente.toLowerCase());
      })
    : pagos;

  // Datos para gráfico de dona (distribución por método)
  const chartData =
    resumen?.por_metodo
      .filter((m) => m.cantidad > 0)
      .map((m) => ({
        name: METHOD_CONFIG[m.method]?.label || m.method,
        value: m.total,
        cantidad: m.cantidad,
        color: METHOD_CONFIG[m.method]?.chartColor || "#94a3b8",
      })) || [];

  // Estadísticas derivadas
  const totalAprobados = resumen?.total || 0;
  const cantPendientes = pagos.filter((p) => p.estado === "pendiente").length;
  const totalPendientes = pagos
    .filter((p) => p.estado === "pendiente")
    .reduce((s, p) => s + (Number(p.total) || 0), 0);
  const cantRechazados = pagos.filter((p) => p.estado === "rechazado").length;
  const totalRechazados = pagos
    .filter((p) => p.estado === "rechazado")
    .reduce((s, p) => s + (Number(p.total) || 0), 0);
  const ticketPromedio =
    resumen && resumen.cantidad > 0
      ? resumen.total / resumen.cantidad
      : 0;

  return (
    <div className="animate-page-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground">
            Gestiona los pagos y facturación
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCSV(pagosFiltrados)}
            disabled={pagosFiltrados.length === 0}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Exportar CSV
          </Button>
          <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white shadow-[var(--shadow-primary)] hover:shadow-md transition-all"
        >
          + Nuevo Pago
        </Button>
        </div>
      </div>

      {/* KPIs Row */}
      {resumen && (
        <div className={`grid gap-4 grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
          <KpiCard
            label={isAdmin ? "Ingresos Aprobados" : "Pagos Aprobados"}
            value={isAdmin ? formatCurrency(totalAprobados) : resumen.cantidad}
            sub={`${resumen.cantidad} pago${resumen.cantidad !== 1 ? "s" : ""} aprobado${resumen.cantidad !== 1 ? "s" : ""}`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            variant="accent"
          />
          <KpiCard
            label="Pendientes"
            value={isAdmin ? formatCurrency(totalPendientes) : cantPendientes}
            sub={`${cantPendientes} pago${cantPendientes !== 1 ? "s" : ""} por aprobar`}
            icon={<Clock className="h-5 w-5" />}
            variant="warm"
          />
          <KpiCard
            label="Rechazados"
            value={isAdmin ? formatCurrency(totalRechazados) : cantRechazados}
            sub={`${cantRechazados} pago${cantRechazados !== 1 ? "s" : ""} rechazado${cantRechazados !== 1 ? "s" : ""}`}
            icon={<XCircle className="h-5 w-5" />}
            variant="danger"
          />
          {isAdmin && (
            <KpiCard
              label="Ticket Promedio"
              value={formatCurrency(ticketPromedio)}
              sub="promedio por pago aprobado"
              icon={<TrendingUp className="h-5 w-5" />}
              variant="primary"
            />
          )}
        </div>
      )}

      {/* Desglose por método + Gráfico — solo admin */}
      {isAdmin && resumen && resumen.por_metodo.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Distribución por método */}
          <div className="lg:col-span-2 rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
            <div className="px-6 pt-6 pb-3">
              <h2 className="text-base font-semibold">Desglose por Método de Pago</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Solo pagos aprobados</p>
            </div>
            <div className="px-6 pb-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {resumen.por_metodo.map((m) => {
                  const config = METHOD_CONFIG[m.method];
                  const Icon = config?.icon || CircleDollarSign;
                  const pct =
                    totalAprobados > 0
                      ? ((m.total / totalAprobados) * 100).toFixed(1)
                      : "0";
                  return (
                    <div
                      key={m.method}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border-light)] p-3 transition-colors hover:bg-muted/40"
                    >
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${config?.chartColor || "#94a3b8"}15`,
                        }}
                      >
                        <Icon
                          className="h-5 w-5"
                          style={{ color: config?.chartColor || "#94a3b8" }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {config?.label || m.method}
                          </span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(m.total)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {m.cantidad} pago{m.cantidad !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {pct}%
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                config?.chartColor || "#94a3b8",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfico Donut */}
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
            <div className="px-6 pt-6 pb-3">
              <h2 className="text-base font-semibold">Distribución</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Por método de pago</p>
            </div>
            <div className="px-6 pb-6 flex flex-col items-center justify-center">
              {chartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--background))",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {chartData.map((d) => (
                      <div
                        key={d.name}
                        className="flex items-center gap-1.5 text-xs"
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: d.color }}
                        />
                        {d.name}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Receipt className="h-8 w-8 mb-2 opacity-40" />
                  <span className="text-sm">Sin datos</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Pagos */}
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-0">
          <h2 className="text-base font-semibold">Lista de Pagos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {meta.total} pago{meta.total !== 1 ? "s" : ""} registrado
            {meta.total !== 1 ? "s" : ""}
          </p>

          {/* Filtros */}
          <div className="flex flex-wrap items-end gap-3 py-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Buscar paciente
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nombre..."
                  value={filtroPaciente}
                  onChange={(e) => setFiltroPaciente(e.target.value)}
                  className="w-44 pl-8"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Estado
              </span>
              <Select
                value={filtroEstado}
                onValueChange={(v: string | null) => {
                  v && setFiltroEstado(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-44">
                  <span>
                    {
                      {
                        all: "Todos los estados",
                        pendiente: "Pendiente",
                        aprobado: "Aprobado",
                        rechazado: "Rechazado",
                      }[filtroEstado]
                    }
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Método de pago
              </span>
              <Select
                value={filtroMethod}
                onValueChange={(v: string | null) => {
                  v && setFiltroMethod(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-44">
                  <span>
                    {
                      {
                        all: "Todos los métodos",
                        efectivo: "Efectivo",
                        mercadopago: "MercadoPago",
                        transferencia: "Transferencia",
                        tarjeta: "Tarjeta",
                      }[filtroMethod]
                    }
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="mercadopago">MercadoPago</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Desde
              </span>
              <Input
                type="date"
                value={filtroDesde}
                onChange={(e) => {
                  setFiltroDesde(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Hasta
              </span>
              <Input
                type="date"
                value={filtroHasta}
                onChange={(e) => {
                  setFiltroHasta(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              />
            </div>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="mb-0.5"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
        <div className="px-6 pb-6">
          {isLoading ? (
            <TableSkeleton rows={5} cols={9} />
          ) : pagosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-base font-medium">No hay pagos registrados</p>
              <p className="text-sm mt-1">
                {hasFilters
                  ? "Intenta ajustar los filtros para ver resultados"
                  : "Registra tu primer pago desde un turno o con el botón superior"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHeader
                    label="Fecha"
                    field="created_at"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Tratamiento</TableHead>
                  {isAdmin && <SortableHeader
                    label="Total"
                    field="total"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />}
                  <SortableHeader
                    label="Método"
                    field="method"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Estado"
                    field="estado"
                    currentSort={sortBy}
                    currentOrder={sortOrder}
                    onSort={handleSort}
                  />
                  <TableHead className="w-[140px] text-center">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagosFiltrados.map((pago) => {
                  const methodConf = METHOD_CONFIG[pago.method || ""];
                  const MethodIcon = methodConf?.icon || CircleDollarSign;

                  return (
                    <TableRow key={pago.id}>
                      <TableCell className="text-sm">
                        {formatDate(pago.created_at)}
                      </TableCell>
                      <TableCell>
                        {pago.turno?.paciente ? (
                          <Link
                            href={`/dashboard/pacientes/${pago.turno.paciente.id}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {pago.turno.paciente.nombre}{" "}
                            {pago.turno.paciente.apellido}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {pago.turno?.user
                          ? `${pago.turno.user.nombre} ${pago.turno.user.apellido}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {pago.turno?.start_time
                          ? `${formatDate(pago.turno.start_time)} ${formatTime(pago.turno.start_time)}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {pago.turno?.tipo_tratamiento
                          ? TRATAMIENTOS_LABELS[
                              pago.turno.tipo_tratamiento
                            ] || pago.turno.tipo_tratamiento
                          : "—"}
                      </TableCell>
                      {isAdmin && <TableCell className="font-semibold">
                        {formatCurrency(pago.total)}
                      </TableCell>}
                      <TableCell>
                        {pago.method ? (
                          <div className="flex items-center gap-1.5">
                            <MethodIcon
                              className={`h-3.5 w-3.5 ${methodConf?.color || "text-muted-foreground"}`}
                            />
                            <span className="text-sm">
                              {methodConf?.label || pago.method}
                            </span>
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={pago.estado} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-0.5">
                          {/* Acciones rápidas para pendientes */}
                          {pago.estado === "pendiente" && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all duration-200 hover:scale-110"
                                onClick={() =>
                                  handleQuickStatus(pago, "aprobado")
                                }
                                title="Aprobar pago"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-all duration-200 hover:scale-110"
                                onClick={() =>
                                  handleQuickStatus(pago, "rechazado")
                                }
                                title="Rechazar pago"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => openEdit(pago)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all duration-200 hover:scale-110"
                            onClick={() => setDeleteDialog(pago)}
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
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          )}
        </div>
      </div>

      {/* Dialog Crear/Editar Pago */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Editar Pago" : "Registrar Pago"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifica los datos del pago"
                : "Selecciona un turno y registra el pago"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="turno_id">Turno *</Label>
                <Select
                  value={form.turno_id}
                  onValueChange={(v: string | null) =>
                    setForm({ ...form, turno_id: v || "" })
                  }
                >
                  <SelectTrigger>
                    <span>
                      {form.turno_id
                        ? (() => {
                            const t = turnos.find((t) => t.id === form.turno_id);
                            if (!t) return "Seleccionar turno";
                            const pac = t.paciente
                              ? `${t.paciente.nombre} ${t.paciente.apellido}`
                              : "Sin paciente";
                            return `${pac} — ${formatDate(t.start_time)} ${formatTime(t.start_time)}`;
                          })()
                        : "Seleccionar turno"}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    {turnos.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.paciente
                          ? `${t.paciente.nombre} ${t.paciente.apellido}`
                          : "Sin paciente"}{" "}
                        — {formatDate(t.start_time)}{" "}
                        {formatTime(t.start_time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="total">Total ($) *</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Método de pago *</Label>
              <Select
                value={form.method}
                onValueChange={(v: string | null) =>
                  setForm({ ...form, method: v || "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_CONFIG).map(([key, conf]) => {
                    const Icon = conf.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${conf.color}`} />
                          {conf.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            {editing && (
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={form.estado}
                  onValueChange={(v: string | null) =>
                    v && setForm({ ...form, estado: v as EstadoPago })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  (!editing && !form.turno_id) ||
                  !form.total ||
                  !form.method
                }
              >
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Eliminar */}
      <Dialog
        open={!!deleteDialog}
        onOpenChange={(open) => !open && setDeleteDialog(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este pago de{" "}
              <span className="font-semibold text-foreground">
                {formatCurrency(deleteDialog?.total ?? null)}
              </span>
              {deleteDialog?.turno?.paciente && (
                <>
                  {" "}
                  de{" "}
                  <span className="font-semibold text-foreground">
                    {deleteDialog.turno.paciente.nombre}{" "}
                    {deleteDialog.turno.paciente.apellido}
                  </span>
                </>
              )}
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
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
