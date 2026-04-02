"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/auth.service";
import { plansService } from "@/services/plans.service";
import type { Plan } from "@/types";

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

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const FEATURE_LABELS: Record<string, string> = {
  whatsapp_agent: "WhatsApp + IA",
  whatsapp_reminders: "Recordatorios WhatsApp",
  multi_consultorio: "Multi-Consultorio",
  advanced_reports: "Reportes Avanzados",
  csv_export: "Exportacion CSV",
  custom_branding: "Branding Personalizado",
  api_access: "Acceso API",
  audit_logs: "Registro de Auditoria",
  priority_support: "Soporte Prioritario",
  inventario: "Inventario",
  pagos: "Gestion de Pagos",
  proveedores: "Proveedores",
};

const STEPS = [
  { label: "Plan", icon: SparkleIcon },
  { label: "Clinica", icon: BuildingIcon },
  { label: "Cuenta", icon: UserIcon },
];

/* ── Main component wrapped in Suspense ── */

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1b3553] border-t-transparent" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const planIdFromUrl = searchParams.get("plan");

  const [step, setStep] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(planIdFromUrl);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    clinica_nombre: "",
    nombre_propietario: "",
    clinica_cel: "",
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    plansService
      .getActivePlans()
      .then((data) => {
        setPlans(data.filter((p) => !p.is_default_trial));
        // Si no viene plan de la URL, no preseleccionar (se hace en step 0)
      })
      .catch(console.error)
      .finally(() => setLoadingPlans(false));
  }, []);

  // Si viene planId de URL y ya cargaron los planes, saltar al step 1
  useEffect(() => {
    if (planIdFromUrl && plans.length > 0) {
      const found = plans.find((p) => p.id === planIdFromUrl);
      if (found) {
        setSelectedPlanId(found.id);
        setStep(1);
      }
    }
  }, [planIdFromUrl, plans]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canAdvanceStep1 =
    form.clinica_nombre.trim().length > 0;

  const canAdvanceStep2 =
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
      const response = await authService.register({
        clinica_nombre: form.clinica_nombre,
        nombre_propietario: form.nombre_propietario || undefined,
        clinica_cel: form.clinica_cel || undefined,
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
      });
      if (response.access_token) {
        window.location.href = "/dashboard";
        return;
      }
      setError("Error inesperado en el registro");
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Error al registrar la cuenta";
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight">Crea tu cuenta</h1>
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
                    isDone ? "bg-[#1b3553]" : "bg-border"
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
                    ? "bg-gradient-to-r from-[#1b3553] to-[#5bbcad] text-white shadow-md"
                    : isDone
                    ? "bg-[#1b3553]/10 text-[#1b3553] hover:bg-[#1b3553]/20 cursor-pointer"
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
      <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* ── Step 0: Plan Selection ── */}
          {step === 0 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-1">
                <SparkleIcon className="h-5 w-5 text-[#1b3553]" />
                <h2 className="text-lg font-bold">Elige tu plan</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Todos incluyen 14 dias de trial gratuito. Podes cambiar de plan en cualquier momento.
              </p>

              {loadingPlans ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-40 rounded-xl border animate-pulse bg-muted/30" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    const activeFeatures = Object.entries(plan.features ?? {})
                      .filter(([, v]) => v)
                      .map(([k]) => FEATURE_LABELS[k] || k);

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`relative text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                          isSelected
                            ? "border-[#1b3553] bg-[#1b3553]/[0.04] ring-1 ring-[#1b3553]/20 shadow-md"
                            : "border-border/60 hover:border-border hover:shadow-sm"
                        }`}
                      >
                        {plan.is_highlighted && (
                          <span className="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-[#1b3553] to-[#5bbcad] px-2.5 py-0.5 text-[10px] font-semibold text-white">
                            Popular
                          </span>
                        )}

                        {/* Radio indicator */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-sm">{plan.nombre}</h3>
                            {plan.descripcion && (
                              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                {plan.descripcion}
                              </p>
                            )}
                          </div>
                          <div
                            className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? "border-[#1b3553] bg-[#1b3553]"
                                : "border-muted-foreground/30"
                            }`}
                          >
                            {isSelected && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-baseline gap-1 mb-2">
                          <span className="text-xl font-bold">
                            {fmt(Number(plan.precio_mensual))}
                          </span>
                          <span className="text-xs text-muted-foreground">/mes</span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                            {plan.max_usuarios} usuario{plan.max_usuarios > 1 ? "s" : ""}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                            {plan.max_pacientes
                              ? `${plan.max_pacientes.toLocaleString("es-AR")} pac.`
                              : "Ilimitados"}
                          </span>
                        </div>

                        {activeFeatures.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {activeFeatures.slice(0, 4).map((f) => (
                              <span
                                key={f}
                                className="inline-flex items-center gap-0.5 text-[10px] text-[#1b3553] font-medium"
                              >
                                <CheckIcon className="h-2.5 w-2.5 text-emerald-500" />
                                {f}
                              </span>
                            ))}
                            {activeFeatures.length > 4 && (
                              <span className="text-[10px] text-muted-foreground font-medium">
                                +{activeFeatures.length - 4} mas
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  disabled={!selectedPlanId}
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3553] to-[#5bbcad] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 1: Clinic data ── */}
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-1">
                <BuildingIcon className="h-5 w-5 text-[#1b3553]" />
                <h2 className="text-lg font-bold">Datos de tu clinica</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Esta informacion se usara para configurar tu espacio de trabajo.
              </p>

              {/* Selected plan chip */}
              {selectedPlan && (
                <div className="mb-6 flex items-center gap-3 rounded-xl border border-[#1b3553]/20 bg-[#1b3553]/[0.04] p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1b3553] to-[#5bbcad] shadow-sm">
                    <SparkleIcon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{selectedPlan.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmt(Number(selectedPlan.precio_mensual))}/mes — 14 dias gratis
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="text-xs font-medium text-[#1b3553] hover:text-[#2a4f73] transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Nombre de la Clinica *
                  </label>
                  <input
                    value={form.clinica_nombre}
                    onChange={(e) => updateField("clinica_nombre", e.target.value)}
                    placeholder="Ej: Clinica Dental Sonrisa"
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 focus:border-[#1b3553] transition-all placeholder:text-muted-foreground/50"
                    required
                  />
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
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 focus:border-[#1b3553] transition-all placeholder:text-muted-foreground/50"
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
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 focus:border-[#1b3553] transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
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
                  type="button"
                  disabled={!canAdvanceStep1}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3553] to-[#5bbcad] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Account data ── */}
          {step === 2 && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-2.5 mb-1">
                <UserIcon className="h-5 w-5 text-[#1b3553]" />
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
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 focus:border-[#1b3553] transition-all placeholder:text-muted-foreground/50"
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
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 focus:border-[#1b3553] transition-all placeholder:text-muted-foreground/50"
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
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 focus:border-[#1b3553] transition-all placeholder:text-muted-foreground/50"
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
                        className="w-full rounded-xl border bg-background px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 focus:border-[#1b3553] transition-all placeholder:text-muted-foreground/50"
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
                        className="w-full rounded-xl border bg-background px-4 py-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#1b3553]/20 focus:border-[#1b3553] transition-all placeholder:text-muted-foreground/50"
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
                  <span className="font-medium">{selectedPlan?.nombre ?? "Trial Gratuito"}</span>
                  <span className="text-muted-foreground">Clinica:</span>
                  <span className="font-medium">{form.clinica_nombre || "—"}</span>
                  <span className="text-muted-foreground">Admin:</span>
                  <span className="font-medium">
                    {form.nombre && form.apellido ? `${form.nombre} ${form.apellido}` : "—"}
                  </span>
                  <span className="text-muted-foreground">Trial:</span>
                  <span className="font-medium text-emerald-600">14 dias gratis</span>
                </div>
              </div>

              {/* Security badge */}
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldIcon className="h-3.5 w-3.5 text-emerald-500" />
                Tus datos estan protegidos con encriptacion de extremo a extremo
              </div>

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Atras
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !canAdvanceStep2}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3553] to-[#5bbcad] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Crear mi cuenta
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
          className="font-semibold text-[#1b3553] hover:text-[#2a4f73] transition-colors"
        >
          Iniciar Sesion
        </Link>
      </p>
    </div>
  );
}
