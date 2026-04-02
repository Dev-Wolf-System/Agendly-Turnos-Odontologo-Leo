"use client";

import Link from "next/link";

/* ── Inline SVG Icons ── */

function CalendarIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
      <path d="M8 18h.01" />
      <path d="M12 18h.01" />
    </svg>
  );
}

function ClipboardIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

function CreditCardIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <path d="M2 10h20" />
    </svg>
  );
}

function PackageIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function MessageIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  );
}

function BuildingIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}

/* ── Feature data ── */

const features = [
  {
    icon: CalendarIcon,
    title: "Gestion de Turnos",
    description:
      "Calendario inteligente con vistas diaria, semanal y lista. Control de solapamiento y recordatorios automaticos.",
    gradient: "from-blue-500 to-[#1b3553]",
  },
  {
    icon: ClipboardIcon,
    title: "Historial Medico",
    description:
      "Fichas completas por paciente con timeline de procedimientos, diagnosticos y documentos.",
    gradient: "from-[#1b3553] to-[#7cd1c4]",
  },
  {
    icon: CreditCardIcon,
    title: "Pagos y Facturacion",
    description:
      "Control financiero con KPIs, metodos de pago multiples y reportes detallados.",
    gradient: "from-[#7cd1c4] to-[#5bbcad]",
  },
  {
    icon: PackageIcon,
    title: "Inventario y Proveedores",
    description:
      "Stock en tiempo real, alertas de bajo inventario y gestion de proveedores.",
    gradient: "from-[#5bbcad] to-fuchsia-500",
  },
  {
    icon: MessageIcon,
    title: "WhatsApp + IA",
    description:
      "Agente inteligente que atiende pacientes por WhatsApp: agenda turnos, responde consultas y envia recordatorios.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BuildingIcon,
    title: "Multi-clinica",
    description:
      "Panel de administracion SaaS para gestionar multiples clinicas, planes y suscripciones.",
    gradient: "from-amber-500 to-orange-500",
  },
];

const stats = [
  { value: "+500", label: "Clinicas" },
  { value: "+50,000", label: "Turnos Gestionados" },
  { value: "+30,000", label: "Pacientes" },
  { value: "99.9%", label: "Uptime" },
];

export default function LandingPage() {
  return (
    <>
      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradient blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-br from-[#1b3553]/20 via-[#7cd1c4]/20 to-[#5bbcad]/10 blur-3xl" />
          <div className="absolute top-40 -left-40 h-72 w-72 rounded-full bg-[#1b3553]/10 blur-3xl" />
          <div className="absolute top-60 -right-40 h-72 w-72 rounded-full bg-[#7cd1c4]/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1b3553]/20 bg-[#1b3553]/10 px-4 py-1.5 text-sm font-medium text-[#2a4f73]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2a4f73] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1b3553]" />
              </span>
              Plataforma SaaS para salud
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Gestiona tu clinica de{" "}
              <span className="bg-gradient-to-r from-[#1b3553] via-[#7cd1c4] to-[#5bbcad] bg-clip-text text-transparent">
                manera inteligente
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Turnos, pacientes, historial medico, pagos e inventario. Todo en
              un solo lugar, impulsado por IA.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/planes"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#1b3553] to-[#5bbcad] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#1b3553]/25 hover:from-[#1b3553] hover:to-[#7cd1c4] hover:shadow-[#1b3553]/40 transition-all"
              >
                Comenzar gratis
                <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-border px-8 py-3.5 text-base font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Iniciar sesion
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que tu clinica necesita
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Una plataforma integral que reemplaza multiples herramientas
              dispersas.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-border hover:shadow-lg hover:shadow-[#1b3553]/5"
              >
                {/* Icon with gradient bg */}
                <div
                  className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.gradient} p-3 text-white shadow-md`}
                >
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
                {/* Subtle hover glow */}
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100">
                  <div
                    className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${f.gradient} opacity-[0.06]`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS ══════════════════ */}
      <section className="relative py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1b3553]/[0.03] to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm px-6 py-12 sm:px-12">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[#1b3553] to-[#7cd1c4] bg-clip-text text-transparent sm:text-4xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-gradient-to-t from-[#7cd1c4]/10 to-[#1b3553]/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Empieza tu prueba gratuita de{" "}
              <span className="bg-gradient-to-r from-[#1b3553] to-[#7cd1c4] bg-clip-text text-transparent">
                14 dias
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Sin tarjeta de credito. Cancela en cualquier momento. Soporte
              incluido.
            </p>
            <div className="mt-8">
              <Link
                href="/planes"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#1b3553] to-[#5bbcad] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[#1b3553]/25 hover:from-[#1b3553] hover:to-[#7cd1c4] hover:shadow-[#1b3553]/40 transition-all"
              >
                Ver planes y comenzar
                <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
