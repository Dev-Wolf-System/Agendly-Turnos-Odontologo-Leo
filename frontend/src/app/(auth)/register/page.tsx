"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { plansService } from "@/services/plans.service";
import type { Plan } from "@/types";
import api from "@/services/api";

/* ── Icons ── */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4" /><path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" /><path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" /><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" /><path d="m2 2 20 20" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

/* ── Helpers ── */

const ESPECIALIDADES = [
  { value: "odontologia", label: "Odontologia" },
  { value: "medicina_general", label: "Medicina General" },
  { value: "pediatria", label: "Pediatria" },
  { value: "dermatologia", label: "Dermatologia" },
  { value: "oftalmologia", label: "Oftalmologia" },
  { value: "kinesiologia", label: "Kinesiologia" },
  { value: "nutricion", label: "Nutricion" },
  { value: "psicologia", label: "Psicologia" },
  { value: "traumatologia", label: "Traumatologia" },
  { value: "cardiologia", label: "Cardiologia" },
  { value: "ginecologia", label: "Ginecologia" },
  { value: "urologia", label: "Urologia" },
  { value: "veterinaria", label: "Veterinaria" },
  { value: "otra", label: "Otra especialidad" },
];

const STEPS = [
  { label: "Clinica", icon: BuildingIcon },
  { label: "Cuenta", icon: UserIcon },
];

