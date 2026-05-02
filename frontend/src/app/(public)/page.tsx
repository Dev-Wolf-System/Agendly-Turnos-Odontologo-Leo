"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  IconArrowRight,
  IconCheck,
  IconChatChaos,
  IconPaperStack,
  IconRevenueUnknown,
  IconCalendarMedical,
  IconFilePulse,
  IconReceiptChart,
  IconBoxMedical,
  IconTeamMedical,
  IconShieldCheck,
  IconUserSearch,
  IconCalendarPlus,
  IconBotChat,
  IconSliders,
  IconSignup,
  IconTune,
  IconGrow,
  IconWhatsapp,
  IconMercadoPago,
  IconGoogle,
  IconPlus,
  IconStar,
  IconClock,
} from "@/components/landing/landing-icons";

/* ─── Reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    root.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ─── CountUp animado ─── */
function CountUp({
  target,
  prefix = "",
  suffix = "",
  decimals = "",
}: {
  target: number;
  prefix?: string;
  suffix?: string;
  decimals?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let started = false;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting || started) return;
          started = true;
          const dur = 1700;
          let start: number | null = null;
          const tick = (ts: number) => {
            if (start === null) start = ts;
            const p = Math.min((ts - start) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            setVal(Math.floor(ease * target));
            if (p < 1) requestAnimationFrame(tick);
            else setVal(target);
          };
          requestAnimationFrame(tick);
          obs.unobserve(el);
        });
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  const formatted = val >= 1000 ? val.toLocaleString("es-AR") : String(val);
  return (
    <span ref={ref}>
      {prefix}
      {formatted}
      {decimals}
      {suffix}
    </span>
  );
}

