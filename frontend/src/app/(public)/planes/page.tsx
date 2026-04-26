"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Plan } from "@/types";
import { plansService } from "@/services/plans.service";

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
  csv_export: "Exportación CSV",
  custom_branding: "Branding Personalizado",
  api_access: "Acceso API",
  audit_logs: "Registro de Auditoría",
  priority_support: "Soporte Prioritario",
  inventario: "Inventario",
  pagos: "Gestión de Pagos",
  proveedores: "Proveedores",
};

const ALL_FEATURE_KEYS = [
  "inventario",
  "pagos",
  "proveedores",
  "csv_export",
  "whatsapp_reminders",
  "whatsapp_agent",
  "advanced_reports",
  "custom_branding",
  "audit_logs",
  "multi_consultorio",
  "api_access",
  "priority_support",
];

/* ── Icons ── */

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-[var(--ht-accent)]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-muted-foreground/30"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

/* ── Plan Card ── */

function PlanCard({
  plan,
  annual,
  discount,
}: {
  plan: Plan;
  annual: boolean;
  discount: number;
}) {
  const price = annual
    ? Math.round(Number(plan.precio_mensual) * discount)
    : Number(plan.precio_mensual);

  const features = ALL_FEATURE_KEYS.map((key) => ({
    key,
    label: FEATURE_LABELS[key] || key,
    included: !!plan.features?.[key],
  }));

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-7 h-full transition-all duration-300 ${
        plan.is_highlighted
          ? "border-[var(--ht-primary)]/40 bg-gradient-to-b from-[var(--ht-primary)]/[0.07] to-card shadow-2xl shadow-[var(--ht-primary)]/15 ring-1 ring-[var(--ht-primary)]/25"
          : "border-border/60 bg-card hover:border-[var(--ht-primary)]/20 hover:shadow-lg hover:shadow-[var(--ht-primary)]/5"
      }`}
    >
      {/* Popular badge */}
      {plan.is_highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-5 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap tracking-wide uppercase">
          Más popular
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold tracking-tight">{plan.nombre}</h3>
        {plan.descripcion && (
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {plan.descripcion}
          </p>
        )}
      </div>

      {/* Price block */}
      <div
        className={`rounded-xl p-4 mb-6 ${
          plan.is_highlighted
            ? "bg-[var(--ht-primary)]/8 border border-[var(--ht-primary)]/15"
            : "bg-muted/40 border border-border/40"
        }`}
      >
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] bg-clip-text text-transparent">
            {fmt(price)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">/mes</span>
        </div>
        {annual && (
          <p className="mt-1 text-xs text-muted-foreground">
            <span className="line-through">{fmt(Number(plan.precio_mensual))}/mes</span>
            <span className="ml-2 font-semibold text-[var(--ht-accent)]">
              Ahorrás 20%
            </span>
          </p>
        )}
      </div>

      {/* Limits pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          {plan.max_usuarios} usuario{plan.max_usuarios > 1 ? "s" : ""}
        </span>
        <span className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          {plan.max_pacientes
            ? `${plan.max_pacientes.toLocaleString("es-AR")} pacientes`
            : "Pacientes ilimitados"}
        </span>
        {plan.max_sucursales && (
          <span className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            {plan.max_sucursales} sucursal{plan.max_sucursales > 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* Features */}
      <ul className="flex-1 space-y-2.5 mb-8">
        {features.map((f) => (
          <li key={f.key} className="flex items-center gap-3">
            {f.included ? <CheckIcon /> : <XIcon />}
            <span
              className={`text-sm ${
                f.included ? "text-foreground" : "text-muted-foreground/40 line-through"
              }`}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {Number(plan.precio_mensual) > 0 ? (
        <Link
          href={`/register?plan=${plan.id}`}
          className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
            plan.is_highlighted
              ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-lg shadow-[var(--ht-primary)]/25 hover:opacity-90 hover:shadow-[var(--ht-primary)]/40"
              : "border-2 border-border bg-transparent text-foreground hover:border-[var(--ht-primary)]/30 hover:bg-[var(--ht-primary)]/5"
          }`}
        >
          Contratar ahora
        </Link>
      ) : (
        <Link
          href="/register"
          className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
            plan.is_highlighted
              ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-lg shadow-[var(--ht-primary)]/25 hover:opacity-90 hover:shadow-[var(--ht-primary)]/40"
              : "border-2 border-border bg-transparent text-foreground hover:border-[var(--ht-primary)]/30 hover:bg-[var(--ht-primary)]/5"
          }`}
        >
          Empezar prueba gratuita
        </Link>
      )}
    </div>
  );
}

/* ── Page ── */

export default function PlanesPage() {
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const discount = 0.8;

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = carouselRef.current;
      if (!el) return;
      const card = el.children[index] as HTMLElement | undefined;
      if (card) {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const containerCenter = el.offsetWidth / 2;
        el.scrollTo({
          left: cardCenter - containerCenter,
          behavior: "smooth",
        });
        setActiveIndex(index);
      }
    },
    []
  );

  const handleScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el || plans.length === 0) return;
    const scrollCenter = el.scrollLeft + el.offsetWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(scrollCenter - childCenter);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setActiveIndex(closest);
  }, [plans.length]);

  useEffect(() => {
    plansService
      .getActivePlans()
      .then((data) => {
        setPlans(data.filter((p) => !p.is_default_trial));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /* On desktop (lg+), center the highlighted plan */
  useEffect(() => {
    if (!loading && plans.length > 0) {
      const highlightedIdx = plans.findIndex((p) => p.is_highlighted);
      if (highlightedIdx >= 0) {
        setTimeout(() => scrollToIndex(highlightedIdx), 100);
      }
    }
  }, [loading, plans, scrollToIndex]);

  return (
    <>
      {/* ── Header ── */}
      <section className="relative overflow-hidden pt-16 pb-8 sm:pt-24 sm:pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-br from-[var(--ht-primary)]/15 via-[var(--ht-primary-light)]/15 to-[var(--ht-accent-dark)]/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl text-center px-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--ht-primary)]/20 bg-[var(--ht-primary)]/8 px-4 py-1.5 text-sm font-medium text-[var(--ht-primary)]">
            <SparkleIcon />
            14 días de prueba gratis
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Elegí el plan ideal para tu{" "}
            <span className="bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text text-transparent">
              clínica
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Todos los planes incluyen 14 días de trial sin tarjeta de crédito.
            Cancelá cuando quieras.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-1 rounded-full border border-border/50 bg-card p-1.5 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                !annual
                  ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                annual
                  ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
                  annual
                    ? "bg-white/20 text-white"
                    : "bg-[var(--ht-accent)]/15 text-[var(--ht-accent)]"
                }`}
              >
                −20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Plans carousel ── */}
      <section className="pb-28 sm:pb-36">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            /* Skeleton */
            <div className="flex gap-6 justify-center">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="skeleton h-[520px] w-[300px] flex-shrink-0 rounded-2xl"
                />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium">
                Los planes estarán disponibles pronto.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Edge fade overlays */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-4 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10" />

              {/* Navigation arrows */}
              {plans.length > 1 && (
                <>
                  <button
                    onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
                    disabled={activeIndex === 0}
                    aria-label="Plan anterior"
                    className="absolute left-0 sm:-left-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/90 backdrop-blur-sm shadow-lg text-foreground transition-all hover:bg-card hover:border-[var(--ht-primary)]/30 hover:text-[var(--ht-primary)] hover:shadow-[var(--ht-primary)]/10 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border/60 disabled:hover:text-foreground"
                  >
                    <ChevronLeftIcon />
                  </button>
                  <button
                    onClick={() =>
                      scrollToIndex(Math.min(plans.length - 1, activeIndex + 1))
                    }
                    disabled={activeIndex === plans.length - 1}
                    aria-label="Plan siguiente"
                    className="absolute right-0 sm:-right-3 top-1/2 -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card/90 backdrop-blur-sm shadow-lg text-foreground transition-all hover:bg-card hover:border-[var(--ht-primary)]/30 hover:text-[var(--ht-primary)] hover:shadow-[var(--ht-primary)]/10 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-card disabled:hover:border-border/60 disabled:hover:text-foreground"
                  >
                    <ChevronRightIcon />
                  </button>
                </>
              )}

              {/* Carousel track */}
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth py-6 px-8 sm:px-12"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {plans.map((plan, i) => (
                  <div
                    key={plan.id}
                    onClick={() => scrollToIndex(i)}
                    className={`snap-center flex-shrink-0 transition-all duration-300 cursor-pointer w-[80vw] sm:w-[340px] lg:w-[360px] ${
                      i === activeIndex
                        ? "opacity-100 scale-100"
                        : "opacity-60 scale-[0.97] hover:opacity-80"
                    }`}
                  >
                    <PlanCard plan={plan} annual={annual} discount={discount} />
                  </div>
                ))}
              </div>

              {/* Dot indicators */}
              {plans.length > 1 && (
                <div className="flex justify-center items-center gap-2.5 mt-2">
                  {plans.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToIndex(i)}
                      aria-label={`Ir al plan ${p.nombre}`}
                      className={`rounded-full transition-all duration-300 ${
                        i === activeIndex
                          ? "w-10 h-2.5 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)]"
                          : "w-2.5 h-2.5 bg-border hover:bg-muted-foreground/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom note */}
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Todos los precios están en pesos argentinos (ARS) e incluyen IVA.
            <br className="hidden sm:block" />
            ¿Necesitás algo personalizado?{" "}
            <a
              href="mailto:soporte@avaxhealth.com"
              className="font-medium text-[var(--ht-primary)] hover:opacity-80 transition-opacity"
            >
              Contactanos
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