/* ── Main component wrapped in Suspense ── */

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const planIdFromQuery = searchParams.get("plan");

  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [form, setForm] = useState({
    clinica_nombre: "",
    nombre_propietario: "",
    clinica_cel: "",
    especialidad: "",
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!planIdFromQuery) return;
    plansService.getActivePlans().then((plans) => {
      const plan = plans.find((p) => p.id === planIdFromQuery);
      if (plan) setSelectedPlan(plan);
    }).catch(() => {});
  }, [planIdFromQuery]);

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canAdvanceStep0 =
    form.clinica_nombre.trim().length > 0 && form.especialidad.length > 0;

  const canAdvanceStep1 =
    form.nombre.trim().length > 0 &&
    form.apellido.trim().length > 0 &&
    form.email.trim().length > 0 &&
    form.password.length >= 6 &&
    form.password === form.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contrasenas no coinciden");
      return;
    }
    if (form.password.length < 6) {
      setError("La contrasena debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.register({
        clinica_nombre: form.clinica_nombre,
        nombre_propietario: form.nombre_propietario || undefined,
        clinica_cel: form.clinica_cel || undefined,
        especialidad: form.especialidad || undefined,
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        plan_id: planIdFromQuery || undefined,
      });

      // Si el registro requiere pago, generar checkout y redirigir a MP
      if (result.requires_payment && result.clinica_id && planIdFromQuery) {
        const { data } = await api.post<{ checkout_url: string }>("/billing/checkout-registro", {
          clinica_id: result.clinica_id,
          plan_id: planIdFromQuery,
          email: form.email,
        });
        window.location.href = data.checkout_url;
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Error al registrar la cuenta";
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-lg mx-auto text-center">
        <Image
          src="/logo.png"
          alt="Avax Health"
          width={56}
          height={56}
          className="mx-auto mb-6 rounded-xl shadow-md"
        />
        <div className="rounded-xl border bg-card shadow-lg p-8">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--ht-accent)]/10 mb-5">
            <CheckIcon className="h-7 w-7 text-[var(--ht-accent)]" />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">
            Solicitud enviada
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Tu solicitud de prueba gratuita fue recibida correctamente.
            Nuestro equipo la revisara y te contactaremos por email a{" "}
            <span className="font-semibold text-foreground">{form.email}</span>{" "}
            cuando sea aprobada.
          </p>
          <div className="rounded-lg bg-muted/50 p-4 mb-6 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Resumen de tu solicitud
            </p>
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Clinica:</span>
              <span className="font-medium">{form.clinica_nombre}</span>
              <span className="text-muted-foreground">Especialidad:</span>
              <span className="font-medium">
                {ESPECIALIDADES.find((e) => e.value === form.especialidad)?.label || "—"}
              </span>
              <span className="text-muted-foreground">Administrador:</span>
              <span className="font-medium">{form.nombre} {form.apellido}</span>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Volver al inicio de sesion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Logo + Title */}
      <div className="text-center mb-8">
        <Image
          src="/logo.png"
          alt="Avax Health"
          width={56}
          height={56}
          className="mx-auto mb-4 rounded-xl shadow-md"
        />
        <h1 className="text-2xl font-bold tracking-tight">
          {selectedPlan ? `Contratar plan ${selectedPlan.nombre}` : "Solicitar Prueba Gratuita"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configura tu clinica en menos de 2 minutos
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.label} className="flex items-center">
              {i > 0 && (
                <div
                  className={`h-px w-10 sm:w-16 transition-colors ${
                    isDone ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => {
                  if (isDone) setStep(i);
                }}
                disabled={!isDone && !isActive}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] text-white shadow-md"
                    : isDone
                    ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? (
                  <CheckIcon className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="rounded-xl border bg-card shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* ── Step 0: Clinic data + specialty ── */}
          {step === 0 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-1">
                <BuildingIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Datos de tu clinica</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Esta informacion se usara para configurar tu espacio de trabajo.
              </p>

              {/* Trial badge */}
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--ht-accent)]/20 bg-[var(--ht-accent)]/[0.04] p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-accent)] to-[var(--ht-accent-dark)] shadow-sm">
                  <SparkleIcon className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Prueba gratuita — 14 dias</p>
                  <p className="text-xs text-muted-foreground">
                    Sin tarjeta de credito. Acceso completo al sistema.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Nombre de la Clinica *
                  </label>
                  <input
                    value={form.clinica_nombre}
                    onChange={(e) => updateField("clinica_nombre", e.target.value)}
                    placeholder="Ej: Clinica Dental Sonrisa"
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Especialidad *
                  </label>
                  <select
                    value={form.especialidad}
                    onChange={(e) => updateField("especialidad", e.target.value)}
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  >
                    <option value="">Selecciona una especialidad</option>
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp.value} value={esp.value}>
                        {esp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Nombre del Propietario
                    </label>
                    <input
                      value={form.nombre_propietario}
                      onChange={(e) => updateField("nombre_propietario", e.target.value)}
                      placeholder="Dr. Garcia"
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Telefono de la Clinica
                    </label>
                    <input
                      value={form.clinica_cel}
                      onChange={(e) => updateField("clinica_cel", e.target.value)}
                      placeholder="+54 11 1234-5678"
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  disabled={!canAdvanceStep0}
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Account data ── */}
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-1">
                <UserIcon className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Tu cuenta de administrador</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Con estos datos podras acceder al sistema y gestionar tu clinica.
              </p>

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Nombre *
                    </label>
                    <input
                      value={form.nombre}
                      onChange={(e) => updateField("nombre", e.target.value)}
                      placeholder="Juan"
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Apellido *
                    </label>
                    <input
                      value={form.apellido}
                      onChange={(e) => updateField("apellido", e.target.value)}
                      placeholder="Garcia"
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="tu@clinica.com"
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Contrasena *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        placeholder="Min. 6 caracteres"
                        className="w-full rounded-xl border bg-background px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {form.password.length > 0 && form.password.length < 6 && (
                      <p className="text-[11px] text-amber-500">Minimo 6 caracteres</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Confirmar contrasena *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                        placeholder="Repeti tu contrasena"
                        className="w-full rounded-xl border bg-background px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                    {form.confirmPassword.length > 0 &&
                      form.password !== form.confirmPassword && (
                        <p className="text-[11px] text-red-500">Las contrasenas no coinciden</p>
                      )}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 rounded-xl border border-dashed border-border/80 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Resumen
                </p>
                <div className="grid grid-cols-2 gap-y-1.5 text-sm">
                  <span className="text-muted-foreground">Plan:</span>
                  {selectedPlan ? (
                    <span className="font-medium text-[var(--ht-primary)]">
                      {selectedPlan.nombre} — ${Number(selectedPlan.precio_mensual).toLocaleString("es-AR")}/mes
                    </span>
                  ) : (
                    <span className="font-medium text-emerald-600">Prueba gratuita (14 dias)</span>
                  )}
                  <span className="text-muted-foreground">Clinica:</span>
                  <span className="font-medium">{form.clinica_nombre || "—"}</span>
                  <span className="text-muted-foreground">Admin:</span>
                  <span className="font-medium">
                    {form.nombre && form.apellido ? `${form.nombre} ${form.apellido}` : "—"}
                  </span>
                  <span className="text-muted-foreground">Especialidad:</span>
                  <span className="font-medium">{ESPECIALIDADES.find(e => e.value === form.especialidad)?.label || "—"}</span>
                </div>
              </div>

              {/* Security badge */}
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldIcon className="h-3.5 w-3.5 text-[var(--ht-accent)]" />
                Tus datos están protegidos con encriptación de extremo a extremo
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Atras
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !canAdvanceStep1}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {selectedPlan ? "Redirigiendo al pago..." : "Enviando solicitud..."}
                    </>
                  ) : (
                    <>
                      {selectedPlan ? "Continuar al pago" : "Solicitar Prueba Gratuita"}
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Ya tenes cuenta?{" "}
        <Link
          href="/login"
          className="font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          Iniciar Sesion
        </Link>
      </p>
    </div>
  );
}