/* ─── Dashboard mock ─── */
function DashboardMock() {
  return (
    <div className="relative">
      {/* Float card 1: −60% inasistencias */}
      <div className="hidden md:block absolute -top-5 -right-7 z-20 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl animate-float-in">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--ht-accent)]/10 text-[var(--ht-accent-dark)]">
            <IconClock size={16} />
          </div>
          <div>
            <div className="text-lg font-extrabold leading-none tracking-tight">−60%</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">inasistencias con IA</div>
          </div>
        </div>
      </div>

      {/* Float card 2: 3 turnos agendados por Avax */}
      <div className="hidden md:block absolute bottom-7 -left-9 z-20 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl animate-float-in-delay">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366] text-white">
            <IconWhatsapp size={16} />
          </div>
          <div>
            <div className="text-lg font-extrabold leading-none tracking-tight">3 turnos</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">agendados por Avax hoy</div>
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl border border-border bg-card overflow-hidden shadow-2xl shadow-[var(--ht-primary)]/15">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="ml-2 flex-1 max-w-[220px] rounded-md border border-border bg-background px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
            avaxhealth.com/dashboard
          </div>
        </div>
        <div className="grid grid-cols-[140px_1fr] min-h-[360px]">
          {/* Sidebar */}
          <aside className="border-r border-border bg-card p-3">
            <div className="flex items-center gap-2 px-2 mb-4 text-[11px] font-extrabold tracking-tight">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--ht-primary-light)] shadow-[0_0_8px] shadow-[var(--ht-primary-light)]" />
              Avax Health
            </div>
            {[
              { label: "Dashboard", active: true },
              { label: "Pacientes" },
              { label: "Agenda" },
              { label: "Cobros" },
              { label: "Inventario" },
              { label: "Reportes" },
              { label: "Avax IA" },
            ].map((it) => (
              <div
                key={it.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] mb-0.5 ${
                  it.active
                    ? "bg-[var(--ht-primary-light)]/10 font-semibold text-[var(--ht-primary-dark)]"
                    : "text-muted-foreground"
                }`}
              >
                <span className="h-1 w-1 rounded-full bg-current" />
                {it.label}
              </div>
            ))}
          </aside>

          {/* Main */}
          <div className="bg-muted/30 p-4">
            <div className="flex items-center justify-between mb-3.5">
              <div className="text-[12px] font-bold tracking-tight">Resumen</div>
              <div className="text-[10px] text-muted-foreground">Mayo 2026</div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { l: "Turnos hoy", v: "12", t: "↑ 18%" },
                { l: "Pacientes", v: "847", t: "↑ 24%" },
                { l: "Ingresos", v: "$284k", t: "↑ 32%" },
              ].map((k, i) => (
                <div
                  key={k.l}
                  className="rounded-lg border border-border bg-card p-2.5 animate-kpi-in"
                  style={{ animationDelay: `${0.5 + i * 0.15}s` }}
                >
                  <div className="text-[9px] font-medium text-muted-foreground">{k.l}</div>
                  <div className="text-base font-extrabold tracking-tight">{k.v}</div>
                  <div className="text-[9px] font-bold text-[var(--ht-accent-dark)] mt-0.5">{k.t}</div>
                </div>
              ))}
            </div>

            {/* Bars chart */}
            <div className="rounded-lg border border-border bg-card p-3 mb-2.5 animate-chart-in">
              <div className="text-[10px] font-semibold text-muted-foreground mb-2">Turnos esta semana</div>
              <div className="flex items-end gap-1.5 h-12">
                {[60, 45, 82, 55, 96, 70, 38].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm origin-bottom animate-bar-grow ${
                      i % 2 === 0 ? "bg-gradient-to-t from-[var(--ht-primary-light)]/40 to-[var(--ht-primary-light)]" : "bg-gradient-to-t from-[var(--ht-accent)]/40 to-[var(--ht-accent)]"
                    }`}
                    style={{ height: `${h}%`, animationDelay: `${1.2 + i * 0.1}s` }}
                  />
                ))}
              </div>
            </div>

            {/* Apts list */}
            <div className="rounded-lg border border-border bg-card p-3 animate-chart-in" style={{ animationDelay: "1.4s" }}>
              <div className="text-[10px] font-semibold text-muted-foreground mb-1.5">Agenda del día</div>
              {[
                { name: "María García", time: "09:00", dot: "var(--ht-primary-light)", badgeBg: "var(--ht-accent)/0.12", badgeColor: "var(--ht-accent-dark)", badge: "✓ conf." },
                { name: "Juan López", time: "10:30", dot: "var(--ht-accent)", badgeBg: "rgba(245,158,11,0.12)", badgeColor: "#B45309", badge: "pend." },
                { name: "Ana Martínez", time: "11:00", dot: "var(--ht-primary)", badgeBg: "var(--ht-primary-light)/0.12", badgeColor: "var(--ht-primary-dark)", badge: "nuevo" },
              ].map((a, i) => (
                <div
                  key={a.name}
                  className="flex items-center gap-2 py-1.5 border-b last:border-0 border-border/60 animate-apt-in"
                  style={{ animationDelay: `${1.6 + i * 0.15}s` }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.dot }} />
                  <span className="text-[10px] font-medium flex-1 truncate">{a.name}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{a.time}</span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: a.badgeBg, color: a.badgeColor }}
                  >
                    {a.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Data ─── */

const problems = [
  {
    Icon: IconChatChaos,
    iconBg: "bg-[var(--ht-primary-light)]/10 text-[var(--ht-primary-dark)]",
    q: "¿Seguís coordinando turnos por WhatsApp?",
    a: "Con Avax Health tu agenda se gestiona sola — recordatorios automáticos, confirmaciones y cancelaciones sin intervención manual.",
  },
  {
    Icon: IconPaperStack,
    iconBg: "bg-[var(--ht-accent)]/10 text-[var(--ht-accent-dark)]",
    q: "¿El historial de tus pacientes está en papel o planillas?",
    a: "Digitalizá fichas médicas, diagnósticos y documentos. Buscá cualquier paciente en segundos desde cualquier dispositivo.",
  },
  {
    Icon: IconRevenueUnknown,
    iconBg: "bg-amber-500/10 text-amber-600",
    q: "¿No sabés cuánto facturaste este mes por profesional?",
    a: "Dashboard financiero en tiempo real con KPIs de ingresos, pagos pendientes y métricas de ocupación.",
  },
];

const metrics = [
  { target: 200, suffix: "+", label: "Clínicas activas" },
  { target: 40000, suffix: "+", label: "Turnos gestionados" },
  { target: 60, prefix: "−", suffix: "%", label: "Inasistencias con IA" },
  { target: 99, decimals: ".9", suffix: "%", label: "Uptime garantizado" },
];

const features = [
  {
    Icon: IconCalendarMedical,
    title: "Gestión de Turnos Inteligente",
    desc: "Calendario con vistas diaria, semanal y lista. Drag & drop para reprogramar, control de solapamiento, recordatorios automáticos por WhatsApp.",
    iconBg: "bg-[var(--ht-primary-light)]/10 text-[var(--ht-primary-dark)]",
    span: "lg:col-span-3 lg:row-span-2",
    isHero: true,
  },
  {
    Icon: IconFilePulse,
    title: "Historial Médico Digital",
    desc: "Fichas completas con timeline de procedimientos, diagnósticos y documentos adjuntos. Búsqueda instantánea.",
    iconBg: "bg-[var(--ht-accent)]/10 text-[var(--ht-accent-dark)]",
    span: "lg:col-span-3",
  },
  {
    Icon: IconReceiptChart,
    title: "Pagos y Facturación",
    desc: "Control financiero con KPIs en tiempo real, múltiples métodos de pago y reportes detallados por período.",
    iconBg: "bg-amber-500/10 text-amber-600",
    span: "lg:col-span-3",
  },
  {
    Icon: IconBoxMedical,
    title: "Inventario y Proveedores",
    desc: "Stock en tiempo real, alertas de bajo inventario y gestión completa de proveedores.",
    iconBg: "bg-[var(--ht-primary-light)]/10 text-[var(--ht-primary-dark)]",
    span: "lg:col-span-2",
  },
  {
    Icon: IconTeamMedical,
    title: "Multi-Profesional",
    desc: "Cada profesional con su agenda, sus pacientes y sus estadísticas. Roles y permisos.",
    iconBg: "bg-[var(--ht-accent)]/10 text-[var(--ht-accent-dark)]",
    span: "lg:col-span-2",
  },
  {
    Icon: IconShieldCheck,
    title: "Seguridad y Privacidad",
    desc: "Datos encriptados, aislados por clínica y estándares de protección sanitaria.",
    iconBg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
    span: "lg:col-span-2",
  },
];

const steps = [
  { n: "01", Icon: IconSignup, title: "Registrate", desc: "Creá tu cuenta en menos de 2 minutos. Sin tarjeta de crédito ni instalaciones." },
  { n: "02", Icon: IconTune, title: "Configurá", desc: "Personalizá horarios, profesionales, tratamientos y más desde un panel intuitivo." },
  { n: "03", Icon: IconGrow, title: "Gestioná", desc: "Empezá a atender pacientes, agendar turnos y hacer crecer tu negocio desde el día uno." },
];

const compareRows = [
  { f: "Agenda y turnos", us: "Automatizado 24/7", them: "WhatsApp manual" },
  { f: "Recordatorios automáticos", us: "−60% inasistencias", them: "Inasistencias frecuentes" },
  { f: "Historia clínica", us: "Digital, búsqueda 1s", them: "Carpetas / papel" },
  { f: "Reportes financieros", us: "KPIs en tiempo real", them: "Excel manual", partial: true },
  { f: "Acceso multi-dispositivo", us: "Web · móvil · tablet", them: "Solo en oficina" },
  { f: "Agente IA por WhatsApp", us: "Avax — 24/7", them: "No disponible" },
];

const agentFeatures = [
  { Icon: IconUserSearch, title: "Busca y registra pacientes", desc: "Identifica pacientes existentes o crea nuevos perfiles automáticamente." },
  { Icon: IconCalendarPlus, title: "Agenda turnos en tiempo real", desc: "Consulta disponibilidad y crea el turno directamente en tu agenda." },
  { Icon: IconBotChat, title: "Responde consultas frecuentes", desc: "Dirección, horarios, precios, obras sociales — todo sin intervenir." },
  { Icon: IconSliders, title: "Personalizable por clínica", desc: "Nombre, instrucciones específicas y tono configurables." },
];

const integrations = [
  {
    name: "WhatsApp",
    desc: "Avax gestiona turnos, envía recordatorios y consentimientos automáticamente vía WhatsApp.",
    Icon: IconWhatsapp,
    iconStyle: "bg-[#25D366] text-white",
    accent: "bg-[#25D366]",
  },
  {
    name: "Mercado Pago",
    desc: "Cada clínica conecta sus credenciales para cobrar turnos y servicios en línea.",
    Icon: IconMercadoPago,
    iconStyle: "bg-gradient-to-br from-[#009EE3] to-[#0070BA] text-white",
    accent: "bg-gradient-to-r from-[#009EE3] to-[#00B0FF]",
  },
  {
    name: "Google",
    desc: "Sincronización con Google Calendar, exportación a Sheets y Docs.",
    Icon: IconGoogle,
    iconStyle: "bg-white border border-border",
    accent: "bg-gradient-to-r from-[#4285F4] via-[#34A853] to-[#EA4335]",
    badges: ["Calendar", "Sheets", "Docs"],
  },
];

const testimonials = [
  {
    text: "Desde que usamos Avax Health, la gestión de turnos pasó de ser un caos a algo automático. Nuestros pacientes reciben recordatorios y la agenda se organiza sola.",
    name: "Dra. Laura Méndez",
    role: "Directora — Centro Odontológico Sonrisa",
    avatar: "LM",
    avatarBg: "from-[var(--ht-primary)] to-[var(--ht-primary-dark)]",
  },
  {
    text: "El historial médico digital nos ahorró horas de papeleo. Ahora tengo todo el historial de cada paciente en segundos, desde cualquier dispositivo.",
    name: "Dr. Martín Álvarez",
    role: "Kinesiólogo — Kinesis Centro",
    avatar: "MA",
    avatarBg: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]",
  },
  {
    text: "El control financiero y los reportes nos dieron visibilidad real del negocio. Por primera vez sabemos exactamente cuánto facturamos por profesional.",
    name: "Lic. Carolina Vega",
    role: "Administradora — Clínica Integral Salud",
    avatar: "CV",
    avatarBg: "from-amber-500 to-amber-700",
  },
];

