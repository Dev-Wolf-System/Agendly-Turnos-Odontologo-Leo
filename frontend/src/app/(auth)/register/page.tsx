"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import { plansService } from "@/services/plans.service";
import type { Plan } from "@/types";
import api from "@/services/api";
import {
  IconCheck,
  IconArrowRight,
  IconShieldCheck,
} from "@/components/landing/landing-icons";

/* ── Iconos locales mínimos ── */

function IconBuilding({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
      <path d="M2 20h20" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
    </svg>
  );
}

function IconUser({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconEye({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function IconArrowLeft({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

function IconSparkle({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

/* ── Constantes ── */

const ESPECIALIDADES = [
  { value: "odontologia", label: "Odontología" },
  { value: "medicina_general", label: "Medicina General" },
  { value: "pediatria", label: "Pediatría" },
  { value: "dermatologia", label: "Dermatología" },
  { value: "oftalmologia", label: "Oftalmología" },
  { value: "kinesiologia", label: "Kinesiología" },
  { value: "nutricion", label: "Nutrición" },
  { value: "psicologia", label: "Psicología" },
  { value: "traumatologia", label: "Traumatología" },
  { value: "cardiologia", label: "Cardiología" },
  { value: "ginecologia", label: "Ginecología" },
  { value: "urologia", label: "Urología" },
  { value: "veterinaria", label: "Veterinaria" },
  { value: "otra", label: "Otra especialidad" },
];

const STEPS = [
  { label: "Clínica", Icon: IconBuilding },
  { label: "Cuenta", Icon: IconUser },
];

/* ── Wrapper ── */

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--ht-primary)] border-t-transparent" />
        </div>
      }
    >
      <RegisterFormBg />
    </Suspense>
  );
}

/* ── Wrapper con fondo decorativo ── */

function RegisterFormBg() {
  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center py-12 px-4 sm:py-20">
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-20 h-[420px] w-[420px] rounded-full bg-[var(--ht-primary-light)]/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-[420px] w-[420px] rounded-full bg-[var(--ht-accent)]/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(14,165,233,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />
      </div>
      <RegisterForm />
    </div>
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
      setError("Las contraseñas no coinciden");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
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

  /* ── Success state ── */
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
        <div className="rounded-3xl border border-border bg-card shadow-2xl p-9">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--ht-accent)] to-[var(--ht-accent-dark)] shadow-md mb-5">
            <IconCheck size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-2">
            Solicitud enviada
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-7">
            Tu solicitud de prueba gratuita fue recibida correctamente.
            Nuestro equipo la revisará y te contactaremos por email a{" "}
            <span className="font-semibold text-foreground">{form.email}</span>{" "}
            cuando sea aprobada.
          </p>
          <div className="rounded-xl bg-muted/40 border border-border p-5 mb-7 text-left">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">
              Resumen de tu solicitud
            </p>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Clínica:</span>
              <span className="font-semibold">{form.clinica_nombre}</span>
              <span className="text-muted-foreground">Especialidad:</span>
              <span className="font-semibold">
                {ESPECIALIDADES.find((e) => e.value === form.especialidad)?.label || "—"}
              </span>
              <span className="text-muted-foreground">Administrador:</span>
              <span className="font-semibold">{form.nombre} {form.apellido}</span>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] px-7 py-3 text-sm font-bold text-white shadow-[0_8px_24px] shadow-[var(--ht-primary)]/30 hover:shadow-[var(--ht-primary)]/45 hover:-translate-y-0.5 transition-all"
          >
            <IconArrowLeft size={14} />
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  /* ── Form principal ── */
  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-block">
          <Image
            src="/logo.png"
            alt="Avax Health"
            width={56}
            height={56}
            className="mx-auto mb-4 rounded-xl shadow-md"
          />
        </Link>
        <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-3">
          {selectedPlan ? `Plan ${selectedPlan.nombre}` : "Prueba gratuita · 14 días"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.025em]">
          {selectedPlan ? "Contratá tu plan" : "Empezá gratis con Avax Health"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Configurá tu clínica en menos de 2 minutos
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-7">
        {STEPS.map((s, i) => {
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={s.label} className="flex items-center">
              {i > 0 && (
                <div
                  className={`h-[2px] w-12 sm:w-20 transition-colors ${
                    isDone ? "bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent)]" : "bg-border"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => isDone && setStep(i)}
                disabled={!isDone && !isActive}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-primary)] text-white shadow-md scale-105"
                    : isDone
                      ? "bg-[var(--ht-accent)]/10 text-[var(--ht-accent-dark)] hover:bg-[var(--ht-accent)]/20 cursor-pointer"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {isDone ? <IconCheck size={14} /> : <s.Icon size={14} />}
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Plan card preview (si viene con ?plan=) */}
      {selectedPlan && (
        <div className="mb-6 rounded-2xl border border-[var(--ht-primary-light)]/30 bg-gradient-to-br from-[var(--ht-primary-light)]/8 to-[var(--ht-accent)]/5 p-4 sm:p-5 flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] shadow-md text-white">
            <IconSparkle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Plan seleccionado
            </div>
            <div className="text-base font-bold tracking-tight">{selectedPlan.nombre}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              ${Number(selectedPlan.precio_mensual).toLocaleString("es-AR")}/mes ·{" "}
              {selectedPlan.max_usuarios} usuario{selectedPlan.max_usuarios > 1 ? "s" : ""} ·{" "}
              {selectedPlan.max_pacientes ? `${selectedPlan.max_pacientes.toLocaleString("es-AR")} pacientes` : "pacientes ilimitados"}
            </div>
          </div>
        </div>
      )}

      {/* Card del form */}
      <div className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* ── Step 0: Datos de clínica ── */}
          {step === 0 && (
            <div className="p-7 sm:p-9">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ht-primary-light)]/10 text-[var(--ht-primary-dark)]">
                  <IconBuilding size={16} />
                </div>
                <h2 className="text-lg font-bold tracking-tight">Datos de tu clínica</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 ml-11">
                Esta información se usa para configurar tu espacio de trabajo.
              </p>

              {/* Trial badge (solo si no hay plan pago) */}
              {!selectedPlan && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-[var(--ht-accent)]/25 bg-[var(--ht-accent)]/5 p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-accent)] to-[var(--ht-accent-dark)] shadow-sm text-white">
                    <IconSparkle size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">Prueba gratuita — 14 días</p>
                    <p className="text-xs text-muted-foreground">
                      Sin tarjeta de crédito. Acceso completo al sistema.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Nombre de la Clínica *
                  </label>
                  <input
                    value={form.clinica_nombre}
                    onChange={(e) => updateField("clinica_nombre", e.target.value)}
                    placeholder="Ej: Clínica Dental Sonrisa"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-primary-light)]/25 focus:border-[var(--ht-primary-light)] transition-all placeholder:text-muted-foreground/50"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Especialidad *
                  </label>
                  <select
                    value={form.especialidad}
                    onChange={(e) => updateField("especialidad", e.target.value)}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-primary-light)]/25 focus:border-[var(--ht-primary-light)] transition-all"
                    required
                  >
                    <option value="">Seleccioná una especialidad</option>
                    {ESPECIALIDADES.map((esp) => (
                      <option key={esp.value} value={esp.value}>
                        {esp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      Nombre del Propietario
                    </label>
                    <input
                      value={form.nombre_propietario}
                      onChange={(e) => updateField("nombre_propietario", e.target.value)}
                      placeholder="Dr. García"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-primary-light)]/25 focus:border-[var(--ht-primary-light)] transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      Teléfono de la Clínica
                    </label>
                    <input
                      value={form.clinica_cel}
                      onChange={(e) => updateField("clinica_cel", e.target.value)}
                      placeholder="+54 11 1234-5678"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-primary-light)]/25 focus:border-[var(--ht-primary-light)] transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  disabled={!canAdvanceStep0}
                  onClick={() => setStep(1)}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] px-7 py-3 text-sm font-bold text-white shadow-[0_8px_24px] shadow-[var(--ht-primary)]/30 hover:shadow-[var(--ht-primary)]/45 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  Continuar
                  <IconArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Cuenta admin ── */}
          {step === 1 && (
            <div className="p-7 sm:p-9">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ht-accent)]/10 text-[var(--ht-accent-dark)]">
                  <IconUser size={16} />
                </div>
                <h2 className="text-lg font-bold tracking-tight">Tu cuenta de administrador</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 ml-11">
                Con estos datos vas a poder acceder al sistema.
              </p>

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3.5 text-sm text-destructive mb-5">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      Nombre *
                    </label>
                    <input
                      value={form.nombre}
                      onChange={(e) => updateField("nombre", e.target.value)}
                      placeholder="Juan"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-primary-light)]/25 focus:border-[var(--ht-primary-light)] transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      Apellido *
                    </label>
                    <input
                      value={form.apellido}
                      onChange={(e) => updateField("apellido", e.target.value)}
                      placeholder="García"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-primary-light)]/25 focus:border-[var(--ht-primary-light)] transition-all placeholder:text-muted-foreground/50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="tu@clinica.com"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-primary-light)]/25 focus:border-[var(--ht-primary-light)] transition-all placeholder:text-muted-foreground/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        placeholder="Mín. 6 caracteres"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-primary-light)]/25 focus:border-[var(--ht-primary-light)] transition-all placeholder:text-muted-foreground/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                    </div>
                    {form.password.length > 0 && form.password.length < 6 && (
                      <p className="text-[11px] text-amber-600">Mínimo 6 caracteres</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      Confirmar contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) => updateField("confirmPassword", e.target.value)}
                        placeholder="Repetí tu contraseña"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-[var(--ht-primary-light)]/25 focus:border-[var(--ht-primary-light)] transition-all placeholder:text-muted-foreground/50"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showConfirm ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                      </button>
                    </div>
                    {form.confirmPassword.length > 0 &&
                      form.password !== form.confirmPassword && (
                        <p className="text-[11px] text-red-500">Las contraseñas no coinciden</p>
                      )}
                  </div>
                </div>
              </div>

              {/* Resumen */}
              <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2.5">
                  Resumen
                </p>
                <div className="grid grid-cols-[100px_1fr] gap-y-2 text-sm">
                  <span className="text-muted-foreground">Plan:</span>
                  {selectedPlan ? (
                    <span className="font-semibold text-[var(--ht-primary)]">
                      {selectedPlan.nombre} — ${Number(selectedPlan.precio_mensual).toLocaleString("es-AR")}/mes
                    </span>
                  ) : (
                    <span className="font-semibold text-[var(--ht-accent-dark)]">Prueba gratuita (14 días)</span>
                  )}
                  <span className="text-muted-foreground">Clínica:</span>
                  <span className="font-semibold truncate">{form.clinica_nombre || "—"}</span>
                  <span className="text-muted-foreground">Admin:</span>
                  <span className="font-semibold truncate">
                    {form.nombre && form.apellido ? `${form.nombre} ${form.apellido}` : "—"}
                  </span>
                  <span className="text-muted-foreground">Especialidad:</span>
                  <span className="font-semibold">{ESPECIALIDADES.find(e => e.value === form.especialidad)?.label || "—"}</span>
                </div>
              </div>

              {/* Security badge */}
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <IconShieldCheck size={14} className="text-[var(--ht-accent-dark)]" />
                Tus datos están protegidos con encriptación de extremo a extremo
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors"
                >
                  <IconArrowLeft size={14} />
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !canAdvanceStep1}
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] px-7 py-3 text-sm font-bold text-white shadow-[0_8px_24px] shadow-[var(--ht-primary)]/30 hover:shadow-[var(--ht-primary)]/45 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {selectedPlan ? "Redirigiendo al pago..." : "Enviando solicitud..."}
                    </>
                  ) : (
                    <>
                      {selectedPlan ? "Continuar al pago" : "Solicitar prueba gratuita"}
                      <IconArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground mt-7">
        ¿Ya tenés cuenta?{" "}
        <Link
          href="/login"
          className="font-bold text-[var(--ht-primary)] hover:opacity-80 transition-opacity"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
