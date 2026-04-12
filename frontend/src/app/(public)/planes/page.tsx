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
  csv_export: "Exportacion CSV",
  custom_branding: "Branding Personalizado",
  api_access: "Acceso API",
  audit_logs: "Registro de Auditoria",
  priority_support: "Soporte Prioritario",
  inventario: "Inventario",
  pagos: "Gestion de Pagos",
  proveedores: "Proveedores",
};

/* ── Icons ── */

function CheckIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-muted-foreground/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

/* ── All feature keys in display order ── */
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

export default function PlanesPage() {
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const discount = 0.8;

  const scrollToIndex = useCallback((index: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (card) {
      el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
    }
  }, []);

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
      if (dist < minDist) { minDist = dist; closest = i; }
    }
    setActiveIndex(closest);
  }, [plans.length]);

  useEffect(() => {
    plansService
      .getActivePlans()
      .then((data) => {
        // Filtrar trial de la grilla de precios (se muestra aparte)
        setPlans(data.filter((p) => !p.is_default_trial));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* ── Header ── */}
      <section className="relative overflow-hidden pt-16 pb-8 sm:pt-24 sm:pb-12">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-gradient-to-br from-[var(--ht-primary)]/15 via-[var(--ht-primary-light)]/15 to-[var(--ht-accent-dark)]/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-3xl text-center px-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-[#0F172A]/10 px-4 py-1.5 text-sm font-medium text-primary/90">
            <SparkleIcon />
            14 dias de prueba gratis
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Elige el plan ideal para tu{" "}
            <span className="bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text text-transparent">
              clinica
            </span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Todos los planes incluyen 14 dias de trial sin tarjeta de credito.
            Cancela cuando quieras.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border/50 bg-card p-1.5 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                !annual
                  ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                annual
                  ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              <span className="ml-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-500">
                -20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Plans grid ── */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex gap-6 overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-[420px] min-w-[320px] flex-shrink-0 rounded-xl border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium">
                Los planes estaran disponibles pronto.
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Carousel navigation arrows */}
              {plans.length > 1 && (
                <>
                  <button
                    onClick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
                    className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-card shadow-lg hover:bg-muted transition-all disabled:opacity-30"
                    disabled={activeIndex === 0}
                    aria-label="Plan anterior"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>
                  <button
                    onClick={() => scrollToIndex(Math.min(plans.length - 1, activeIndex + 1))}
                    className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border bg-card shadow-lg hover:bg-muted transition-all disabled:opacity-30"
                    disabled={activeIndex === plans.length - 1}
                    aria-label="Plan siguiente"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </button>
                </>
              )}

              {/* Carousel container */}
              <div
                ref={carouselRef}
                onScroll={handleScroll}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 -mx-4 px-4 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {plans.map((plan) => {
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
                      key={plan.id}
                      className={`relative flex flex-col rounded-xl border p-6 transition-all snap-center flex-shrink-0 w-[85vw] sm:w-[380px] lg:w-[340px] ${
                        plan.is_highlighted
                          ? "border-primary/50 bg-gradient-to-b from-[var(--ht-primary)]/[0.06] to-transparent shadow-lg shadow-[var(--ht-primary)]/10 scale-[1.02]"
                          : "border-border/50 bg-card hover:border-border hover:shadow-md"
                      }`}
                    >
                      {/* Popular badge */}
                      {plan.is_highlighted && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-1 text-xs font-semibold text-white shadow-md">
                          Mas popular
                        </div>
                      )}

                      {/* Plan name */}
                      <h3 className="text-lg font-bold">{plan.nombre}</h3>

                      {/* Description */}
                      {plan.descripcion && (
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                          {plan.descripcion}
                        </p>
                      )}

                      {/* Price */}
                      <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold tracking-tight">
                          {fmt(price)}
                        </span>
                        <span className="text-sm text-muted-foreground">/mes</span>
                      </div>
                      {annual && (
                        <p className="mt-1 text-xs text-muted-foreground line-through">
                          {fmt(Number(plan.precio_mensual))}/mes
                        </p>
                      )}

                      {/* Limits */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          {plan.max_usuarios} usuario{plan.max_usuarios > 1 ? "s" : ""}
                        </span>
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                          {plan.max_pacientes
                            ? `${plan.max_pacientes.toLocaleString("es-AR")} pacientes`
                            : "Pacientes ilimitados"}
                        </span>
                        {plan.max_sucursales && (
                          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                            {plan.max_sucursales} sucursales
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      <ul className="mt-6 flex-1 space-y-3">
                        {features.map((f) => (
                          <li key={f.key} className="flex items-start gap-2.5">
                            {f.included ? <CheckIcon /> : <XIcon />}
                            <span
                              className={`text-sm ${
                                f.included
                                  ? "text-foreground"
                                  : "text-muted-foreground/50"
                              }`}
                            >
                              {f.label}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      {Number(plan.precio_mensual) > 0 ? (
                        <a
                          href="mailto:ventas@avaxhealth.com?subject=Consulta%20plan%20"
                          className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                            plan.is_highlighted
                              ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-md hover:from-[var(--ht-primary)] hover:to-[var(--ht-accent)]"
                              : "border border-border bg-background text-foreground hover:bg-muted"
                          }`}
                        >
                          Contactanos
                        </a>
                      ) : (
                        <Link
                          href="/register"
                          className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                            plan.is_highlighted
                              ? "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-md hover:from-[var(--ht-primary)] hover:to-[var(--ht-accent)]"
                              : "border border-border bg-background text-foreground hover:bg-muted"
                          }`}
                        >
                          Empezar prueba gratuita
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Dots indicator */}
              {plans.length > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  {plans.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => scrollToIndex(i)}
                      className={`h-2.5 rounded-full transition-all ${
                        i === activeIndex
                          ? "w-8 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)]"
                          : "w-2.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                      }`}
                      aria-label={`Ir al plan ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom note */}
          <p className="mt-12 text-center text-sm text-muted-foreground">
            Todos los precios estan en pesos argentinos (ARS) e incluyen IVA.
            <br />
            Necesitas algo personalizado?{" "}
            <a
              href="mailto:soporte@avaxhealth.com"
              className="font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Contactanos
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
