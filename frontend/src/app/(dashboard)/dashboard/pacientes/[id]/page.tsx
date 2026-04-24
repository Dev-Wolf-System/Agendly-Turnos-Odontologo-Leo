"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import pacientesService, {
  FichaPaciente,
  UpdatePacientePayload,
} from "@/services/pacientes.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/ui/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import archivosMedicosService, {
  ArchivoMedico,
} from "@/services/archivos-medicos.service";
import { Input } from "@/components/ui/input";
import { Dropzone } from "@/components/ui/dropzone";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  ClipboardPlus,
  Phone,
  Mail,
  CreditCard,
  Activity,
  Clock,
  DollarSign,
  AlertCircle,
  Stethoscope,
  User,
  FileText,
  Upload,
  Download,
  Trash2,
  FileImage,
  File,
  Paperclip,
  Pencil,
  Shield,
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

function formatFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFechaCorta(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

function formatHora(fecha: string): string {
  return new Date(fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMonto(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(monto);
}

const estadoConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
  pendiente: { variant: "outline", className: "border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800" },
  confirmado: { variant: "default", className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800" },
  completado: { variant: "secondary", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  cancelado: { variant: "destructive", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
  aprobado: { variant: "default", className: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800" },
  rechazado: { variant: "destructive", className: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800" },
};

function EstadoBadge({ estado }: { estado: string }) {
  const config = estadoConfig[estado] || { variant: "outline" as const, className: "" };
  return (
    <Badge variant={config.variant} className={`text-xs font-medium capitalize ${config.className}`}>
      {estado}
    </Badge>
  );
}

const gradients = [
  "from-[var(--ht-primary-light)] to-[var(--ht-accent-dark)]",
  "from-blue-500 to-cyan-500",
  "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-500",
  "from-[var(--ht-primary)] to-blue-600",
];

function getGradient(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

export default function FichaPacientePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [ficha, setFicha] = useState<FichaPaciente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [archivos, setArchivos] = useState<ArchivoMedico[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [archivoCategoria, setArchivoCategoria] = useState("");
  const [archivoNotas, setArchivoNotas] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    nombre: "", apellido: "", dni: "", cel: "", email: "",
    fecha_nacimiento: "", obra_social: "", nro_afiliado: "", plan_os: "",
  });

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    Promise.all([
      pacientesService.getFicha(id),
      archivosMedicosService.getByPaciente(id).catch(() => []),
    ])
      .then(([fichaData, archivosData]) => {
        setFicha(fichaData);
        setArchivos(archivosData);
      })
      .catch(() => toast.error("Error al cargar la ficha del paciente"))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleUploadArchivo = async (file: File) => {
    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("archivo", file);
      formData.append("paciente_id", id);
      if (archivoCategoria) formData.append("categoria", archivoCategoria);
      if (archivoNotas) formData.append("notas", archivoNotas);
      const nuevo = await archivosMedicosService.upload(formData);
      setArchivos((prev) => [nuevo, ...prev]);
      setArchivoCategoria("");
      setArchivoNotas("");
      toast.success("Archivo subido correctamente");
    } catch {
      toast.error("Error al subir el archivo");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleDescargarArchivo = async (archivo: ArchivoMedico) => {
    try {
      const url = await archivosMedicosService.getSignedUrl(archivo.id);
      window.open(url, "_blank");
    } catch {
      toast.error("Error al obtener el archivo");
    }
  };

  const handleEliminarArchivo = async (archivoId: string) => {
    try {
      await archivosMedicosService.delete(archivoId);
      setArchivos((prev) => prev.filter((a) => a.id !== archivoId));
      toast.success("Archivo eliminado");
    } catch {
      toast.error("Error al eliminar el archivo");
    }
  };

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getFileIcon(mime: string | null) {
    if (mime?.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (mime === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
  }

  const openEditPaciente = () => {
    if (!ficha) return;
    const p = ficha.paciente;
    setEditForm({
      nombre: p.nombre, apellido: p.apellido, dni: p.dni,
      cel: p.cel || "", email: p.email || "",
      fecha_nacimiento: p.fecha_nacimiento || "",
      obra_social: p.obra_social || "", nro_afiliado: p.nro_afiliado || "",
      plan_os: p.plan_os || "",
    });
    setEditDialogOpen(true);
  };

  const handleSavePaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ficha) return;
    setIsSavingEdit(true);
    try {
      const payload: UpdatePacientePayload = {
        nombre: editForm.nombre, apellido: editForm.apellido,
        dni: editForm.dni || undefined, cel: editForm.cel || undefined,
        email: editForm.email || undefined,
        fecha_nacimiento: editForm.fecha_nacimiento || undefined,
        obra_social: editForm.obra_social || undefined,
        nro_afiliado: editForm.nro_afiliado || undefined,
        plan_os: editForm.plan_os || undefined,
      };
      const updated = await pacientesService.update(ficha.paciente.id, payload);
      setFicha({ ...ficha, paciente: updated });
      setEditDialogOpen(false);
      toast.success("Paciente actualizado");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al actualizar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-page-in space-y-6 p-1">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mb-4">
          <User className="h-8 w-8" />
        </div>
        <p className="text-lg font-medium">Paciente no encontrado</p>
        <p className="text-sm text-muted-foreground mt-1">No se pudo acceder a la ficha de este paciente</p>
        <Button
          variant="outline"
          className="mt-6 rounded-xl"
          onClick={() => router.push("/dashboard/pacientes")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Pacientes
        </Button>
      </div>
    );
  }

  const { paciente, proximosTurnos, historialTurnos, historialMedico, pagos, kpis } = ficha;
  const gradient = getGradient(paciente.id);

  return (
    <div className="space-y-6 p-1">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-xl border bg-card">
        {/* Background decoration */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.04] dark:opacity-[0.08]`} />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-muted-foreground hover:text-foreground rounded-xl"
            onClick={() => router.push("/dashboard/pacientes")}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Pacientes
          </Button>

          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar */}
            <div className={`shrink-0 w-20 h-20 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
              <span className="text-2xl font-bold text-white">
                {getInitials(paciente.nombre, paciente.apellido)}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {paciente.nombre} {paciente.apellido}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      DNI: {paciente.dni}
                    </span>
                    {paciente.fecha_nacimiento && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {calcularEdad(paciente.fecha_nacimiento)}
                      </span>
                    )}
                    {paciente.cel && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {paciente.cel}
                      </span>
                    )}
                    {paciente.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {paciente.email}
                      </span>
                    )}
                    {paciente.obra_social ? (
                      <span className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <Shield className="h-3 w-3" />
                          {paciente.obra_social}
                          {paciente.plan_os ? ` · ${paciente.plan_os}` : ""}
                          {paciente.nro_afiliado ? ` — #${paciente.nro_afiliado}` : ""}
                        </span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted/50 border border-border px-2 py-0.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          Particular
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <Link href={`/dashboard/turnos?paciente_id=${id}`}>
                    <Button size="sm" className="rounded-xl gap-1.5 shadow-sm">
                      <CalendarPlus className="h-4 w-4" />
                      Nuevo Turno
                    </Button>
                  </Link>
                  <Link href={`/dashboard/historial-medico?paciente_id=${id}`}>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                      <ClipboardPlus className="h-4 w-4" />
                      Agregar Historial
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={openEditPaciente}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total Turnos"
          value={kpis.totalTurnos}
          icon={<Calendar className="h-5 w-5" />}
          variant="primary"
        />
        <KpiCard
          label="Último Turno"
          value={kpis.ultimoTurno ? formatFecha(kpis.ultimoTurno) : "—"}
          icon={<Clock className="h-5 w-5" />}
          variant="accent"
        />
        <KpiCard
          label="Total Pagado"
          value={formatMonto(kpis.totalPagado)}
          icon={<DollarSign className="h-5 w-5" />}
          variant="warm"
        />
        <KpiCard
          label="Saldo Pendiente"
          value={formatMonto(kpis.saldoPendiente)}
          icon={<AlertCircle className="h-5 w-5" />}
          variant={kpis.saldoPendiente > 0 ? "danger" : "accent"}
        />
      </div>

      {/* Últimos Procedimientos - Timeline */}
      {historialMedico.length > 0 && (
        <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--ht-primary)]/10 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-[var(--ht-primary)]" />
              </div>
              <h2 className="text-base font-semibold">Últimos Procedimientos</h2>
            </div>
          </div>
          <div className="px-5 pb-5">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

              <div className="space-y-4">
                {historialMedico.slice(0, 5).map((h, idx) => (
                  <div key={h.id} className="relative flex gap-4 pl-1">
                    {/* Timeline dot */}
                    <div className={`relative z-10 w-[22px] h-[22px] rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                      idx === 0
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/30 bg-background"
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-4 ${idx === historialMedico.slice(0, 5).length - 1 ? "pb-0" : ""}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="font-medium text-sm leading-tight">
                            {h.tratamiento || "Sin tratamiento registrado"}
                          </p>
                          {h.diagnostico && (
                            <p className="text-sm text-muted-foreground">
                              Dx: {h.diagnostico}
                            </p>
                          )}
                          {h.observaciones && (
                            <p className="text-xs text-muted-foreground/80 mt-1">
                              {h.observaciones}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-md">
                          {formatFechaCorta(h.fecha)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="proximos" className="space-y-4">
        <TabsList className="rounded-xl bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="proximos" className="rounded-lg data-[state=active]:shadow-sm gap-1.5 text-xs sm:text-sm">
            <CalendarPlus className="h-3.5 w-3.5 hidden sm:block" />
            Próximos ({proximosTurnos.length})
          </TabsTrigger>
          <TabsTrigger value="historial-turnos" className="rounded-lg data-[state=active]:shadow-sm gap-1.5 text-xs sm:text-sm">
            <Calendar className="h-3.5 w-3.5 hidden sm:block" />
            Historial ({historialTurnos.length})
          </TabsTrigger>
          <TabsTrigger value="historial-medico" className="rounded-lg data-[state=active]:shadow-sm gap-1.5 text-xs sm:text-sm">
            <Activity className="h-3.5 w-3.5 hidden sm:block" />
            Clínico ({historialMedico.length})
          </TabsTrigger>
          <TabsTrigger value="pagos" className="rounded-lg data-[state=active]:shadow-sm gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5 hidden sm:block" />
            Pagos ({pagos.length})
          </TabsTrigger>
          <TabsTrigger value="documentos" className="rounded-lg data-[state=active]:shadow-sm gap-1.5 text-xs sm:text-sm">
            <Paperclip className="h-3.5 w-3.5 hidden sm:block" />
            Documentos ({archivos.length})
          </TabsTrigger>
        </TabsList>

        {/* Próximos Turnos */}
        <TabsContent value="proximos">
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-0">
              {proximosTurnos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <CalendarPlus className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Sin turnos programados</p>
                  <p className="text-sm mt-0.5">Este paciente no tiene turnos futuros</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Hora</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Odontólogo</TableHead>
                        <TableHead className="font-semibold">Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {proximosTurnos.map((turno) => (
                        <TableRow key={turno.id} className="group">
                          <TableCell className="font-medium">{formatFecha(turno.start_time)}</TableCell>
                          <TableCell>{formatHora(turno.start_time)}</TableCell>
                          <TableCell><EstadoBadge estado={turno.estado} /></TableCell>
                          <TableCell>
                            {turno.profesional
                              ? `${turno.profesional.nombre} ${turno.profesional.apellido}`
                              : "—"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {turno.notas || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Historial de Turnos */}
        <TabsContent value="historial-turnos">
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-0">
              {historialTurnos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Sin historial de turnos</p>
                  <p className="text-sm mt-0.5">No hay turnos anteriores registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Hora</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Odontólogo</TableHead>
                        <TableHead className="font-semibold">Notas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historialTurnos.map((turno) => (
                        <TableRow key={turno.id} className="group">
                          <TableCell className="font-medium">{formatFecha(turno.start_time)}</TableCell>
                          <TableCell>{formatHora(turno.start_time)}</TableCell>
                          <TableCell><EstadoBadge estado={turno.estado} /></TableCell>
                          <TableCell>
                            {turno.profesional
                              ? `${turno.profesional.nombre} ${turno.profesional.apellido}`
                              : "—"}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-muted-foreground">
                            {turno.notas || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Historial Médico */}
        <TabsContent value="historial-medico">
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-0">
              {historialMedico.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <Activity className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Sin historial clínico</p>
                  <p className="text-sm mt-0.5">No hay registros médicos para este paciente</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Diagnóstico</TableHead>
                        <TableHead className="font-semibold">Tratamiento</TableHead>
                        <TableHead className="font-semibold">Observaciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historialMedico.map((h) => (
                        <TableRow key={h.id} className="group">
                          <TableCell className="font-medium whitespace-nowrap">{formatFecha(h.fecha)}</TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2">{h.diagnostico || "—"}</span>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2">{h.tratamiento || "—"}</span>
                          </TableCell>
                          <TableCell className="max-w-[220px]">
                            <span className="line-clamp-2 text-muted-foreground">{h.observaciones || "—"}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Pagos */}
        <TabsContent value="pagos">
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-0">
              {pagos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Sin pagos registrados</p>
                  <p className="text-sm mt-0.5">No hay pagos para este paciente</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Fecha</TableHead>
                        <TableHead className="font-semibold">Monto</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagos.map((pago) => (
                        <TableRow key={pago.id} className="group">
                          <TableCell className="font-medium">{formatFecha(pago.fecha)}</TableCell>
                          <TableCell className="font-semibold">
                            {formatMonto(pago.total)}
                          </TableCell>
                          <TableCell><EstadoBadge estado={pago.estado} /></TableCell>
                          <TableCell className="text-muted-foreground capitalize">{pago.method || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documentos">
          <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--ht-primary)]/10 flex items-center justify-center">
                  <Paperclip className="h-4 w-4 text-[var(--ht-primary)]" />
                </div>
                <h2 className="text-base font-semibold">Documentos Médicos</h2>
              </div>
            </div>
            <div className="px-5 pb-5 space-y-4">
              {/* Upload */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Categoría</Label>
                    <Select value={archivoCategoria} onValueChange={(v) => setArchivoCategoria(v ?? "")}>
                      <SelectTrigger className="rounded-lg h-9">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="radiografia">Radiografía</SelectItem>
                        <SelectItem value="estudio">Estudio</SelectItem>
                        <SelectItem value="receta">Receta</SelectItem>
                        <SelectItem value="consentimiento">Consentimiento</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Notas</Label>
                    <Input
                      className="rounded-lg h-9"
                      placeholder="Descripción breve..."
                      value={archivoNotas}
                      onChange={(e) => setArchivoNotas(e.target.value)}
                    />
                  </div>
                </div>
                <Dropzone
                  onFileSelected={handleUploadArchivo}
                  accept="image/*,.pdf,.dicom"
                  maxSizeMB={20}
                  isUploading={uploadingFile}
                  title="Arrastrá el archivo acá o hacé clic para seleccionar"
                />
              </div>

              {/* Lista */}
              {archivos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mb-3">
                    <Upload className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Sin documentos</p>
                  <p className="text-sm mt-0.5">Subí archivos para este paciente</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {archivos.map((archivo) => (
                    <div
                      key={archivo.id}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/30 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                        {getFileIcon(archivo.tipo_mime)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{archivo.nombre_archivo}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{formatFileSize(archivo.tamano_bytes)}</span>
                          {archivo.categoria && (
                            <>
                              <span>·</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 capitalize">
                                {archivo.categoria}
                              </Badge>
                            </>
                          )}
                          <span>·</span>
                          <span>{formatFecha(archivo.created_at)}</span>
                        </div>
                        {archivo.notas && (
                          <p className="text-xs text-muted-foreground/80 mt-0.5 truncate">{archivo.notas}</p>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleDescargarArchivo(archivo)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => handleEliminarArchivo(archivo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Editar Paciente */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Paciente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSavePaciente} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input id="edit-nombre" value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-apellido">Apellido *</Label>
                <Input id="edit-apellido" value={editForm.apellido} onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-dni">DNI</Label>
                <Input id="edit-dni" value={editForm.dni} onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-fnac">Fecha de Nacimiento</Label>
                <Input id="edit-fnac" type="date" value={editForm.fecha_nacimiento} onChange={(e) => setEditForm({ ...editForm, fecha_nacimiento: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-cel">Celular</Label>
                <Input id="edit-cel" value={editForm.cel} onChange={(e) => setEditForm({ ...editForm, cel: e.target.value })} placeholder="+54 11 1234-5678" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="paciente@email.com" />
              </div>
            </div>

            {/* Cobertura Médica */}
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20 p-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Cobertura Médica</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-os">Obra Social / Prepaga</Label>
                <Input id="edit-os" value={editForm.obra_social} onChange={(e) => setEditForm({ ...editForm, obra_social: e.target.value })} placeholder="OSDE, Swiss Medical, IOMA, etc." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-afiliado">Nro. Afiliado</Label>
                  <Input id="edit-afiliado" value={editForm.nro_afiliado} onChange={(e) => setEditForm({ ...editForm, nro_afiliado: e.target.value })} placeholder="123456789" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-plan">Plan</Label>
                  <Input id="edit-plan" value={editForm.plan_os} onChange={(e) => setEditForm({ ...editForm, plan_os: e.target.value })} placeholder="310 / Preferred / etc." />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSavingEdit}>
                {isSavingEdit ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
