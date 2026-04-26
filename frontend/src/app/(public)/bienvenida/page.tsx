"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function BienvenidaContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const isSuccess = status === "success" || status === null;

  if (!isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <Image
          src="/logo.png"
          alt="Avax Health"
          width={52}
          height={52}
          className="mx-auto mb-6 rounded-xl shadow-md"
        />
        <div className="rounded-2xl border bg-card shadow-lg p-8">
          <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-destructive/10 mb-5">
            <svg className="h-7 w-7 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2">El pago no se completó</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">
            Hubo un problema al procesar el pago. Tu cuenta fue creada pero no está activa todavía.
            Podés intentarlo de nuevo o contactarnos si necesitás ayuda.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
            >
              Iniciar sesión e intentar de nuevo
            </Link>
            <a
              href="mailto:soporte@avaxhealth.com"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contactar soporte
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <Image
        src="/logo.png"
        alt="Avax Health"
        width={52}
        height={52}
        className="mx-auto mb-6 rounded-xl shadow-md"
      />
      <div className="rounded-2xl border bg-card shadow-lg p-8">
        {/* Icono éxito */}
        <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-[var(--ht-accent)]/10 mb-5">
          <svg className="h-7 w-7 text-[var(--ht-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold tracking-tight mb-2">
          ¡Bienvenido a Avax Health!
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Tu pago fue aprobado y tu cuenta está activa. Ya podés iniciar sesión y comenzar a gestionar tu clínica.
        </p>

        {/* Pasos de inicio */}
        <div className="rounded-xl bg-muted/40 border border-border/50 p-4 mb-6 text-left space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Próximos pasos
          </p>
          {[
            "Iniciá sesión con tu email y contraseña",
            "Completá la configuración de tu clínica",
            "Invitá a tu equipo de profesionales",
            "Conectá WhatsApp para activar el agente IA Zoé",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent)] text-[10px] font-bold text-white">
                {i + 1}
              </span>
              <span className="text-sm text-foreground">{step}</span>
            </div>
          ))}
        </div>

        <Link
          href="/login"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-95 transition-all"
        >
          Iniciar sesión
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        ¿Preguntas?{" "}
        <a
          href="mailto:soporte@avaxhealth.com"
          className="font-medium text-[var(--ht-primary)] hover:opacity-80 transition-opacity"
        >
          soporte@avaxhealth.com
        </a>
      </p>
    </div>
  );
}

export default function BienvenidaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Suspense
        fallback={
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <BienvenidaContent />
      </Suspense>
    </div>
  );
}
