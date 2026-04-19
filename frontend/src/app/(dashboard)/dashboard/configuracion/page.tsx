"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { RoleGuard } from "@/components/guards/role-guard";
import { FeatureGate } from "@/components/ui/feature-gate";
import clinicaService, {
  Clinica,
  HorarioDia,
  UpdateClinicaPayload,
} from "@/services/clinica.service";
import tratamientosService, {
  Tratamiento,
  CreateTratamientoPayload,
} from "@/services/tratamientos.service";
import archivosMedicosService from "@/services/archivos-medicos.service";
import clinicaMpService, { ClinicaMpStatus } from "@/services/clinica-mp.service";
import usersService from "@/services/users.service";
import horariosProfesionalService, {
  HorarioProfesional,
} from "@/services/horarios-profesional.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useClinica } from "@/components/providers/clinica-provider";
import {
  Building2,
  Clock,
  Stethoscope,
  Users,
  Plus,
  Pencil,
  Trash2,
  Save,
  Palette,
  GripVertical,
  Sparkles,
  UserPlus,
  Upload,
  Webhook,
  Bell,
  Info,
  Bot,
  MessageSquare,
  LayoutDashboard,
  Calendar,
  Search,
  CheckCircle2,
  CreditCard,
  ExternalLink,
} from "lucide-react";

// ─── Tipos ───
interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
  created_at: string;
}

const ESPECIALIDADES = [
  { value: "odontologia", label: "Odontología" },
  { value: "kinesiologia", label: "Kinesiología" },
  { value: "nutricion", label: "Nutrición" },
  { value: "medicina_general", label: "Medicina General" },
  { value: "psicologia", label: "Psicología" },
  { value: "general", label: "Otra / General" },
];

const DIAS_SEMANA = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

const DEFAULT_TURNO: { manana: { apertura: string; cierre: string; activo: boolean }; tarde: { apertura: string; cierre: string; activo: boolean } } = {
  manana: { apertura: "08:00", cierre: "12:00", activo: true },
  tarde: { apertura: "14:00", cierre: "18:00", activo: true },
};

const DEFAULT_HORARIOS: Record<string, HorarioDia> = {
  lunes: { ...DEFAULT_TURNO },
  martes: { ...DEFAULT_TURNO },
  miercoles: { ...DEFAULT_TURNO },
  jueves: { ...DEFAULT_TURNO },
  viernes: { ...DEFAULT_TURNO },
  sabado: { manana: { apertura: "09:00", cierre: "13:00", activo: false }, tarde: { apertura: "14:00", cierre: "18:00", activo: false } },
  domingo: { manana: { apertura: "09:00", cierre: "13:00", activo: false }, tarde: { apertura: "14:00", cierre: "18:00", activo: false } },
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  professional: "Profesional",
  assistant: "Asistente",
};

// ─── Logos por especialidad (SVG inline) ───
const LOGOS_ESPECIALIDAD: Record<string, { label: string; svg: (size: number) => React.ReactNode; bg: string }> = {
  odontologia: {
    label: "Odontología",
    bg: "bg-cyan-100 dark:bg-cyan-900/50",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 6C24 6 20 10 18 14c-2 4-1 10 1 16 2 6 4 14 5 20 .5 3 2 4 4 4s3-1 4-5l2-10c.5-2 1.5-3 3-3s2.5 1 3 3l2 10c1 4 2 5 4 5s3.5-1 4-4c1-6 3-14 5-20 2-6 3-12 1-16C53 10 40 6 32 6z" fill="#06B6D4" stroke="#0891B2" strokeWidth="2" />
      </svg>
    ),
  },
  kinesiologia: {
    label: "Kinesiología",
    bg: "bg-green-100 dark:bg-green-900/50",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="12" r="6" fill="#10B981" stroke="#059669" strokeWidth="2" />
        <path d="M24 24c0-4 4-8 8-8s8 4 8 8v4l6 12h-6l-2 16h-12l-2-16h-6l6-12v-4z" fill="#10B981" stroke="#059669" strokeWidth="2" />
        <path d="M18 32c-2 0-4-2-3-4l2-4" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
        <path d="M46 32c2 0 4-2 3-4l-2-4" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  nutricion: {
    label: "Nutrición",
    bg: "bg-orange-100 dark:bg-orange-900/50",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 16c0-6 4-10 8-10 2 0 4 2 4 6v12h-4C22 24 20 20 20 16z" fill="#F97316" stroke="#EA580C" strokeWidth="2" />
        <path d="M36 16c0-6-4-10-8-10-2 0-4 2-4 6" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" opacity="0" />
        <path d="M32 24v30" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="32" cy="56" rx="14" ry="4" fill="#FDBA74" stroke="#EA580C" strokeWidth="2" />
        <circle cx="38" cy="14" r="4" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5" />
        <circle cx="44" cy="20" r="3" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5" />
      </svg>
    ),
  },
  medicina_general: {
    label: "Medicina General",
    bg: "bg-blue-100 dark:bg-blue-900/50",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="18" y="18" width="28" height="28" rx="6" fill="#3B82F6" stroke="#2563EB" strokeWidth="2" />
        <rect x="29" y="24" width="6" height="16" rx="2" fill="white" />
        <rect x="24" y="29" width="16" height="6" rx="2" fill="white" />
      </svg>
    ),
  },
  psicologia: {
    label: "Psicología",
    bg: "bg-teal-100 dark:bg-teal-900/50",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8C20 8 12 18 12 28c0 6 3 12 8 16v12h24V44c5-4 8-10 8-16C52 18 44 8 32 8z" fill="#A855F7" stroke="#9333EA" strokeWidth="2" />
        <path d="M32 16v20M24 28h16" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
        <path d="M26 44c0-4 2.5-6 6-6s6 2 6 6" stroke="#9333EA" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
  general: {
    label: "Salud General",
    bg: "bg-rose-100 dark:bg-rose-900/50",
    svg: (s) => (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 56l-20-22C6 26 8 16 16 12c6-3 12 0 16 6 4-6 10-9 16-6 8 4 10 14 4 22L32 56z" fill="#F43F5E" stroke="#E11D48" strokeWidth="2" />
        <rect x="29" y="24" width="6" height="14" rx="2" fill="white" />
        <rect x="25" y="28" width="14" height="6" rx="2" fill="white" />
      </svg>
    ),
  },
};

const COLORES_TRATAMIENTO = [
  "#3B82F6", "#10B981", "#EF4444", "#F59E0B", "#8B5CF6",
  "#EC4899", "#6366F1", "#06B6D4", "#14B8A6", "#F97316",
  "#22C55E", "#64748B", "#DC2626", "#A855F7",
];

// ─── Tabs ───
type TabKey = "clinica" | "horarios" | "tratamientos" | "equipo" | "integraciones" | "whatsapp" | "dashboard" | "pagos";

export default function ConfiguracionPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <ConfiguracionContent />
    </RoleGuard>
  );
}

function ConfiguracionContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("clinica");
  const [clinica, setClinica] = useState<Clinica | null>(null);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { reload: reloadClinicaCtx } = useClinica();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [c, t, u] = await Promise.all([
        clinicaService.getMe(),
        tratamientosService.getAll(),
        usersService.getAll(),
      ]);
      setClinica(c);
      setTratamientos(t);
      setUsers(u);
      reloadClinicaCtx();
    } catch {
      toast.error("Error al cargar configuración");
    } finally {
      setIsLoading(false);
    }
  }, [reloadClinicaCtx]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs: { key: TabKey; label: string; icon: typeof Building2 }[] = [
    { key: "clinica", label: "Clínica", icon: Building2 },
    { key: "horarios", label: "Horarios", icon: Clock },
    { key: "tratamientos", label: "Tratamientos", icon: Stethoscope },
    { key: "equipo", label: "Equipo", icon: Users },
    { key: "integraciones", label: "Integraciones", icon: Webhook },
    { key: "whatsapp", label: "WhatsApp / IA", icon: Bot },
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "pagos", label: "Pagos", icon: CreditCard },
  ];

  if (isLoading || !clinica) {
    return (
      <div className="animate-page-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">Personalizá tu clínica</p>
        </div>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Cargando configuración...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-page-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Personalizá tu clínica, horarios, tratamientos y equipo
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 sm:gap-1 rounded-lg bg-muted p-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 min-w-[36px] sm:min-w-0 ${activeTab === tab.key
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <tab.icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "clinica" && (
        <TabClinica clinica={clinica} onUpdate={loadData} />
      )}
      {activeTab === "horarios" && (
        <TabHorarios clinica={clinica} users={users} onUpdate={loadData} />
      )}
      {activeTab === "tratamientos" && (
        <TabTratamientos
          tratamientos={tratamientos}
          especialidad={clinica.especialidad || "general"}
          onUpdate={loadData}
        />
      )}
      {activeTab === "equipo" && (
        <TabEquipo users={users} clinica={clinica} onUpdate={loadData} />
      )}
      {activeTab === "integraciones" && (
        <FeatureGate
          feature="whatsapp_reminders"
          planRequired="Avax Consultorio Standard"
          mode="overlay"
          description="Los recordatorios automáticos y webhooks requieren un plan pago."
        >
          <TabIntegraciones clinica={clinica} onUpdate={loadData} />
        </FeatureGate>
      )}
      {activeTab === "whatsapp" && (
        <FeatureGate
          feature="whatsapp_agent"
          planRequired="Avax Consultorio Plus IA"
          mode="overlay"
          description="El Agente IA de WhatsApp responde consultas y gestiona turnos automáticamente."
        >
          <TabWhatsApp clinica={clinica} onUpdate={loadData} />
        </FeatureGate>
      )}
      {activeTab === "dashboard" && (
        <TabDashboard clinica={clinica} onUpdate={loadData} />
      )}

      {activeTab === "pagos" && (
        <TabPagos clinicaId={clinica.id} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: CLÍNICA
// ═══════════════════════════════════════════════════════════
function TabClinica({ clinica, onUpdate }: { clinica: Clinica; onUpdate: () => void }) {
  const [form, setForm] = useState({
    nombre: clinica.nombre || "",
    nombre_propietario: clinica.nombre_propietario || "",
    cel: clinica.cel || "",
    email: clinica.email || "",
    direccion: clinica.direccion || "",
    especialidad: clinica.especialidad || "general",
    label_paciente: clinica.label_paciente || "Paciente",
    label_profesional: clinica.label_profesional || "Profesional",
    duracion_turno_default: clinica.duracion_turno_default?.toString() || "30",
    logo_url: clinica.logo_url || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [logoMode, setLogoMode] = useState<"default" | "custom">(
    clinica.logo_url && !clinica.logo_url.startsWith("__esp:") ? "custom" : "default",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentDefaultLogo = LOGOS_ESPECIALIDAD[form.especialidad] || LOGOS_ESPECIALIDAD.general;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const logoValue = logoMode === "default" ? `__esp:${form.especialidad}` : form.logo_url || undefined;
      await clinicaService.updateMe({
        nombre: form.nombre,
        nombre_propietario: form.nombre_propietario || undefined,
        cel: form.cel || undefined,
        email: form.email || undefined,
        direccion: form.direccion || undefined,
        especialidad: form.especialidad,
        label_paciente: form.label_paciente,
        label_profesional: form.label_profesional,
        duracion_turno_default: parseInt(form.duracion_turno_default) || 30,
        logo_url: logoValue,
      });
      toast.success("Clínica actualizada");
      onUpdate();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al guardar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten archivos de imagen");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo no debe superar 2MB");
      return;
    }
    try {
      const url = await archivosMedicosService.uploadLogo(file);
      setForm({ ...form, logo_url: url });
      setLogoMode("custom");
      toast.success("Logo subido correctamente");
    } catch {
      toast.error("Error al subir el logo");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Building2 className="h-5 w-5" />
            Datos de la Clínica
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Información general de tu establecimiento</p>
        </div>
        <div className="px-6 pb-6 space-y-4">
          {/* Logo */}
          <div className="space-y-3">
            <Label>Logo de la clínica</Label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed ${logoMode === "default" ? currentDefaultLogo.bg : "border-border"} overflow-hidden`}>
                {logoMode === "custom" && form.logo_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={form.logo_url}
                    alt="Logo"
                    width={80}
                    height={80}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  currentDefaultLogo.svg(48)
                )}
              </div>
              {/* Options */}
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLogoMode("default");
                      setForm({ ...form, logo_url: "" });
                    }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${logoMode === "default"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Icono por especialidad
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${logoMode === "custom"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                      }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" />
                      Logo propio
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
                {logoMode === "default" && (
                  <p className="text-xs text-muted-foreground">
                    Se usa el icono de {currentDefaultLogo.label}. Cambia la especialidad para usar otro.
                  </p>
                )}
                {logoMode === "custom" && (
                  <p className="text-xs text-muted-foreground">
                    Imagen PNG o JPG, máximo 2MB. Se muestra en el sidebar y reportes.
                  </p>
                )}
              </div>
            </div>
            {/* Default icons grid - only show when in default mode */}
            {logoMode === "default" && (
              <div className="grid grid-cols-6 gap-2 pt-1">
                {Object.entries(LOGOS_ESPECIALIDAD).map(([key, logo]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm({ ...form, especialidad: key })}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${form.especialidad === key
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-foreground/20"
                      }`}
                    title={logo.label}
                  >
                    {logo.svg(28)}
                    <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                      {logo.label.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Nombre de la clínica *</Label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Mi Clínica"
            />
          </div>
          <div className="space-y-2">
            <Label>Nombre del propietario</Label>
            <Input
              value={form.nombre_propietario}
              onChange={(e) => setForm({ ...form, nombre_propietario: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={form.cel}
                onChange={(e) => setForm({ ...form, cel: e.target.value })}
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="info@miclinica.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Dirección</Label>
            <Input
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Av. Corrientes 1234, CABA"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Stethoscope className="h-5 w-5" />
            Especialidad y Personalización
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Adaptá la plataforma a tu rama de salud</p>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <div className="space-y-2">
            <Label>Especialidad</Label>
            <Select
              value={form.especialidad}
              onValueChange={(v: string | null) => v && setForm({ ...form, especialidad: v })}
            >
              <SelectTrigger>
                <span>
                  {ESPECIALIDADES.find((e) => e.value === form.especialidad)?.label || "Seleccionar"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {ESPECIALIDADES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Define los tratamientos por defecto al iniciar
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Llamar "Paciente" como</Label>
              <Input
                value={form.label_paciente}
                onChange={(e) => setForm({ ...form, label_paciente: e.target.value })}
                placeholder="Paciente"
              />
            </div>
            <div className="space-y-2">
              <Label>Llamar "Profesional" como</Label>
              <Input
                value={form.label_profesional}
                onChange={(e) => setForm({ ...form, label_profesional: e.target.value })}
                placeholder="Odontólogo"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Duración de turno por defecto (min)</Label>
            <Input
              type="number"
              min="5"
              step="5"
              value={form.duracion_turno_default}
              onChange={(e) => setForm({ ...form, duracion_turno_default: e.target.value })}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving || !form.nombre} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: HORARIOS
// ═══════════════════════════════════════════════════════════

/** Migra horarios del formato viejo {apertura,cierre,activo} al nuevo {manana,tarde} */
function migrateHorarios(raw: any): Record<string, HorarioDia> {
  if (!raw) return DEFAULT_HORARIOS;
  const result: Record<string, HorarioDia> = {};
  for (const key of Object.keys(DEFAULT_HORARIOS)) {
    const dia = raw[key];
    if (!dia) { result[key] = DEFAULT_HORARIOS[key]; continue; }
    // Formato nuevo: tiene .manana
    if (dia.manana) { result[key] = dia; continue; }
    // Formato viejo: {apertura, cierre, activo} → migrar
    result[key] = {
      manana: { apertura: dia.apertura || "08:00", cierre: "12:00", activo: dia.activo ?? true },
      tarde: { apertura: "14:00", cierre: dia.cierre || "18:00", activo: dia.activo ?? true },
    };
  }
  return result;
}

function TabHorarios({ clinica, users, onUpdate }: { clinica: Clinica; users: User[]; onUpdate: () => void }) {
  const [horarios, setHorarios] = useState<Record<string, HorarioDia>>(
    () => migrateHorarios(clinica.horarios),
  );
  const [isSaving, setIsSaving] = useState(false);

  // ── Horarios por profesional ──
  const professionals = users.filter((u) => u.role === "professional");
  const [horariosProf, setHorariosProf] = useState<HorarioProfesional[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>("");
  const [profHorarios, setProfHorarios] = useState<Record<string, HorarioDia> | null>(null);
  const [isSavingProf, setIsSavingProf] = useState(false);
  const [isLoadingProf, setIsLoadingProf] = useState(false);

  const loadHorariosProf = useCallback(async () => {
    try {
      const data = await horariosProfesionalService.getAll();
      setHorariosProf(data);
    } catch {
      // silencio si aún no hay datos
    }
  }, []);

  useEffect(() => {
    loadHorariosProf();
  }, [loadHorariosProf]);

  const handleSelectProf = async (userId: string) => {
    setSelectedProfId(userId);
    if (!userId) {
      setProfHorarios(null);
      return;
    }
    setIsLoadingProf(true);
    try {
      const existing = await horariosProfesionalService.getByUser(userId);
      setProfHorarios(existing ? migrateHorarios(existing.horarios) : migrateHorarios(clinica.horarios));
    } catch {
      setProfHorarios(migrateHorarios(clinica.horarios));
    } finally {
      setIsLoadingProf(false);
    }
  };

  const updateProfTurno = (dia: string, turno: "manana" | "tarde", field: string, value: string | boolean) => {
    setProfHorarios((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [dia]: {
          ...prev[dia],
          [turno]: { ...prev[dia][turno], [field]: value },
        },
      };
    });
  };

  const handleSaveProf = async () => {
    if (!selectedProfId || !profHorarios) return;
    setIsSavingProf(true);
    try {
      await horariosProfesionalService.upsert({ user_id: selectedProfId, horarios: profHorarios });
      toast.success("Horarios del profesional actualizados");
      loadHorariosProf();
    } catch {
      toast.error("Error al guardar horarios del profesional");
    } finally {
      setIsSavingProf(false);
    }
  };

  const handleRemoveProf = async () => {
    if (!selectedProfId) return;
    try {
      await horariosProfesionalService.remove(selectedProfId);
      toast.success("Horario personalizado eliminado — usará el de la clínica");
      setProfHorarios(null);
      setSelectedProfId("");
      loadHorariosProf();
    } catch {
      toast.error("Error al eliminar horario del profesional");
    }
  };

  const updateTurno = (dia: string, turno: "manana" | "tarde", field: string, value: string | boolean) => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [turno]: { ...prev[dia][turno], [field]: value },
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await clinicaService.updateMe({ horarios });
      toast.success("Horarios actualizados");
      onUpdate();
    } catch {
      toast.error("Error al guardar horarios");
    } finally {
      setIsSaving(false);
    }
  };

  const isDiaActivo = (dia: HorarioDia) => dia.manana.activo || dia.tarde.activo;

  const profHasCustom = (userId: string) => horariosProf.some((h) => h.user_id === userId);

  return (
    <div className="space-y-6">
      {/* ── Horarios de la clínica ── */}
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Clock className="h-5 w-5" />
                Horarios de Atención
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">Configurá turnos de mañana y tarde para cada día</p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar Horarios"}
            </Button>
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="space-y-3">
            {DIAS_SEMANA.map(({ key, label }) => {
              const dia = horarios[key] || DEFAULT_HORARIOS[key];
              const activo = isDiaActivo(dia);
              return (
                <div
                  key={key}
                  className={`rounded-lg border p-4 transition-colors ${activo ? "bg-background" : "bg-muted/50 opacity-60"
                    }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-medium text-sm w-28">{label}</span>
                    {!activo && (
                      <span className="text-xs text-muted-foreground italic">Cerrado</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Mañana */}
                    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${dia.manana.activo ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-muted/30"}`}>
                      <Switch
                        checked={dia.manana.activo}
                        onCheckedChange={(v) => updateTurno(key, "manana", "activo", v)}
                      />
                      <span className="text-xs font-medium w-16 shrink-0">Mañana</span>
                      {dia.manana.activo ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="time"
                            value={dia.manana.apertura}
                            onChange={(e) => updateTurno(key, "manana", "apertura", e.target.value)}
                            className="w-28 h-8 text-xs"
                          />
                          <span className="text-muted-foreground text-xs">—</span>
                          <Input
                            type="time"
                            value={dia.manana.cierre}
                            onChange={(e) => updateTurno(key, "manana", "cierre", e.target.value)}
                            className="w-28 h-8 text-xs"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </div>
                    {/* Tarde */}
                    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${dia.tarde.activo ? "bg-primary/5 dark:bg-primary/10 border-primary/30 dark:border-primary" : "bg-muted/30"}`}>
                      <Switch
                        checked={dia.tarde.activo}
                        onCheckedChange={(v) => updateTurno(key, "tarde", "activo", v)}
                      />
                      <span className="text-xs font-medium w-16 shrink-0">Tarde</span>
                      {dia.tarde.activo ? (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="time"
                            value={dia.tarde.apertura}
                            onChange={(e) => updateTurno(key, "tarde", "apertura", e.target.value)}
                            className="w-28 h-8 text-xs"
                          />
                          <span className="text-muted-foreground text-xs">—</span>
                          <Input
                            type="time"
                            value={dia.tarde.cierre}
                            onChange={(e) => updateTurno(key, "tarde", "cierre", e.target.value)}
                            className="w-28 h-8 text-xs"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Horarios por Profesional ── */}
      {professionals.length > 0 && (
        <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Users className="h-5 w-5" />
                  Horarios por Profesional
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Asigná horarios personalizados a cada profesional. Si no tiene horario propio, usará el de la clínica.
                </p>
              </div>
              {selectedProfId && profHorarios && (
                <div className="flex gap-2">
                  {profHasCustom(selectedProfId) && (
                    <Button variant="outline" size="sm" onClick={handleRemoveProf} className="gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Quitar personalizado
                    </Button>
                  )}
                  <Button onClick={handleSaveProf} disabled={isSavingProf} size="sm" className="gap-2">
                    <Save className="h-4 w-4" />
                    {isSavingProf ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="px-6 pb-6 space-y-4">
            {/* Selector de profesional */}
            <div className="flex flex-wrap gap-2">
              {professionals.map((prof) => (
                <button
                  key={prof.id}
                  onClick={() => handleSelectProf(prof.id)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    selectedProfId === prof.id
                      ? "border-primary bg-[#0F172A]/10 text-primary dark:text-primary/90 shadow-sm"
                      : "border-border hover:border-muted-foreground/30 hover:bg-muted"
                  }`}
                >
                  <span>{prof.nombre} {prof.apellido}</span>
                  {profHasCustom(prof.id) && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Personalizado
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Editor de horarios del profesional */}
            {isLoadingProf && (
              <div className="text-sm text-muted-foreground py-4 text-center">Cargando horarios...</div>
            )}
            {selectedProfId && profHorarios && !isLoadingProf && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Editando horarios de {professionals.find((p) => p.id === selectedProfId)?.nombre ?? ""}. Los cambios solo aplican a este profesional.
                </div>
                {DIAS_SEMANA.map(({ key, label }) => {
                  const dia = profHorarios[key] || DEFAULT_HORARIOS[key];
                  const activo = isDiaActivo(dia);
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border p-4 transition-colors ${activo ? "bg-background" : "bg-muted/50 opacity-60"}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-medium text-sm w-28">{label}</span>
                        {!activo && <span className="text-xs text-muted-foreground italic">No atiende</span>}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${dia.manana.activo ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" : "bg-muted/30"}`}>
                          <Switch checked={dia.manana.activo} onCheckedChange={(v) => updateProfTurno(key, "manana", "activo", v)} />
                          <span className="text-xs font-medium w-16 shrink-0">Mañana</span>
                          {dia.manana.activo ? (
                            <div className="flex items-center gap-1.5">
                              <Input type="time" value={dia.manana.apertura} onChange={(e) => updateProfTurno(key, "manana", "apertura", e.target.value)} className="w-28 h-8 text-xs" />
                              <span className="text-muted-foreground text-xs">—</span>
                              <Input type="time" value={dia.manana.cierre} onChange={(e) => updateProfTurno(key, "manana", "cierre", e.target.value)} className="w-28 h-8 text-xs" />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${dia.tarde.activo ? "bg-primary/5 dark:bg-primary/10 border-primary/30 dark:border-primary" : "bg-muted/30"}`}>
                          <Switch checked={dia.tarde.activo} onCheckedChange={(v) => updateProfTurno(key, "tarde", "activo", v)} />
                          <span className="text-xs font-medium w-16 shrink-0">Tarde</span>
                          {dia.tarde.activo ? (
                            <div className="flex items-center gap-1.5">
                              <Input type="time" value={dia.tarde.apertura} onChange={(e) => updateProfTurno(key, "tarde", "apertura", e.target.value)} className="w-28 h-8 text-xs" />
                              <span className="text-muted-foreground text-xs">—</span>
                              <Input type="time" value={dia.tarde.cierre} onChange={(e) => updateProfTurno(key, "tarde", "cierre", e.target.value)} className="w-28 h-8 text-xs" />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!selectedProfId && (
              <div className="text-sm text-muted-foreground py-6 text-center">
                Seleccioná un profesional para ver o editar sus horarios
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: TRATAMIENTOS
// ═══════════════════════════════════════════════════════════
function TabTratamientos({
  tratamientos,
  especialidad,
  onUpdate,
}: {
  tratamientos: Tratamiento[];
  especialidad: string;
  onUpdate: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tratamiento | null>(null);
  const [deleting, setDeleting] = useState<Tratamiento | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio_base: "",
    duracion_min: "",
    color: "#3B82F6",
    activo: true,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      nombre: "",
      descripcion: "",
      precio_base: "",
      duracion_min: "30",
      color: "#3B82F6",
      activo: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (t: Tratamiento) => {
    setEditing(t);
    setForm({
      nombre: t.nombre || "",
      descripcion: t.descripcion || "",
      precio_base: t.precio_base?.toString() || "",
      duracion_min: t.duracion_min?.toString() || "",
      color: t.color || "#3B82F6",
      activo: t.activo,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: CreateTratamientoPayload = {
        nombre: form.nombre,
        descripcion: form.descripcion || undefined,
        precio_base: form.precio_base ? parseFloat(form.precio_base) : undefined,
        duracion_min: form.duracion_min ? parseInt(form.duracion_min) : undefined,
        color: form.color,
        activo: form.activo,
      };
      if (editing) {
        await tratamientosService.update(editing.id, payload);
        toast.success("Tratamiento actualizado");
      } else {
        await tratamientosService.create(payload);
        toast.success("Tratamiento creado");
      }
      setDialogOpen(false);
      onUpdate();
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
      await tratamientosService.delete(deleting.id);
      toast.success("Tratamiento eliminado");
      setDeleteDialogOpen(false);
      setDeleting(null);
      onUpdate();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al eliminar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const handleToggleActive = async (t: Tratamiento) => {
    try {
      await tratamientosService.update(t.id, { activo: !t.activo });
      onUpdate();
    } catch {
      toast.error("Error al cambiar estado");
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await tratamientosService.seed(especialidad);
      toast.success("Tratamientos cargados desde plantilla");
      onUpdate();
    } catch {
      toast.error("Error al cargar plantilla");
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Stethoscope className="h-5 w-5" />
                Tratamientos / Servicios
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Definí los servicios que ofrece tu clínica — se usan al crear turnos
              </p>
            </div>
            <div className="flex gap-2">
              {tratamientos.length === 0 && (
                <Button variant="outline" onClick={handleSeed} disabled={isSeeding} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {isSeeding ? "Cargando..." : "Cargar plantilla"}
                </Button>
              )}
              <Button onClick={openCreate} className="gap-2 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white shadow-[var(--shadow-primary)] transition-all">
                <Plus className="h-4 w-4" />
                Nuevo Tratamiento
              </Button>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          {tratamientos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted mb-4">
                <Stethoscope className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Sin tratamientos configurados</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Cargá la plantilla de tu especialidad para empezar rápido, o creá tratamientos manualmente.
              </p>
              <Button onClick={handleSeed} disabled={isSeeding} className="mt-4 gap-2">
                <Sparkles className="h-4 w-4" />
                {isSeeding ? "Cargando..." : `Cargar plantilla de ${ESPECIALIDADES.find((e) => e.value === especialidad)?.label || "General"}`}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {tratamientos.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors group ${t.activo ? "bg-background" : "bg-muted/50 opacity-60"
                    }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  <div
                    className="h-4 w-4 rounded-full shrink-0 border-2 border-background shadow-sm"
                    style={{ backgroundColor: t.color || "#64748B" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.nombre}</span>
                      {!t.activo && (
                        <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>
                      )}
                    </div>
                    {t.descripcion && (
                      <p className="text-xs text-muted-foreground truncate">{t.descripcion}</p>
                    )}
                  </div>
                  {t.duracion_min && (
                    <Badge variant="outline" className="shrink-0 gap-1">
                      <Clock className="h-3 w-3" />
                      {t.duracion_min} min
                    </Badge>
                  )}
                  {t.precio_base != null && (
                    <Badge variant="outline" className="shrink-0">
                      ${Number(t.precio_base).toLocaleString("es-AR")}
                    </Badge>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Switch
                      checked={t.activo}
                      onCheckedChange={() => handleToggleActive(t)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-600 hover:text-blue-700"
                      onClick={() => openEdit(t)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={() => { setDeleting(t); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Tratamiento" : "Nuevo Tratamiento"}</DialogTitle>
            <DialogDescription>
              {editing ? "Modificá los datos del tratamiento" : "Definí un nuevo servicio para tu clínica"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre *</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
                placeholder="Ej: Consulta general"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Breve descripción del servicio"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Precio base ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.precio_base}
                  onChange={(e) => setForm({ ...form, precio_base: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Duración (min)</Label>
                <Input
                  type="number"
                  min="5"
                  step="5"
                  value={form.duracion_min}
                  onChange={(e) => setForm({ ...form, duracion_min: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Palette className="h-3.5 w-3.5" />
                Color
              </Label>
              <div className="flex flex-wrap gap-2">
                {COLORES_TRATAMIENTO.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-8 w-8 rounded-full transition-all ${form.color === c ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105"
                      }`}
                    style={{ backgroundColor: c, ...(form.color === c ? { outlineColor: c } : {}) }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.activo}
                onCheckedChange={(v) => setForm({ ...form, activo: v })}
              />
              <Label>Activo (visible al crear turnos)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving || !form.nombre}>
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar Tratamiento</DialogTitle>
            <DialogDescription>
              Se eliminará <strong>{deleting?.nombre}</strong>. Los turnos existentes con este tratamiento no se verán afectados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: EQUIPO
// ═══════════════════════════════════════════════════════════
function TabEquipo({
  users,
  clinica,
  onUpdate,
}: {
  users: User[];
  clinica: Clinica;
  onUpdate: () => void;
}) {
  const { maxUsuarios, currentUsuarios, canAddUsuario } = usePlanLimits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    role: "professional",
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ nombre: "", apellido: "", email: "", password: "", role: "professional" });
    setDialogOpen(true);
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
      password: "",
      role: u.role,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        const payload: Record<string, string> = {
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          role: form.role,
        };
        if (form.password) payload.password = form.password;
        await usersService.update(editing.id, payload);
        toast.success("Usuario actualizado");
      } else {
        await usersService.create({
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        toast.success("Usuario creado");
      }
      setDialogOpen(false);
      onUpdate();
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
      await usersService.delete(deleting.id);
      toast.success("Usuario eliminado");
      setDeleteDialogOpen(false);
      setDeleting(null);
      onUpdate();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error al eliminar";
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    }
  };

  const roleColor: Record<string, string> = {
    admin: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    professional: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    assistant: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  };

  return (
    <>
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Users className="h-5 w-5" />
                Equipo de Trabajo
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gestión de {clinica.label_profesional?.toLowerCase() || "profesional"}es y asistentes
                {maxUsuarios > 0 && (
                  <span className={`ml-2 font-medium ${!canAddUsuario ? "text-red-500" : ""}`}>
                    ({currentUsuarios} de {maxUsuarios})
                  </span>
                )}
              </p>
            </div>
            <Button
              onClick={openCreate}
              disabled={!canAddUsuario}
              title={!canAddUsuario ? `Límite de ${maxUsuarios} usuarios alcanzado. Actualiza tu plan.` : undefined}
              className="gap-2 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white shadow-[var(--shadow-primary)] transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Nuevo Miembro
            </Button>
          </div>
        </div>
        <div className="px-6 pb-6">
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Sin miembros del equipo</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Agregá profesionales y asistentes a tu clínica
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-lg border p-3 group hover:shadow-sm transition-shadow"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-accent-dark)] text-white text-sm font-bold shrink-0">
                    {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {u.nombre} {u.apellido}
                      </span>
                      <Badge className={`text-[10px] ${roleColor[u.role] || ""}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-blue-600"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {u.role !== "admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500"
                        onClick={() => { setDeleting(u); setDeleteDialogOpen(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog Crear/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Miembro" : "Nuevo Miembro"}</DialogTitle>
            <DialogDescription>
              {editing ? "Modificá los datos del usuario" : "Agregá un nuevo miembro al equipo"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input
                  value={form.apellido}
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="usuario@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{editing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editing}
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Rol *</Label>
              <Select
                value={form.role}
                onValueChange={(v: string | null) => v && setForm({ ...form, role: v })}
              >
                <SelectTrigger>
                  <span>{ROLE_LABELS[form.role] || form.role}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="professional">
                    {clinica.label_profesional || "Profesional"}
                  </SelectItem>
                  <SelectItem value="assistant">Asistente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Eliminar */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Eliminar Miembro</DialogTitle>
            <DialogDescription>
              Se eliminará a <strong>{deleting?.nombre} {deleting?.apellido}</strong> del equipo.
              Los turnos asignados no se eliminarán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: INTEGRACIONES
// ═══════════════════════════════════════════════════════════

const WEBHOOK_ESTADOS = [
  {
    key: "confirmado",
    label: "Turno Confirmado",
    description: "Se dispara cuando un turno cambia a estado confirmado",
    color: "bg-blue-500",
  },
  {
    key: "completado",
    label: "Turno Completado",
    description: "Se dispara cuando se marca un turno como completado",
    color: "bg-[var(--ht-accent)]",
  },
  {
    key: "cancelado",
    label: "Turno Cancelado",
    description: "Se dispara cuando se cancela un turno",
    color: "bg-red-500",
  },
  {
    key: "perdido",
    label: "Turno Perdido",
    description: "Se dispara cuando un turno se marca como perdido (no se presentó)",
    color: "bg-orange-500",
  },
  {
    key: "pendiente",
    label: "Turno Creado (Pendiente)",
    description: "Se dispara cuando se crea un nuevo turno",
    color: "bg-amber-500",
  },
  {
    key: "recordatorio",
    label: "Recordatorio de Turno",
    description: "Se dispara automáticamente X horas antes del turno confirmado (configurable abajo)",
    color: "bg-[var(--ht-accent)]",
  },
];

const PAYLOAD_EXAMPLE = {
  horario: { start_time: "2026-03-26T10:00:00Z", end_time: "2026-03-26T10:30:00Z" },
  paciente: { nombre: "Juan", apellido: "Pérez", cel: "+5411...", dni: "12345678" },
  tratamiento: "Limpieza dental",
  estado_turno: "confirmado",
  estado_pago: "pendiente",
  profesional: { nombre: "Dra. García", email: "dra@clinica.com" },
  clinica: "Mi Clínica",
  recordatorio_horas_antes: 24,
};

function TabIntegraciones({ clinica, onUpdate }: { clinica: Clinica; onUpdate: () => void }) {
  const [webhooks, setWebhooks] = useState<Record<string, { url: string; activo: boolean }>>(
    clinica.webhooks || {},
  );
  const [recordatorio, setRecordatorio] = useState<string>(
    clinica.recordatorio_horas_antes?.toString() || "24",
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleWebhook = (key: string, activo: boolean) => {
    setWebhooks((prev) => ({
      ...prev,
      [key]: { url: prev[key]?.url || "", activo },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await clinicaService.updateMe({
        webhooks,
        recordatorio_horas_antes: parseInt(recordatorio) || 24,
      });
      toast.success("Integraciones guardadas");
      onUpdate();
    } catch {
      toast.error("Error al guardar integraciones");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
              Automatizaciones de tu clínica
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Activá las notificaciones automáticas que necesites. Ponte en contacto con el equipo de Avax Health para que puedan ayudarte con la configuración de estas herramientas.
            </p>
          </div>
        </div>
      </div>

      {/* Webhooks por estado */}
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Webhook className="h-5 w-5" />
                Notificaciones Automáticas
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Elegí qué eventos activan notificaciones automáticas para tus pacientes
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="space-y-3">
            {WEBHOOK_ESTADOS.map(({ key, label, description, color }) => {
              const wh = webhooks[key] || { url: "", activo: false };
              return (
                <div
                  key={key}
                  className={`rounded-lg border p-4 transition-all duration-200 ${wh.activo ? "bg-background border-primary/20 shadow-sm" : "bg-muted/30"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={wh.activo}
                      onCheckedChange={(v) => toggleWebhook(key, v)}
                    />
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-sm">{label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    {wh.activo && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ht-accent)] bg-[var(--ht-accent)]/10 px-2 py-0.5 rounded-full">
                        Activo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recordatorio automático */}
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Bell className="h-5 w-5" />
            Recordatorio Automático de Turno
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Se envía automáticamente un recordatorio antes de cada turno confirmado
          </p>
        </div>
        <div className="px-6 pb-6 space-y-4">
          <div className="rounded-lg border border-[var(--ht-accent)]/30 bg-[var(--success-bg)] p-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-[var(--ht-accent)] shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-[var(--status-success-fg)]">
                  Cómo funciona
                </p>
                <ol className="list-decimal pl-4 text-emerald-700 dark:text-emerald-300 text-xs space-y-1">
                  <li>Configurás cuántas horas antes querés que se envíe el recordatorio</li>
                  <li>Activá la notificación <strong>"Recordatorio de Turno"</strong> en la sección de arriba</li>
                  <li>El sistema revisa automáticamente cada 10 minutos si hay turnos que necesitan recordatorio</li>
                  <li>Cuando llega el momento, se envía la notificación al paciente con todos los datos del turno</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Enviar recordatorio con anticipación de</Label>
            <Select
              value={recordatorio}
              onValueChange={(v: string | null) => v && setRecordatorio(v)}
            >
              <SelectTrigger className="w-72">
                <span>
                  {{ "2": "2 horas antes", "4": "4 horas antes", "12": "12 horas antes", "24": "24 horas antes (1 día)", "48": "48 horas antes (2 días)" }[recordatorio] || `${recordatorio} horas antes`}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 horas antes</SelectItem>
                <SelectItem value="4">4 horas antes</SelectItem>
                <SelectItem value="12">12 horas antes</SelectItem>
                <SelectItem value="24">24 horas antes (1 día)</SelectItem>
                <SelectItem value="48">48 horas antes (2 días)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!(webhooks["recordatorio"]?.activo) && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <Bell className="h-3.5 w-3.5" />
                Activá la notificación <strong>"Recordatorio de Turno"</strong> arriba para que los recordatorios se envíen automáticamente.
              </p>
            </div>
          )}

          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Guardando..." : "Guardar Configuración"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: WHATSAPP / IA
// ═══════════════════════════════════════════════════════════
function TabWhatsApp({ clinica, onUpdate }: { clinica: Clinica; onUpdate: () => void }) {
  const [agentActivo, setAgentActivo] = useState<boolean>(!!clinica.agent_habilitado);
  const [agentNombre, setAgentNombre] = useState(clinica.agent_nombre || "Zoe");
  const [agentInstrucciones, setAgentInstrucciones] = useState(clinica.agent_instrucciones || "");
  const [isSaving, setIsSaving] = useState(false);

  const isConnected = !!clinica.evolution_instance && !!clinica.evolution_api_key;

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await clinicaService.updateMe({
        agent_habilitado: agentActivo,
        agent_nombre: agentNombre,
        agent_instrucciones: agentInstrucciones,
      });
      toast.success("Configuración del agente guardada");
      onUpdate();
    } catch {
      toast.error("Error al guardar configuración");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agente IA — Activar/Desactivar + Nombre */}
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)] overflow-hidden">
        <div
          className="relative overflow-hidden border-b border-[var(--border-light)] bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-6 py-5 text-white"
        >
          <div
            className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute -bottom-16 -left-6 h-32 w-32 rounded-full bg-white/5 blur-2xl" aria-hidden="true" />
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                <Bot className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                  Agente IA — Asistente Virtual
                </h3>
                <p className="text-xs text-white/80 mt-0.5">
                  Un asistente inteligente que atiende a tus pacientes por WhatsApp las 24 horas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  agentActivo
                    ? "bg-white/20 text-white ring-1 ring-white/30"
                    : "bg-white/10 text-white/70 ring-1 ring-white/15"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${agentActivo ? "bg-white animate-pulse" : "bg-white/50"}`}
                  aria-hidden="true"
                />
                {agentActivo ? "Activo" : "Inactivo"}
              </span>
              <Switch
                checked={agentActivo}
                onCheckedChange={setAgentActivo}
                aria-label={agentActivo ? "Desactivar agente IA" : "Activar agente IA"}
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-6 space-y-4">
          {agentActivo ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="agent_nombre">Nombre del Agente</Label>
                <Input
                  id="agent_nombre"
                  value={agentNombre}
                  onChange={(e) => setAgentNombre(e.target.value)}
                  placeholder="Zoe"
                />
                <p className="text-xs text-muted-foreground">
                  El nombre con el que se presentará el asistente a los pacientes (ej: &ldquo;Zoe&rdquo;, &ldquo;Ana&rdquo;, &ldquo;Asistente&rdquo;).
                </p>
              </div>

              <div className="rounded-lg border border-[var(--status-success-bg)] bg-[var(--status-success-bg)]/40 p-3">
                <p className="text-xs text-[var(--status-success-fg)] flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                  <span>
                    El agente usa inteligencia artificial para entender las consultas de tus pacientes
                    y responder de forma natural y profesional.
                  </span>
                </p>
              </div>
            </>
          ) : (
            <div className="rounded-lg border bg-muted/30 p-6 text-center">
              <Bot className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                El agente IA está desactivado. Activalo para que atienda a tus pacientes automáticamente por WhatsApp.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Estado conexión WhatsApp */}
      {agentActivo && (
        <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
          <div className="px-6 pt-6 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <MessageSquare className="h-5 w-5 text-[var(--status-success-fg)]" aria-hidden="true" />
              Estado WhatsApp
              {isConnected ? (
                <Badge
                  variant="outline"
                  className="ml-2 border-[var(--status-success-fg)]/30 bg-[var(--status-success-bg)] text-[var(--status-success-fg)] text-[10px]"
                >
                  Conectado
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="ml-2 border-[var(--status-warning-fg)]/30 bg-[var(--status-warning-bg)] text-[var(--status-warning-fg)] text-[10px]"
                >
                  No configurado
                </Badge>
              )}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              La conexión de WhatsApp es administrada por el equipo de Avax Health
            </p>
          </div>
          <div className="px-6 pb-6">
            <div className="rounded-lg border bg-muted/30 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? "Tu número de WhatsApp está conectado y funcionando correctamente."
                  : "Tu WhatsApp aún no está conectado. Contactá al equipo de soporte para configurarlo."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones personalizadas */}
      {agentActivo && (
        <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
          <div className="px-6 pt-6 pb-4">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="h-5 w-5 text-[var(--ht-accent)]" aria-hidden="true" />
              Instrucciones Personalizadas
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Indicaciones adicionales para que el agente se adapte a tu clínica
            </p>
          </div>
          <div className="px-6 pb-6 space-y-3">
            <Textarea
              value={agentInstrucciones}
              onChange={(e) => setAgentInstrucciones(e.target.value)}
              placeholder={"Ej: Siempre preguntá si el paciente tiene obra social.\nNo agendes turnos los feriados.\nSi preguntan por ortodoncia, derivá al Dr. Pérez."}
              rows={5}
              className="min-h-[120px] resize-y"
              aria-label="Instrucciones personalizadas para el agente"
            />
            <p className="text-xs text-muted-foreground">
              Estas instrucciones se agregan al contexto del agente. Usá lenguaje natural para indicar reglas específicas de tu clínica, preferencias de atención, o información adicional.
            </p>
          </div>
        </div>
      )}

      {/* Funcionalidades del Agente */}
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-5 w-5 text-[var(--ht-accent)]" aria-hidden="true" />
            Funcionalidades del Agente
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Lo que el asistente virtual puede hacer por tu clínica
          </p>
        </div>
        <div className="px-6 pb-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { Icon: Calendar, title: "Agendar turnos", desc: "Consulta disponibilidad y agenda turnos directamente desde WhatsApp" },
              { Icon: Search, title: "Buscar pacientes", desc: "Busca por teléfono o DNI para identificar pacientes existentes" },
              { Icon: UserPlus, title: "Registrar pacientes", desc: "Registra nuevos pacientes que contactan por primera vez" },
              { Icon: Bell, title: "Recordatorios", desc: "Envía recordatorios automáticos antes de cada turno" },
              { Icon: CheckCircle2, title: "Confirmar turnos", desc: "Los pacientes pueden confirmar su asistencia por chat" },
              { Icon: Building2, title: "Info de la clínica", desc: "Responde consultas sobre horarios, dirección y servicios" },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className={`group relative flex gap-3 rounded-lg border border-[var(--border-light)] bg-card p-3 transition-all duration-200 ${
                  agentActivo
                    ? "hover:border-[var(--ht-primary)]/30 hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5"
                    : "opacity-50"
                }`}
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-primary)]/10 to-[var(--ht-accent)]/10 text-[var(--ht-primary)] ring-1 ring-[var(--ht-primary)]/15"
                  aria-hidden="true"
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WhatsApp info */}
      <div className="rounded-lg border border-[var(--status-success-fg)]/20 bg-[var(--status-success-bg)]/40 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-[var(--status-success-fg)] shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm">
            <p className="font-medium text-[var(--status-success-fg)] mb-1">
              Conexión WhatsApp
            </p>
            <p className="text-xs text-[var(--status-success-fg)]/85">
              La conexión de WhatsApp y la configuración técnica del agente son administradas por el equipo de Avax Health.
              Si necesitás conectar o cambiar tu número de WhatsApp, contactá al equipo de soporte.
            </p>
          </div>
        </div>
      </div>

      {/* Save button */}
      <Button onClick={handleSave} disabled={isSaving} className="gap-2">
        <Save className="h-4 w-4" />
        {isSaving ? "Guardando..." : "Guardar Configuración"}
      </Button>
    </div>
  );
}

// ─── Tab Dashboard (KPI Visibility) ───
const KPI_OPTIONS: { id: string; label: string; description: string }[] = [
  { id: "turnosHoy", label: "Turnos Hoy", description: "Cantidad de turnos programados para hoy" },
  { id: "completadosHoy", label: "Completados Hoy", description: "Turnos finalizados en el día" },
  { id: "confirmadosRestantes", label: "Confirmados Restantes", description: "Turnos confirmados pendientes de atender" },
  { id: "pacientes", label: "Pacientes", description: "Total de pacientes registrados" },
  { id: "ingresosMes", label: "Ingresos del Mes", description: "Monto total de pagos aprobados del mes" },
  { id: "pagosAprobados", label: "Pagos Aprobados", description: "Cantidad de pagos aprobados del mes" },
  { id: "stockBajo", label: "Stock Bajo", description: "Items de inventario bajo mínimo" },
];

const SECTION_OPTIONS: { id: string; label: string; description: string }[] = [
  { id: "estadoTurnos", label: "Estado de Turnos", description: "Gráfico de torta con distribución de estados" },
  { id: "turnosHoy", label: "Turnos de Hoy", description: "Lista de turnos programados para hoy" },
  { id: "turnosSemana", label: "Turnos de la Semana", description: "Gráfico de líneas semanal" },
  { id: "tratamientos", label: "Tratamientos del Mes", description: "Barras de tratamientos más realizados" },
  { id: "ingresosMensuales", label: "Ingresos Mensuales", description: "Gráfico de barras con ingresos" },
  { id: "facturacionDiaria", label: "Facturación Diaria", description: "Gráfico de área con facturación" },
];

const ROLES = [
  { id: "professional", label: "Profesional" },
  { id: "assistant", label: "Secretaria" },
];

function TabDashboard({ clinica, onUpdate }: { clinica: Clinica; onUpdate: () => void }) {
  const [visibility, setVisibility] = useState<Record<string, Record<string, boolean>>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (clinica?.kpi_visibility) {
      setVisibility(clinica.kpi_visibility);
    } else {
      // Defaults: professional sees turnos + pacientes; assistant sees turnos + pacientes + pagos count
      setVisibility({
        professional: {
          turnosHoy: true, completadosHoy: true, confirmadosRestantes: true, pacientes: true, ingresosMes: false, pagosAprobados: false, stockBajo: false,
          "section:estadoTurnos": true, "section:turnosHoy": true, "section:turnosSemana": true, "section:tratamientos": true,
          "section:ingresosMensuales": false, "section:facturacionDiaria": false,
        },
        assistant: {
          turnosHoy: true, completadosHoy: true, confirmadosRestantes: true, pacientes: true, ingresosMes: false, pagosAprobados: true, stockBajo: false,
          "section:estadoTurnos": true, "section:turnosHoy": true, "section:turnosSemana": true, "section:tratamientos": true,
          "section:ingresosMensuales": false, "section:facturacionDiaria": false,
        },
      });
    }
  }, [clinica]);

  const toggleItem = (role: string, itemId: string) => {
    setVisibility((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [itemId]: !prev[role]?.[itemId],
      },
    }));
  };

  const toggleAll = (role: string, group: "kpi" | "section", value: boolean) => {
    setVisibility((prev) => {
      const updated = { ...prev, [role]: { ...prev[role] } };
      if (group === "kpi") {
        KPI_OPTIONS.forEach((kpi) => { updated[role][kpi.id] = value; });
      } else {
        SECTION_OPTIONS.forEach((s) => { updated[role][`section:${s.id}`] = value; });
      }
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await clinicaService.updateMe({ kpi_visibility: visibility });
      toast.success("Visibilidad del dashboard actualizada");
      onUpdate();
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--border-light)] bg-card shadow-[var(--shadow-card)]">
        <div className="px-6 pt-6 pb-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <LayoutDashboard className="h-5 w-5" />
            Visibilidad del Dashboard por Rol
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configurá qué KPIs y secciones puede ver cada rol en su dashboard. El admin siempre tiene acceso completo.
          </p>
        </div>
        <div className="px-6 pb-6 space-y-8">
          {ROLES.map((role) => (
            <div key={role.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                  {role.label}
                </Badge>
              </div>

              {/* KPIs */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tarjetas KPI</h4>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAll(role.id, "kpi", true)} className="text-xs text-primary hover:underline">Seleccionar todos</button>
                    <span className="text-xs text-muted-foreground">|</span>
                    <button onClick={() => toggleAll(role.id, "kpi", false)} className="text-xs text-muted-foreground hover:underline">Deseleccionar todos</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {KPI_OPTIONS.map((kpi) => (
                    <div
                      key={kpi.id}
                      className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                        visibility[role.id]?.[kpi.id]
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/30"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{kpi.label}</p>
                        <p className="text-xs text-muted-foreground">{kpi.description}</p>
                      </div>
                      <Switch
                        checked={!!visibility[role.id]?.[kpi.id]}
                        onCheckedChange={() => toggleItem(role.id, kpi.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Secciones del Dashboard</h4>
                  <div className="flex gap-2">
                    <button onClick={() => toggleAll(role.id, "section", true)} className="text-xs text-primary hover:underline">Seleccionar todos</button>
                    <span className="text-xs text-muted-foreground">|</span>
                    <button onClick={() => toggleAll(role.id, "section", false)} className="text-xs text-muted-foreground hover:underline">Deseleccionar todos</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {SECTION_OPTIONS.map((section) => {
                    const key = `section:${section.id}`;
                    return (
                      <div
                        key={key}
                        className={`flex items-center justify-between rounded-xl border p-3 transition-colors ${
                          visibility[role.id]?.[key]
                            ? "bg-primary/5 border-primary/20"
                            : "bg-muted/30"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-medium">{section.label}</p>
                          <p className="text-xs text-muted-foreground">{section.description}</p>
                        </div>
                        <Switch
                          checked={!!visibility[role.id]?.[key]}
                          onCheckedChange={() => toggleItem(role.id, key)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {role.id !== ROLES[ROLES.length - 1].id && <hr className="border-border" />}
            </div>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="gap-2">
        <Save className="h-4 w-4" />
        {isSaving ? "Guardando..." : "Guardar Configuración"}
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// TAB: PAGOS — Mercado Pago por clínica
// ═══════════════════════════════════════════════════════════
function TabPagos({ clinicaId }: { clinicaId: string }) {
  const [status, setStatus] = useState<ClinicaMpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ webhook_url: "", webhook_activo: false });

  const loadStatus = useCallback(async () => {
    try {
      const data = await clinicaMpService.getStatus();
      setStatus(data);
      if (data.configurado) {
        setForm({
          webhook_url: data.webhook_url ?? "",
          webhook_activo: data.webhook_activo ?? false,
        });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  const handleSave = async () => {
    if (!status?.configurado) {
      toast.error("Mercado Pago aún no está configurado. Contactá al equipo de Avax Health.");
      return;
    }
    setSaving(true);
    try {
      await clinicaMpService.updateWebhook({
        webhook_url: form.webhook_url || undefined,
        webhook_activo: form.webhook_activo,
      });
      toast.success("Configuración de pagos guardada");
      await loadStatus();
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-sm text-muted-foreground">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Pagos — Mercado Pago</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Activá el botón de pago y configurá el webhook para enviar el link automáticamente a tus pacientes.
        </p>
      </div>

      {/* Estado de integración (solo lectura — lo configura el equipo de Avax Health) */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${status?.configurado ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20" : "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20"}`}>
        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${status?.configurado ? "bg-emerald-100 dark:bg-emerald-900/40" : "bg-amber-100 dark:bg-amber-900/40"}`}>
          <CreditCard className={`h-4 w-4 ${status?.configurado ? "text-emerald-600" : "text-amber-600"}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {status?.configurado ? "Mercado Pago activado" : "Mercado Pago no configurado"}
          </p>
          <p className="text-xs text-muted-foreground">
            {status?.configurado
              ? "Las credenciales están configuradas por el equipo de Avax Health."
              : "Contactá al equipo de Avax Health para activar los pagos de tu clínica."}
          </p>
        </div>
      </div>

      {/* Webhook */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium">Webhook de link de pago</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cuando el agente genere un link de pago, lo enviará a esta URL (ej: workflow de n8n que lo manda por WhatsApp).
          </p>
        </div>

        <div className="space-y-1.5">
          <Label>URL del Webhook</Label>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Webhook de link de pago</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cuando el agente genere un link de pago, lo enviará automáticamente a esta URL (ej: workflow de n8n).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>URL del Webhook</Label>
            <Input
              placeholder="https://n8n.tudominio.com/webhook/..."
              value={form.webhook_url}
              onChange={(e) => setForm((p) => ({ ...p, webhook_url: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Activar envío automático</p>
              <p className="text-xs text-muted-foreground">Enviar link de pago al webhook al generarlo</p>
            </div>
            <Switch
              checked={form.webhook_activo}
              onCheckedChange={(v) => setForm((p) => ({ ...p, webhook_activo: v }))}
              disabled={!form.webhook_url && !status?.webhook_url}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="gap-2">
        <Save className="h-4 w-4" />
        {saving ? "Guardando..." : "Guardar configuración de pagos"}
      </Button>
    </div>
  );
}
