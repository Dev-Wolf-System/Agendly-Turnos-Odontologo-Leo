"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Plan } from "@/types";
import { plansService } from "@/services/plans.service";
import { IconCheck, IconArrowRight, IconLeaf, IconHeart, IconBuilding } from "@/components/landing/landing-icons";

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

/** Devuelve el icon temático según el orden o el rol del plan */
function getPlanIcon(plan: Plan, idx: number) {
  if (plan.is_highlighted) return IconHeart;
  if (idx === 0) return IconLeaf;
  return IconBuilding;
}

/* ── Plan Card ── */

function PlanCard({
  plan,
  annual,
  discount,
  index,
}: {
  plan: Plan;
  annual: boolean;
  discount: number;
  index: number;
}) {
  const price = annual
    ? Math.round(Number(plan.precio_mensual) * discount)
    : Number(plan.precio_mensual);

  const features = ALL_FEATURE_KEYS.filter((key) => !!plan.features?.[key]).map((key) => ({
    key,
    label: FEATURE_LABELS[key] || key,
  }));

  const Icon = getPlanIcon(plan, index);
  const isFree = Number(plan.precio_mensual) === 0;

  return (
    <div
      className={`relative flex flex-col rounded-3xl p-8 sm:p-9 h-full transition-all duration-300 hover:-translate-y-1.5 ${
        plan.is_highlighted
          ? "border-2 border-[var(--ht-primary-light)] bg-card shadow-[0_12px_40px] shadow-[var(--ht-primary)]/20 scale-[1.02]"
          : "border border-border bg-card hover:shadow-xl hover:border-[var(--ht-primary-light)]/40"
      }`}
    >
      {plan.is_highlighted && (
        <div className="absolute top-5 right-5 rounded-full bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-white shadow-md">
          Más popular
        </div>
      )}

      {/* Icon + name */}
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          plan.is_highlighted
            ? "bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-accent)] text-white shadow-md"
            : "bg-[var(--ht-primary-light)]/10 text-[var(--ht-primary-dark)]"
        }`}>
          <Icon size={20} />
        </div>
        <div className="text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {plan.nombre}
        </div>
      </div>

      {plan.descripcion && (
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          {plan.descripcion}
        </p>
      )}

      {/* Precio */}
      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-[2.6rem] sm:text-5xl font-black tracking-[-0.025em] leading-none">
            {isFree ? <><sup className="text-[1.2rem] align-super text-muted-foreground">$</sup>0</> : fmt(price)}
          </span>
          {!isFree && <span className="text-sm font-medium text-muted-foreground">/mes</span>}
        </div>
        <p className="text-[13px] text-muted-foreground mt-1.5">
          {isFree
            ? "14 días gratis · sin tarjeta"
            : annual
              ? <>
                  <span className="line-through opacity-60">{fmt(Number(plan.precio_mensual))}</span>
                  <span className="ml-1.5 font-semibold text-[var(--ht-accent-dark)]">Ahorrás 20%</span>
                </>
              : `por mes · facturación mensual`}
        </p>
      </div>

      {/* Pills de límites */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {plan.max_usuarios} usuario{plan.max_usuarios > 1 ? "s" : ""}
        </span>
        <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          {plan.max_pacientes
            ? `${plan.max_pacientes.toLocaleString("es-AR")} pacientes`
            : "Pacientes ilimitados"}
        </span>
        {plan.max_sucursales && (
          <span className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {plan.max_sucursales} sucursal{plan.max_sucursales > 1 ? "es" : ""}
          </span>
        )}
      </div>

      {/* Features incluidas (solo las activas) */}
      <ul className="flex-1 space-y-2.5 mb-7">
        {features.length === 0 ? (
          <li className="text-sm text-muted-foreground italic">Acceso al núcleo del sistema</li>
        ) : (
          features.map((f) => (
            <li key={f.key} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[var(--ht-accent)]/15 text-[var(--ht-accent-dark)] shrink-0">
                <IconCheck size={11} />
              </span>
              <span className="text-foreground/90">{f.label}</span>
            </li>
          ))
        )}
      </ul>

      {/* CTA */}
      <Link
        href={isFree ? "/register" : `/register?plan=${plan.id}`}
        className={`group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
          plan.is_highlighted
            ? "bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] text-white shadow-[0_8px_24px] shadow-[var(--ht-primary)]/30 hover:shadow-[var(--ht-primary)]/45 hover:-translate-y-0.5"
            : "border-[1.5px] border-border text-foreground hover:border-[var(--ht-primary-light)] hover:bg-[var(--ht-primary-light)]/5"
        }`}
      >
        {isFree ? "Empezar prueba" : plan.is_highlighted ? "Empezar ahora" : "Contratar plan"}
        <IconArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

/* ── Page ── */

export default function PlanesPage() {
  const [annual, setAnnual] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const discount = 0.8;

  useEffect(() => {
    plansService
      .getActivePlans()
      .then((data) => {
        setPlans(data.filter((p) => !p.is_default_trial));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* HEADER */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[440px] w-[820px] rounded-full bg-gradient-to-br from-[var(--ht-primary-light)]/15 via-[var(--ht-primary)]/12 to-[var(--ht-accent)]/10 blur-3xl" />
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

        <div className="mx-auto max-w-3xl text-center px-4">
          <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-5">
            Planes y precios
          </span>
          <h1 className="text-[2.4rem] sm:text-[3rem] lg:text-[3.4rem] font-extrabold tracking-[-0.03em] leading-[1.1]">
            Empezá gratis. <br className="sm:hidden" />
            Escalá cuando{" "}
            <span className="bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent)] bg-clip-text text-transparent">
              crezcas
            </span>
            .
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Sin tarjeta de crédito. 14 días de prueba completa. Cancelás cuando quieras.
          </p>

          {/* Toggle mensual/anual */}
          <div className="mt-9 inline-flex items-center gap-1 rounded-full border border-border bg-card p-1.5 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`rounded-full px-6 py-2 text-sm font-bold transition-all ${
                !annual
                  ? "bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-primary)] text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`rounded-full px-6 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
                annual
                  ? "bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-primary)] text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                annual ? "bg-white/20 text-white" : "bg-[var(--ht-accent)]/15 text-[var(--ht-accent-dark)]"
              }`}>
                −20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-[560px] rounded-3xl border border-border bg-card animate-pulse"
                />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium">Los planes estarán disponibles pronto.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {plans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} annual={annual} discount={discount} index={i} />
              ))}
            </div>
          )}

          {/* Garantía / nota */}
          <div className="mt-14 text-center max-w-2xl mx-auto">
            <div className="inline-flex flex-wrap justify-center items-center gap-x-6 gap-y-2 rounded-2xl border border-border bg-card px-7 py-4 shadow-sm">
              {[
                "Sin tarjeta de crédito",
                "Activación inmediata",
                "Cancelás cuando quieras",
              ].map((b) => (
                <div key={b} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <IconCheck size={14} className="text-[var(--ht-accent-dark)]" />
                  {b}
                </div>
              ))}
            </div>
            <p className="mt-7 text-sm text-muted-foreground">
              Todos los precios están en pesos argentinos (ARS) e incluyen IVA.
              <br className="hidden sm:block" />
              ¿Necesitás algo personalizado?{" "}
              <a
                href="mailto:soporte@avaxhealth.com"
                className="font-semibold text-[var(--ht-primary)] hover:opacity-80 transition-opacity"
              >
                Contactanos
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
