"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useClinica } from "@/components/providers/clinica-provider";
import clinicaService from "@/services/clinica.service";

const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

const DEFAULT_HORARIO = {
  manana: { apertura: "08:00", cierre: "12:00", activo: true },
  tarde: { apertura: "14:00", cierre: "18:00", activo: true },
};

const DEFAULT_HORARIOS = Object.fromEntries(
  DIAS.map((d) => [d, d === "sabado" || d === "domingo"
    ? { manana: { ...DEFAULT_HORARIO.manana, activo: d === "sabado" }, tarde: { ...DEFAULT_HORARIO.tarde, activo: false } }
    : { ...DEFAULT_HORARIO }
  ])
);

/* ── SVG Icons ── */
function SparklesIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
      <path d="M12 10h.01" /><path d="M12 14h.01" />
      <path d="M16 10h.01" /><path d="M16 14h.01" />
      <path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
      <path d="M15 5.764v15" /><path d="M9 3.236v15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
    </svg>
  );
}

const STEPS = [
  { title: "Bienvenida", icon: SparklesIcon },
  { title: "Tu clinica", icon: BuildingIcon },
  { title: "Horarios", icon: ClockIcon },
  { title: "Tour rapido", icon: MapIcon },
  { title: "Listo", icon: CheckIcon },
];

const TOUR_SECTIONS = [
  { name: "Dashboard", desc: "Tus KPIs y la agenda del dia en un vistazo.", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "Turnos", desc: "Calendario con vistas diaria, semanal y lista.", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { name: "Pacientes", desc: "Fichas completas con historial medico y documentos.", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
  { name: "Configuracion", desc: "Personaliza horarios, equipo, tratamientos y mas.", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { clinica, reload } = useClinica();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state for step 1 (clinic info)
  const [direccion, setDireccion] = useState(clinica?.direccion || "");
  const [email, setEmail] = useState(clinica?.email || "");
  const [cel, setCel] = useState(clinica?.cel || "");

  // Form state for step 2 (horarios)
  const [horarios, setHorarios] = useState(clinica?.horarios || DEFAULT_HORARIOS);
  const [duracion, setDuracion] = useState(clinica?.duracion_turno_default || 30);

  const toggleDia = (dia: string, turno: "manana" | "tarde") => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: {
        ...prev[dia],
        [turno]: { ...prev[dia][turno], activo: !prev[dia][turno].activo },
      },
    }));
  };

  const saveClinicInfo = useCallback(async () => {
    setSaving(true);
    try {
      await clinicaService.updateMe({ direccion, email, cel });
    } catch {
      // continue anyway
    } finally {
      setSaving(false);
    }
  }, [direccion, email, cel]);

  const saveHorarios = useCallback(async () => {
    setSaving(true);
    try {
      await clinicaService.updateMe({ horarios, duracion_turno_default: duracion });
    } catch {
      // continue anyway
    } finally {
      setSaving(false);
    }
  }, [horarios, duracion]);

  const finishOnboarding = useCallback(async () => {
    setSaving(true);
    try {
      await clinicaService.updateMe({ onboarding_completado: true });
      await reload();
      onComplete();
    } catch {
      onComplete();
    } finally {
      setSaving(false);
    }
  }, [onComplete, reload]);

  const handleNext = async () => {
    if (step === 1) await saveClinicInfo();
    if (step === 2) await saveHorarios();
    if (step === 4) {
      await finishOnboarding();
      return;
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSkip = async () => {
    await finishOnboarding();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card shadow-2xl">
        {/* Skip button */}
        <button
          onClick={handleSkip}
          disabled={saving}
          className="absolute top-4 right-4 text-xs text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          Omitir
        </button>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 pt-6 px-6">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i === step
                  ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-md"
                  : i < step
                  ? "bg-[var(--ht-accent-dark)]/20 text-[var(--ht-accent)]"
                  : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`hidden sm:block h-px w-8 transition-colors ${i < step ? "bg-[var(--ht-accent-dark)]" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="p-6 sm:p-8">
          {/* ── Step 0: Bienvenida ── */}
          {step === 0 && (
            <div className="text-center py-6">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-lg">
                <SparklesIcon />
              </div>
              <h2 className="text-2xl font-bold">
                Bienvenido a Avax Health{user?.nombre ? `, ${user.nombre.split(" ")[0]}` : ""}
              </h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                Vamos a configurar tu clinica <strong>{clinica?.nombre}</strong> en unos pocos pasos para que puedas empezar a gestionar turnos y pacientes.
              </p>
              <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm mx-auto">
                {[
                  { label: "Rapido", desc: "2 minutos" },
                  { label: "Simple", desc: "Sin complicaciones" },
                  { label: "Flexible", desc: "Personalizable" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border/50 bg-muted/30 p-3 text-center">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 1: Datos clinica ── */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white">
                  <BuildingIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Datos de tu clinica</h2>
                  <p className="text-sm text-muted-foreground">Completa la informacion basica</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Direccion</label>
                  <input
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Av. Corrientes 1234, CABA"
                    className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email de la clinica</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contacto@miclinica.com"
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefono</label>
                    <input
                      type="tel"
                      value={cel}
                      onChange={(e) => setCel(e.target.value)}
                      placeholder="+54 11 1234-5678"
                      className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Horarios ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white">
                  <ClockIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Horarios de atencion</h2>
                  <p className="text-sm text-muted-foreground">Configura los dias y horarios de tu clinica</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duracion de turno por defecto</label>
                <select
                  value={duracion}
                  onChange={(e) => setDuracion(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {[15, 20, 30, 45, 60].map((m) => (
                    <option key={m} value={m}>{m} minutos</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {DIAS.map((dia) => (
                  <div key={dia} className="rounded-xl border border-border/50 bg-muted/20 p-3">
                    <p className="text-sm font-semibold capitalize mb-2">{dia}</p>
                    <div className="flex flex-wrap gap-3">
                      {(["manana", "tarde"] as const).map((turno) => (
                        <label key={turno} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={horarios[dia]?.[turno]?.activo ?? false}
                            onChange={() => toggleDia(dia, turno)}
                            className="rounded border-border"
                          />
                          <span className="capitalize">{turno}</span>
                          <span className="text-muted-foreground">
                            ({horarios[dia]?.[turno]?.apertura} - {horarios[dia]?.[turno]?.cierre})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Tour rapido ── */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white">
                  <MapIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Tour rapido</h2>
                  <p className="text-sm text-muted-foreground">Conoce las secciones principales del sistema</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TOUR_SECTIONS.map((section) => (
                  <div key={section.name} className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 transition-all hover:border-accent/30">
                    <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--ht-primary)]/10 to-[var(--ht-accent)]/10 text-primary">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={section.icon} />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{section.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{section.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Listo ── */}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
                <CheckIcon />
              </div>
              <h2 className="text-2xl font-bold">Tu clinica esta lista</h2>
              <p className="mt-3 text-muted-foreground max-w-md mx-auto">
                Ya podes empezar a usar Avax Health. Agenda turnos, registra pacientes y gestiona tu clinica desde el dashboard.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-sm text-emerald-700 dark:text-emerald-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Prueba gratuita de 14 dias activada
              </div>
            </div>
          )}

          {/* ── Navigation buttons ── */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border/40">
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                </svg>
                Atras
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:from-[var(--ht-primary)] hover:to-[var(--ht-accent)] transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
              {step === 4 ? "Ir al dashboard" : step === 0 ? "Empezar" : "Siguiente"}
              {step < 4 && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
