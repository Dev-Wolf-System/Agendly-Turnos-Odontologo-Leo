"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import api from "@/services/api";

/* ── Iconos ── */

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-7 w-7"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

/* ── Estados ── */

type PageState =
  | "polling"       // verificando con MP
  | "paid"          // suscripción activa confirmada
  | "fallback_ask"  // timeout: ofrecer opciones
  | "confirming"    // usuario eligió trial: mostrar confirmación
  | "trial"         // trial activado, pendiente de aprobación
  | "error";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 40_000;

/* ── Componente ── */

function BienvenidaContent() {
  const searchParams = useSearchParams();
  const clinicaId = searchParams.get("clinica_id");

  const [state, setState] = useState<PageState>(clinicaId ? "polling" : "paid");
  const [loading, setLoading] = useState(false);

  /* Polling de estado de suscripción */
  useEffect(() => {
    if (!clinicaId) return;

    let elapsed = 0;
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const { data } = await api.get<{ estado: string | null }>(`/billing/status/${clinicaId}`);
        if (data.estado === "activa") {
          setState("paid");
          return;
        }
      } catch { /* ignorar errores de red */ }

      elapsed += POLL_INTERVAL_MS;
      if (elapsed >= POLL_MAX_MS) {
        setState("fallback_ask");
        return;
      }
      setTimeout(poll, POLL_INTERVAL_MS);
    };

    setTimeout(poll, POLL_INTERVAL_MS);
    return () => { stopped = true; };
  }, [clinicaId]);

  /* Confirmar conversión a trial */
  const handleConfirmTrial = async () => {
    setLoading(true);
    try {
      await api.post("/billing/fallback-trial", { clinica_id: clinicaId });
      setState("trial");
    } catch {
      setState("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <Image src="/logo.png" alt="Avax Health" width={52} height={52} className="mx-auto mb-6 rounded-xl shadow-md" />

      <div className="rounded-2xl border bg-card shadow-lg p-8">

        {/* ── Verificando ── */}
        {state === "polling" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10 mb-5">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Verificando tu pago...</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Estamos confirmando la autorización con Mercado Pago. Esto puede tomar unos segundos.
            </p>
          </>
        )}

        {/* ── Pago exitoso ── */}
        {state === "paid" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--ht-accent)]/10 mb-5 text-[var(--ht-accent)]">
              <CheckIcon />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">¡Bienvenido a Avax Health!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Tu suscripción fue activada. Ya podés iniciar sesión y empezar a gestionar tu clínica.
            </p>
            <div className="rounded-xl bg-muted/40 border border-border/50 p-4 mb-6 text-left space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Próximos pasos</p>
              {[
                "Iniciá sesión con tu email y contraseña",
                "Completá la configuración de tu clínica",
                "Invitá a tu equipo de profesionales",
                "Conectá WhatsApp para activar el agente IA Avax",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent)] text-[10px] font-bold text-white">{i + 1}</span>
                  <span className="text-sm text-foreground">{step}</span>
                </div>
              ))}
            </div>
            <Link href="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-95 transition-all">
              Iniciar sesión <ArrowIcon />
            </Link>
          </>
        )}

        {/* ── Timeout: opciones ── */}
        {state === "fallback_ask" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-amber-500/10 mb-5 text-amber-500">
              <ClockIcon />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">El pago no se completó</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              No recibimos confirmación del pago. <strong className="text-foreground">Tu cuenta ya fue creada</strong> y podés elegir cómo continuar.
            </p>

            <div className="my-5 space-y-3">
              {/* Opción A: reintentar pago */}
              <div className="rounded-xl border border-border/80 p-4 text-left">
                <p className="text-sm font-semibold mb-1">Reintentar el pago</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Iniciá sesión y desde el panel de suscripción podés volver a intentar el pago con el plan que prefieras.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
                >
                  Ir al inicio de sesión <ArrowIcon />
                </Link>
              </div>

              {/* Opción B: prueba gratuita */}
              <div className="rounded-xl border border-[var(--ht-accent)]/30 bg-[var(--ht-accent)]/[0.03] p-4 text-left">
                <p className="text-sm font-semibold mb-1">Activar prueba gratuita</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Tu cuenta quedará pendiente de aprobación. El equipo de Avax Health la revisará y te notificará por email.
                </p>
                <button
                  onClick={() => setState("confirming")}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all"
                >
                  Continuar con prueba gratuita <ArrowIcon />
                </button>
              </div>
            </div>

            <a href="mailto:soporte@avaxhealth.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ¿Necesitás ayuda? soporte@avaxhealth.com
            </a>
          </>
        )}

        {/* ── Confirmación de trial ── */}
        {state === "confirming" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--ht-accent)]/10 mb-5 text-[var(--ht-accent)]">
              <CheckIcon className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">¿Activar prueba gratuita?</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Tu cuenta pasará al plan de prueba de <strong className="text-foreground">14 días</strong>, pendiente de aprobación manual por nuestro equipo.
            </p>

            <div className="rounded-xl bg-muted/50 border border-border/60 p-4 mb-5 text-left space-y-2">
              {[
                "Tu cuenta ya está creada con tus datos.",
                "El equipo de Avax Health revisará y habilitará tu acceso.",
                "Una vez dentro, podrás volver a suscribirte al plan que prefieras desde el panel de suscripción.",
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckIcon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-[var(--ht-accent)]" />
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirmTrial}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-60"
              >
                {loading
                  ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : <>Sí, activar prueba gratuita <ArrowIcon /></>
                }
              </button>
              <button
                onClick={() => setState("fallback_ask")}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                <ArrowLeftIcon /> Volver
              </button>
            </div>
          </>
        )}

        {/* ── Trial activado ── */}
        {state === "trial" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--ht-accent)]/10 mb-5 text-[var(--ht-accent)]">
              <CheckIcon />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">¡Solicitud enviada!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Tu cuenta está en revisión. Recibirás un email cuando el equipo de Avax Health habilite tu acceso.
            </p>
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 mb-5 text-left flex items-start gap-2">
              <InfoIcon />
              <p className="text-xs text-muted-foreground">
                Una vez aprobado, podés acceder con tu email y contraseña, y desde el panel de suscripción elegir el plan que querés contratar.
              </p>
            </div>
            <Link href="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors">
              Ir al inicio de sesión
            </Link>
          </>
        )}

        {/* ── Error ── */}
        {state === "error" && (
          <>
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10 mb-5 text-destructive">
              <XIcon />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2">Algo salió mal</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              No pudimos procesar tu solicitud. Tu cuenta está creada — contactanos y te ayudamos.
            </p>
            <a href="mailto:soporte@avaxhealth.com" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-6 py-3 text-sm font-semibold text-white shadow-md">
              soporte@avaxhealth.com
            </a>
          </>
        )}

      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        ¿Preguntas?{" "}
        <a href="mailto:soporte@avaxhealth.com" className="font-medium text-[var(--ht-primary)] hover:opacity-80 transition-opacity">
          soporte@avaxhealth.com
        </a>
      </p>
    </div>
  );
}

export default function BienvenidaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Suspense fallback={<div className="flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
        <BienvenidaContent />
      </Suspense>
    </div>
  );
}