const faq = [
  { q: "¿Necesito instalar algo?", a: "No. Avax Health funciona 100% en la nube desde cualquier navegador. Sin instalaciones, sin servidores propios." },
  { q: "¿Funciona para cualquier especialidad médica?", a: "Sí. Odontología, kinesiología, nutrición, psicología, medicina general y más. Podés configurar la especialidad y los tratamientos a medida." },
  { q: "¿Qué pasa con mis datos si cancelo?", a: "Tus datos son tuyos. Si decidís cancelar, tenés 30 días para exportarlos. No eliminamos nada sin tu consentimiento." },
  { q: "¿Puedo tener múltiples profesionales en la misma clínica?", a: "Sí. Cada profesional tiene su propia agenda, sus pacientes y sus estadísticas. El plan define cuántos usuarios podés tener." },
  { q: "¿El agente de WhatsApp agenda turnos automáticamente?", a: "Sí. Avax puede buscar disponibilidad, confirmar turnos y enviar recordatorios sin intervención manual, las 24 horas." },
  { q: "¿Hay período de prueba gratuito?", a: "Sí, 14 días gratis sin tarjeta de crédito. Acceso completo a todas las funcionalidades desde el primer día." },
];

/* ─── PAGE ─── */

export default function LandingPage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      {/* Animaciones globales propias de la landing */}
      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.is-visible { opacity: 1; transform: translateY(0); }
        .reveal-d1 { transition-delay: 0.1s; }
        .reveal-d2 { transition-delay: 0.2s; }
        .reveal-d3 { transition-delay: 0.3s; }
        .reveal-d4 { transition-delay: 0.4s; }

        @keyframes float-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
        @keyframes float-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .animate-float-in { animation: float-in 0.6s 0.9s ease both, float-soft 4s 1.5s ease-in-out infinite; }
        .animate-float-in-delay { animation: float-in 0.6s 1.2s ease both, float-soft 5s 1.8s ease-in-out infinite; }

        @keyframes kpi-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-kpi-in { opacity: 0; animation: kpi-in 0.5s ease forwards; }

        @keyframes chart-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-chart-in { opacity: 0; animation: chart-in 0.6s ease forwards; }

        @keyframes bar-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .animate-bar-grow { transform: scaleY(0); animation: bar-grow 0.7s ease forwards; }

        @keyframes apt-in { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: translateX(0); } }
        .animate-apt-in { opacity: 0; animation: apt-in 0.4s ease forwards; }

        @keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
        .animate-pulse-dot { animation: pulse-dot 2s infinite; }

        @keyframes underline-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .hero-underline::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: 4px;
          height: 12px;
          background: linear-gradient(90deg, color-mix(in srgb, var(--ht-primary-light) 30%, transparent), color-mix(in srgb, var(--ht-accent) 30%, transparent));
          z-index: -1;
          border-radius: 4px;
          transform: scaleX(0); transform-origin: 0 50%;
          animation: underline-draw 0.9s 0.9s ease forwards;
        }

        @keyframes typing-dot { 0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1); } }
        .animate-typing-dot:nth-child(1) { animation: typing-dot 1.2s infinite; }
        .animate-typing-dot:nth-child(2) { animation: typing-dot 1.2s 0.2s infinite; }
        .animate-typing-dot:nth-child(3) { animation: typing-dot 1.2s 0.4s infinite; }

        details > summary::-webkit-details-marker { display: none; }
        details > summary::marker { content: ''; }
      `}</style>

      {/* ════════ HERO ════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradients + grid */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-[var(--ht-primary-light)]/15 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-[var(--ht-accent)]/12 blur-3xl" />
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(rgba(14,165,233,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.05) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
          <div className="grid gap-16 lg:gap-20 lg:grid-cols-[1.05fr_1fr] items-center">
            {/* Copy */}
            <div className="reveal">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3.5 py-1.5 text-xs font-semibold text-[var(--ht-primary-dark)] mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--ht-accent)] animate-pulse-dot" />
                Plataforma SaaS para salud · 14 días gratis
              </div>

              <h1 className="text-[2.4rem] sm:text-[3.2rem] lg:text-[4rem] font-extrabold leading-[1.05] tracking-[-0.03em]">
                Tu clínica merece una<br />
                gestión del{" "}
                <span className="hero-underline relative inline-block">siglo XXI</span>,<br />
                impulsada por{" "}
                <span className="bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent)] bg-clip-text text-transparent">
                  IA.
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-[1.075rem] text-muted-foreground leading-relaxed max-w-[540px]">
                Turnos, pacientes, historial médico, pagos e inventario. Todo en un solo lugar, con tu agente{" "}
                <strong className="text-foreground font-bold">Avax</strong> trabajando 24/7 por WhatsApp.{" "}
                <strong className="text-foreground font-bold">Sin papel, sin planillas, sin caos.</strong>
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/register"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px] shadow-[var(--ht-primary)]/30 hover:shadow-[var(--ht-primary)]/45 hover:-translate-y-0.5 transition-all"
                >
                  <IconArrowRight size={16} />
                  Empezar gratis — 14 días
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground hover:border-[var(--ht-primary-light)] hover:bg-[var(--ht-primary-light)]/5 hover:-translate-y-0.5 transition-all"
                >
                  Ver planes
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5">
                {["Sin tarjeta de crédito", "Cancelás cuando quieras", "Soporte incluido"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <IconCheck size={14} className="text-[var(--ht-accent-dark)] shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual */}
            <div className="reveal reveal-d1">
              <DashboardMock />
            </div>
          </div>
        </div>
      </section>

      {/* ════════ LOGO STRIP ════════ */}
      <div className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-6">
            +200 clínicas activas confían en Avax Health
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
            {[
              "Centro Odontológico Sonrisa",
              "Kinesis Centro",
              "Clínica Integral Salud",
              "Mente Plena",
              "Dermalux",
              "Visión 360",
            ].map((c) => (
              <div key={c} className="text-base font-bold tracking-tight text-muted-foreground hover:text-foreground transition-colors">
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ PROBLEM ════════ */}
      <section className="bg-muted/30 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-4">
              El problema
            </span>
            <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-tight">
              ¿Te suena familiar alguna de estas situaciones?
            </h2>
            <p className="mt-3 text-base text-muted-foreground max-w-[560px] mx-auto">
              Tres frustraciones que escuchamos todos los días de profesionales de la salud.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {problems.map((p, i) => (
              <div
                key={p.q}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-7 hover:-translate-y-1 hover:shadow-xl hover:border-[var(--ht-primary-light)]/40 transition-all reveal reveal-d${i + 1}`}
              >
                <div className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent)] transition-transform duration-300 group-hover:scale-x-100" />
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${p.iconBg}`}>
                  <p.Icon size={22} />
                </div>
                <h3 className="font-bold text-base sm:text-[1.05rem] leading-tight mb-2">{p.q}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ BIG METRICS (dark) ════════ */}
      <section className="relative overflow-hidden py-24 sm:py-28 bg-[#0F172A]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/5 h-96 w-96 rounded-full bg-[var(--ht-primary-light)]/15 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/5 h-96 w-96 rounded-full bg-[var(--ht-accent)]/12 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#7DD3FC] mb-4">
              Resultados reales
            </span>
            <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-tight text-white">
              Los números hablan por sí solos
            </h2>
            <p className="mt-3 text-base text-white/60">
              Más de 200 clínicas en Argentina ya transformaron su gestión.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <div
                key={m.label}
                className={`text-center rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-6 py-7 hover:-translate-y-1 hover:border-[var(--ht-primary-light)]/40 hover:bg-white/[0.06] transition-all reveal reveal-d${i + 1}`}
              >
                <div
                  className="text-[2.8rem] sm:text-[3.6rem] font-black tracking-[-0.03em] leading-none mb-2"
                  style={{ background: "linear-gradient(120deg, #fff 30%, #7DD3FC)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
                >
                  <CountUp target={m.target} prefix={m.prefix} suffix={m.suffix} decimals={m.decimals} />
                </div>
                <div className="text-sm text-white/70 font-medium">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ FEATURES BENTO ════════ */}
      <section id="funcionalidades" className="py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-4">
              Funcionalidades
            </span>
            <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-tight">
              Todo lo que tu clínica necesita
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Una plataforma integral que reemplaza múltiples herramientas dispersas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5 max-w-6xl mx-auto auto-rows-[minmax(180px,auto)]">
            {features.map((f) => (
              <div
                key={f.title}
                className={`group relative overflow-hidden rounded-2xl border border-border ${f.isHero ? "bg-gradient-to-br from-[var(--ht-primary-light)]/8 to-[var(--ht-accent)]/8" : "bg-card"} p-7 hover:-translate-y-1 hover:shadow-xl hover:border-[var(--ht-primary-light)]/40 transition-all flex flex-col reveal ${f.span}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-4 ${f.iconBg}`}>
                  <f.Icon size={22} />
                </div>
                <h3 className={`font-bold ${f.isHero ? "text-xl sm:text-2xl" : "text-lg"} tracking-tight mb-2`}>{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>

                {f.isHero && (
                  <div className="mt-auto pt-6">
                    {/* Mini calendario decorativo */}
                    <div className="space-y-1.5 -mx-7 px-7">
                      {[
                        ["", "f", "", "h", "fa", "", "h"],
                        ["h", "", "f", "", "", "f", ""],
                        ["", "fa", "", "f", "h", "", "f"],
                      ].map((row, ri) => (
                        <div key={ri} className="flex gap-1.5">
                          {row.map((c, ci) => (
                            <div
                              key={ci}
                              className={`flex-1 h-7 rounded-md border ${
                                c === "f" ? "bg-[var(--ht-primary-light)] border-[var(--ht-primary)]" :
                                c === "fa" ? "bg-[var(--ht-accent)] border-[var(--ht-accent-dark)]" :
                                c === "h" ? "bg-[var(--ht-primary-light)]/15 border-[var(--ht-primary-light)]/30" :
                                "bg-card border-border"
                              }`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ HOW IT WORKS ════════ */}
      <section className="bg-muted/30 py-24 sm:py-28 relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-4">
              Empezá hoy
            </span>
            <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-tight">
              En 3 pasos simples
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Registrate y tenés tu clínica funcionando en minutos.
            </p>
          </div>

          <div className="relative grid sm:grid-cols-3 gap-6">
            {/* Línea conectora */}
            <div className="hidden sm:block absolute top-7 left-[16%] right-[16%] h-[2px] -z-0" style={{ backgroundImage: "linear-gradient(90deg, var(--ht-primary-light) 50%, transparent 50%)", backgroundSize: "12px 2px" }} />
            {steps.map((s, i) => (
              <div
                key={s.n}
                className={`relative z-10 rounded-2xl border border-border bg-card p-7 text-center hover:-translate-y-1 hover:shadow-xl transition-all reveal reveal-d${i + 1}`}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] text-white font-extrabold text-lg shadow-[0_8px_24px] shadow-[var(--ht-primary)]/35">
                  {s.n}
                </div>
                <div className="mb-2 flex justify-center text-[var(--ht-primary)] opacity-70">
                  <s.Icon size={24} />
                </div>
                <h3 className="font-bold text-lg tracking-tight mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ COMPARISON ════════ */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-4">
              Por qué Avax Health
            </span>
            <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-tight">
              Avax Health vs. el método tradicional
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Lo que hacés hoy con planillas y cuadernos, Avax lo automatiza completamente.
            </p>
          </div>

          <div className="reveal max-w-4xl mx-auto rounded-2xl border border-border bg-card overflow-hidden shadow-md">
            {/* Head */}
            <div className="hidden sm:grid grid-cols-[1.4fr_1fr_1fr] bg-muted/40">
              <div className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.06em]">Característica</div>
              <div className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--ht-primary-dark)] text-center">✦ Avax Health</div>
              <div className="px-6 py-4 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground text-center">Método tradicional</div>
            </div>
            {compareRows.map((row, i) => (
              <div
                key={row.f}
                className={`grid grid-cols-1 sm:grid-cols-[1.4fr_1fr_1fr] ${i > 0 ? "border-t border-border" : ""}`}
              >
                <div className="px-6 py-4 text-sm font-medium sm:font-medium">{row.f}</div>
                <div className="px-6 py-4 flex flex-col items-center justify-center gap-1 text-sm bg-gradient-to-b from-transparent to-[var(--ht-primary-light)]/8">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ht-accent)]/15 text-[var(--ht-accent-dark)] font-bold">✓</span>
                  <span className="text-xs text-muted-foreground font-medium">{row.us}</span>
                </div>
                <div className="px-6 py-4 flex flex-col items-center justify-center gap-1 text-sm">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full font-bold ${row.partial ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground/60"}`}>
                    {row.partial ? "~" : "✕"}
                  </span>
                  <span className="text-xs text-muted-foreground">{row.them}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ AGENT IA (dark) ════════ */}
      <section id="agente" className="relative overflow-hidden py-24 sm:py-28 bg-gradient-to-br from-[#0F172A] via-[#0a1628] to-[#0F172A]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[15%] h-96 w-96 rounded-full bg-[var(--ht-primary-light)]/15 blur-3xl" />
          <div className="absolute bottom-[15%] right-[15%] h-96 w-96 rounded-full bg-[var(--ht-accent)]/12 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <span className="inline-block rounded-full border border-[var(--ht-accent)]/30 bg-[var(--ht-accent)]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6EE7B7] mb-4">
                Agente IA
              </span>
              <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-[1.15] text-white mb-4">
                Avax trabaja mientras vos atendés.
              </h2>
              <p className="text-base text-white/65 leading-relaxed mb-7">
                Tu agente virtual por WhatsApp gestiona turnos de forma completamente autónoma, 24/7 — sin que tengas que tocar el teléfono.
              </p>

              <div className="flex flex-col gap-3">
                {agentFeatures.map((f) => (
                  <div
                    key={f.title}
                    className="group flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:translate-x-1 hover:border-[var(--ht-accent)]/40 hover:bg-white/[0.06] transition-all"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--ht-accent)]/15 text-[#6EE7B7]">
                      <f.Icon size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{f.title}</div>
                      <div className="text-xs text-white/55 mt-0.5 leading-relaxed">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat WhatsApp mock */}
            <div className="reveal reveal-d2">
              <div className="rounded-3xl overflow-hidden shadow-2xl bg-[#e5ddd5]">
                <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-accent)] text-white font-bold text-sm">
                    A
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Avax — Clínica Dental Sonrisa</div>
                    <div className="text-white/70 text-[11px] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4ADE80] animate-pulse-dot" />
                      en línea
                    </div>
                  </div>
                </div>
                <div className="px-4 py-4 min-h-[300px] flex flex-col gap-2.5 bg-[#ddd]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.5) 0%, transparent 30%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.5) 0%, transparent 30%)" }}>
                  {[
                    { who: "sent", txt: "Hola! Quiero sacar un turno para esta semana", time: "09:12" },
                    { who: "received", txt: "¡Hola! Soy Avax 👋 Con gusto te ayudo. ¿Me podés confirmar tu nombre completo?", time: "09:12" },
                    { who: "sent", txt: "María González", time: "09:13" },
                    { who: "received", txt: "Perfecto María 😊 Tengo disponibilidad el miércoles a las 10:00 o el jueves a las 15:30. ¿Cuál te viene mejor?", time: "09:13" },
                    { who: "sent", txt: "El jueves 15:30 perfecto!", time: "09:14" },
                    { who: "received", txt: "¡Listo! Tu turno quedó confirmado para el jueves a las 15:30 con Dr. Ramírez. Te llegará un recordatorio 24hs antes ✅", time: "09:14" },
                  ].map((b, i) => (
                    <div
                      key={i}
                      className={`max-w-[78%] px-3 py-2 rounded-xl text-sm leading-relaxed shadow-sm ${
                        b.who === "sent"
                          ? "self-end bg-[#DCF8C6] text-slate-900 rounded-tr-[3px]"
                          : "self-start bg-white text-slate-900 rounded-tl-[3px]"
                      }`}
                    >
                      {b.txt}
                      <span className="block text-[9px] text-slate-500/70 text-right mt-1 font-mono">{b.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ INTEGRATIONS ════════ */}
      <section className="py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-4">
              Integraciones
            </span>
            <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-tight">
              Se integra con tus herramientas
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Conectá WhatsApp, calendario, pagos y más desde un solo lugar.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {integrations.map((it, i) => (
              <div
                key={it.name}
                className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-8 text-center hover:-translate-y-1.5 hover:shadow-xl hover:border-[var(--ht-primary-light)]/40 transition-all reveal reveal-d${i + 1}`}
              >
                <div className={`absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 ${it.accent} transition-transform duration-300 group-hover:scale-x-100`} />
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl shadow-md ${it.iconStyle}`}>
                  <it.Icon size={32} />
                </div>
                <h3 className="font-bold text-lg tracking-tight mb-1.5">{it.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{it.desc}</p>
                {it.badges && (
                  <div className="mt-4 flex justify-center gap-1.5 flex-wrap">
                    {it.badges.map((b) => (
                      <span key={b} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[var(--ht-primary-light)]/10 text-[var(--ht-primary-dark)] border border-[var(--ht-primary-light)]/20">
                        {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section className="bg-muted/30 py-24 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-4">
              Testimonios
            </span>
            <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-tight">
              Lo que dicen nuestros clientes
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Profesionales de la salud que transformaron su gestión.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`relative rounded-2xl border border-border bg-card p-7 hover:-translate-y-1 hover:shadow-xl transition-all reveal reveal-d${i + 1}`}
              >
                <span className="absolute top-5 right-6 font-serif text-6xl leading-none text-[var(--ht-primary-light)]/25 select-none">"</span>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <IconStar key={k} size={14} className="text-amber-500" />
                  ))}
                </div>
                <p className="text-sm sm:text-[0.95rem] leading-relaxed mb-5">{t.text}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${t.avatarBg} text-white font-bold text-sm`}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PRICING TEASER ════════ */}
      <section id="planes" className="py-24 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 reveal">
            <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-4">
              Planes
            </span>
            <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-tight">
              Empezá gratis. Escalá cuando crezcas.
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Sin tarjeta de crédito. 14 días de prueba completa. Cancelás cuando quieras.
            </p>
          </div>

          <div className="reveal flex justify-center">
            <Link
              href="/planes"
              className="group inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-8 py-5 hover:border-[var(--ht-primary-light)]/40 hover:shadow-xl transition-all"
            >
              <span className="text-base font-semibold">Ver todos los planes y precios</span>
              <IconArrowRight size={18} className="text-[var(--ht-primary)] group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <section id="faq" className="bg-muted/30 py-24 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 reveal">
            <span className="inline-block rounded-full border border-[var(--ht-primary-light)]/30 bg-[var(--ht-primary-light)]/8 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ht-primary-dark)] mb-4">
              FAQ
            </span>
            <h2 className="text-[2rem] sm:text-[2.4rem] font-extrabold tracking-tight leading-tight">
              Preguntas frecuentes
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              Todo lo que necesitás saber antes de empezar.
            </p>
          </div>

          <div className="flex flex-col gap-3 reveal">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-border bg-card overflow-hidden open:border-[var(--ht-primary-light)]/40 open:shadow-md"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer font-semibold text-sm sm:text-base list-none hover:bg-muted/40 transition-colors">
                  {item.q}
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ht-primary-light)]/10 text-[var(--ht-primary-dark)] group-open:bg-[var(--ht-primary)] group-open:text-white group-open:rotate-45 transition-all duration-300 shrink-0">
                    <IconPlus size={14} />
                  </span>
                </summary>
                <div className="px-6 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ CTA FINAL ════════ */}
      <section className="relative overflow-hidden py-24 sm:py-28 bg-gradient-to-br from-[var(--ht-primary-light)] via-[var(--ht-primary)] to-[var(--ht-accent-dark)]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] left-[20%] h-72 w-72 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute bottom-[20%] right-[20%] h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center reveal">
          <span className="inline-block rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white mb-5">
            14 días gratis · sin tarjeta de crédito
          </span>
          <h2 className="text-[2.2rem] sm:text-[3rem] font-black tracking-[-0.025em] text-white leading-[1.1] mb-4">
            Transformá tu clínica<br />hoy mismo.
          </h2>
          <p className="text-base sm:text-lg text-white/85 mb-9 leading-relaxed">
            Más de 200 profesionales de la salud ya gestionan su clínica con Avax Health. Soporte incluido desde el día uno.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-9 py-4 text-base font-bold text-[var(--ht-primary-dark)] shadow-2xl hover:-translate-y-0.5 hover:shadow-[0_16px_48px] hover:shadow-black/20 transition-all"
          >
            Comenzar ahora — Es gratis
            <IconArrowRight size={16} />
          </Link>
          <p className="mt-4 text-xs text-white/70">
            Sin tarjeta de crédito · Activación inmediata · Cancelás cuando quieras
          </p>
        </div>
      </section>
    </div>
  );
}
