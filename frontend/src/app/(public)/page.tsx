"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ──────────── Hooks ──────────── */

function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".rv");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));

    const fcEls = document.querySelectorAll<HTMLElement>(".fc-card");
    const fcObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("on"), idx * 70);
            fcObs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    fcEls.forEach((c) => fcObs.observe(c));

    return () => {
      io.disconnect();
      fcObs.disconnect();
    };
  }, []);
}

function useCountUp() {
  useEffect(() => {
    const animate = (el: HTMLElement, target: number, suffix: string, dur = 1800) => {
      let start: number | null = null;
      const step = (ts: number) => {
        if (start === null) start = ts;
        const p = Math.min((ts - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target + suffix;
      };
      requestAnimationFrame(step);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !(e.target as HTMLElement).dataset.done) {
            (e.target as HTMLElement).dataset.done = "1";
            const target = parseInt((e.target as HTMLElement).dataset.t || "0", 10);
            const suffix = (e.target as HTMLElement).dataset.suf ?? "+";
            animate(e.target as HTMLElement, target, suffix);
          }
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll<HTMLElement>(".metric-num[data-t]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function useCardGlow() {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const card = e.currentTarget as HTMLElement;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    const cards = document.querySelectorAll<HTMLElement>(".fc-card");
    cards.forEach((c) => c.addEventListener("mousemove", handler));
    return () => cards.forEach((c) => c.removeEventListener("mousemove", handler));
  }, []);
}

/* ──────────── Data ──────────── */

const features = [
  { icon: "👥", title: "Gestión de Pacientes", desc: "Ficha médica unificada con datos personales, obra social, historial, pagos y archivos — todo en un clic.", grad: "from-[var(--ht-primary)]/20 to-[var(--ht-primary-light)]/15" },
  { icon: "📅", title: "Agenda Inteligente", desc: "Vistas Kanban, día, semana y lista. Detección de solapamientos en tiempo real. Filtros por profesional.", grad: "from-[var(--ht-accent)]/20 to-[#4ade80]/15" },
  { icon: "💰", title: "Cobros y Facturación", desc: "Efectivo, tarjeta, transferencia o Mercado Pago. Exportá a CSV/Excel. Sin doble cobro.", grad: "from-[var(--ht-accent-warm)]/20 to-amber-300/15" },
  { icon: "📋", title: "Historia Clínica", desc: "Timeline visual de intervenciones, procedimientos y diagnósticos por turno. Acceso por rol.", grad: "from-[var(--ht-primary)]/20 to-teal-300/15" },
  { icon: "📊", title: "Reportes con IA", desc: "KPIs en tiempo real, informe textual generado por OpenAI descargable en PDF. Insights completos.", grad: "from-indigo-400/20 to-purple-400/15" },
  { icon: "🏥", title: "Obras Sociales", desc: "Catálogo de coberturas, cuenta corriente de prestaciones e integración con el perfil del paciente.", grad: "from-[var(--ht-accent)]/20 to-emerald-300/15" },
  { icon: "📄", title: "Consentimientos", desc: "PDF automático, envío por WhatsApp y firma digital. El paciente responde \"ACEPTO\" y queda registrado.", grad: "from-rose-400/15 to-rose-300/10" },
  { icon: "⭐", title: "NPS Post-Turno", desc: "Encuesta automática de satisfacción por WhatsApp. Score NPS calculado con promotores y detractores.", grad: "from-[var(--ht-primary)]/20 to-cyan-300/15" },
  { icon: "🔔", title: "Recordatorios", desc: "Enviados a 2, 4, 12, 24 o 48h antes del turno. Sin intervención manual. Configurable por clínica.", grad: "from-teal-300/15 to-teal-400/10" },
];

const specialties = [
  "🦷 Odontología", "🏃 Kinesiología", "🥗 Nutrición", "🧠 Psicología",
  "🩺 Medicina General", "💆 Dermatología", "👁️ Oftalmología", "💊 Traumatología",
  "🫀 Cardiología", "🤰 Ginecología", "🦴 Ortopedia", "👶 Pediatría",
];

const painPoints = [
  { icon: "📱", title: "WhatsApps sin fin", desc: "Respondés manualmente cada consulta, confirmación y recordatorio. Todo el día, interrumpiendo tu atención." },
  { icon: "📓", title: "Agendas y cuadernos", desc: "Buscar en papeles quién debe cuánto, qué obra social tiene cada paciente o cuándo fue su última consulta." },
  { icon: "📊", title: "Sin visibilidad real", desc: "No sabés cuántos pacientes nuevos captaste, cuál es tu tasa de retención ni qué tratamientos generan más ingresos." },
  { icon: "📁", title: "Archivos dispersos", desc: "Historias clínicas en carpetas, correos y fotos del celular. Encontrar lo que necesitás toma demasiado tiempo." },
];

const beforeList = [
  "WhatsApps manuales todo el día",
  "Agenda en papel o planilla desactualizada",
  "Sin visibilidad de ingresos en tiempo real",
  "Historias clínicas dispersas",
  "Recordatorios olvidados = turnos perdidos",
  "Sin métricas de retención de pacientes",
];

const afterList = [
  "Avax IA agenda 24/7 por WhatsApp",
  "Agenda digital con detección de solapamientos",
  "Dashboard de cobros y KPIs en vivo",
  "Historia clínica unificada por paciente",
  "Recordatorios automáticos configurables",
  "Reporte NPS + análisis de retención con IA",
];

const agentFeatures = [
  { icon: "🔍", title: "Busca y registra pacientes", desc: "Identifica existentes o crea nuevos perfiles automáticamente." },
  { icon: "📅", title: "Consulta disponibilidad y agenda", desc: "Ve horarios libres en tiempo real y crea el turno en tu agenda." },
  { icon: "💬", title: "Responde consultas", desc: "Dirección, horarios, precios, obras sociales — todo sin intervención." },
  { icon: "⚙️", title: "Personalizable por clínica", desc: "Nombre del agente, instrucciones y tono de comunicación configurables." },
];

const testimonials = [
  { badge: "Odontología", text: "Antes perdía 2 horas por día contestando WhatsApps. Ahora Avax agenda todo automáticamente. Increíble.", name: "Dra. Romina Fernández", role: "Odontóloga · Clínica Dental Norte, CABA", avatar: "RF", grad: "from-[var(--ht-primary)] to-[var(--ht-primary-dark)]" },
  { badge: "Kinesiología", text: "El módulo de obras sociales me cambió la vida. Ya no tengo una libreta con lo que me deben — todo está en tiempo real.", name: "Lic. Marcos García", role: "Kinesiólogo · Centro de Rehabilitación Rosario", avatar: "MG", grad: "from-[var(--ht-accent)] to-[var(--ht-accent-dark)]" },
  { badge: "Nutrición", text: "Los reportes con IA me dieron claridad que nunca tuve. Ahora sé exactamente qué tratamientos generan más ingresos.", name: "Lic. Laura Pérez", role: "Nutricionista · Consultorio Integral Córdoba", avatar: "LP", grad: "from-[var(--ht-accent-warm)] to-amber-700" },
];

const plans = [
  {
    name: "Starter", price: "0", period: "14 días gratis · sin tarjeta", cta: "Empezar prueba", popular: false,
    features: ["1 profesional", "Hasta 100 pacientes", "Agenda y turnos", "Historia clínica básica", "Notificaciones básicas"],
  },
  {
    name: "Pro", price: "12.900", period: "por mes · hasta 3 profesionales", cta: "Empezar ahora", popular: true,
    features: ["Hasta 3 profesionales", "Pacientes ilimitados", "Agente Avax IA", "Cobros y Mercado Pago", "Obras sociales", "Consentimientos digitales", "NPS automático", "Reportes avanzados con IA"],
  },
  {
    name: "Clínica", price: "24.900", period: "por mes · profesionales ilimitados", cta: "Consultar", popular: false,
    features: ["Profesionales ilimitados", "Multi-sucursal", "Todo lo de Pro", "Dashboard configurable", "Chat interno de equipo", "Inventario y proveedores", "Soporte prioritario", "Webhooks avanzados"],
  },
];

const faqItems = [
  { q: "¿Necesito instalar algo?", a: "No. Avax Health es 100% web — funciona desde cualquier navegador, en computadora, tablet o celular. Sin instalaciones, sin configuraciones técnicas." },
  { q: "¿Cómo funciona el agente Avax IA por WhatsApp?", a: "El agente Avax se conecta a tu número de WhatsApp Business y atiende a tus pacientes en tiempo real. Puede buscar o crear pacientes, consultar disponibilidad, agendar turnos y responder preguntas sobre tu clínica — todo de forma autónoma." },
  { q: "¿Mis datos están seguros?", a: "Sí. Avax Health utiliza una arquitectura multi-tenant nativa donde los datos de cada clínica están completamente aislados. Usamos Supabase con Row-Level Security (RLS) y URLs firmadas con expiración para archivos médicos." },
  { q: "¿Puedo usarlo con múltiples profesionales?", a: "Sí. Podés agregar múltiples profesionales con diferentes roles (Admin, Profesional, Asistente). Cada profesional solo ve sus propios turnos y pacientes según su rol configurado." },
  { q: "¿Funciona con mi obra social?", a: "Avax Health tiene un módulo completo de obras sociales donde podés cargar el catálogo de coberturas, registrar prestaciones, hacer seguimiento de cuenta corriente y vincularlas al perfil de cada paciente." },
  { q: "¿Qué pasa cuando termina la prueba gratuita?", a: "Al finalizar los 14 días, el equipo de Avax Health te contacta para guiarte en la elección del plan que mejor se adapta a tu clínica. Tus datos no se eliminan y podés continuar sin interrupciones." },
];

/* ──────────── Page ──────────── */

export default function LandingPage() {
  useScrollReveal();
  useCountUp();
  useCardGlow();

  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="bg-[#060f1e] text-white">
      <style jsx global>{`
        .rv { opacity: 0; transform: translateY(26px); transition: opacity .65s cubic-bezier(0.16,1,0.3,1), transform .65s cubic-bezier(0.16,1,0.3,1); }
        .rv.on { opacity: 1; transform: translateY(0); }
        .rv.d1 { transition-delay: .1s; }
        .rv.d2 { transition-delay: .2s; }
        .rv.d3 { transition-delay: .3s; }
        .rv.d4 { transition-delay: .4s; }
        .fc-card { opacity: 0; transform: translateY(22px); transition: opacity .5s ease, transform .5s ease; }
        .fc-card.on { opacity: 1; transform: translateY(0); }
        .fc-card::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(500px circle at var(--mx,50%) var(--my,50%), rgba(2,132,199,.1), transparent 40%);
          opacity: 0; transition: opacity .25s;
        }
        .fc-card:hover::after { opacity: 1; }
        @keyframes gridDrift { from { background-position: 0 0; } to { background-position: 64px 64px; } }
        @keyframes aurA { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-28px) scale(1.06); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
        @keyframes up { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes flt { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeI { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: scale(.88); } to { opacity: 1; transform: scale(1); } }
        @keyframes bG { from { transform: scaleY(0); transform-origin: bottom; } to { transform: scaleY(1); } }
        @keyframes rotate {
          0%,28% { transform: translateY(0); }
          33%,61% { transform: translateY(-100%); }
          66%,94% { transform: translateY(-200%); }
          100% { transform: translateY(-200%); }
        }
        @keyframes marq { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pulsePB {
          0%,100% { box-shadow: 0 0 0 16px rgba(2,132,199,.12), 0 8px 32px rgba(2,132,199,.4); }
          50% { box-shadow: 0 0 0 24px rgba(2,132,199,.06), 0 8px 32px rgba(2,132,199,.4); }
        }
        @keyframes typing-dot { 0%,80%,100% { opacity: .3; transform: scale(.8); } 40% { opacity: 1; transform: scale(1); } }
      `}</style>

      {/* ════════ HERO ════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-[5%] pt-[120px] pb-20 bg-[linear-gradient(160deg,#040c18_0%,#071626_50%,#091e30_100%)]">
        {/* Animated grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(2,132,199,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(2,132,199,.04) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            animation: "gridDrift 40s linear infinite",
          }}
        />
        {/* Aurora blurs */}
        <div className="absolute -top-[120px] -right-[100px] w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(2,132,199,.18) 0%, transparent 70%)", filter: "blur(100px)", animation: "aurA 12s ease-in-out infinite" }} />
        <div className="absolute -bottom-[60px] left-[2%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(22,163,74,.12) 0%, transparent 70%)", filter: "blur(100px)", animation: "aurA 14s ease-in-out infinite reverse 2s" }} />
        <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(14,165,233,.08) 0%, transparent 70%)", filter: "blur(100px)", animation: "aurA 9s ease-in-out infinite 1s" }} />

        <div className="relative z-[2] max-w-[1200px] w-full grid grid-cols-1 lg:grid-cols-2 gap-[72px] items-center">
          {/* Left */}
          <div>
            <div
              className="inline-flex items-center gap-[7px] bg-[rgba(22,163,74,.1)] border border-[rgba(22,163,74,.3)] text-[#4ade80] text-[0.72rem] font-bold px-[13px] py-[5px] rounded-full uppercase tracking-[0.06em] mb-[22px]"
              style={{ animation: "up .7s ease both" }}
            >
              <span className="w-[6px] h-[6px] rounded-full bg-[#4ade80]" style={{ animation: "blink 2s infinite" }} />
              SaaS · Multi-especialidad · IA incluida
            </div>

            <h1
              className="font-display font-black leading-[1.06] tracking-[-0.03em] mb-5 text-[clamp(2.6rem,4.5vw,4rem)]"
              style={{ animation: "up .7s ease .1s both" }}
            >
              La plataforma<br />que hace que tu<br />clínica sea{" "}
              <span className="inline-block overflow-hidden align-bottom h-[1.06em]">
                <span className="flex flex-col" style={{ animation: "rotate 6s ease-in-out infinite" }}>
                  <span className="block whitespace-nowrap bg-gradient-to-br from-[var(--ht-primary-light)] to-[#4ade80] bg-clip-text text-transparent">inteligente.</span>
                  <span className="block whitespace-nowrap bg-gradient-to-br from-[var(--ht-primary-light)] to-[#4ade80] bg-clip-text text-transparent">autónoma.</span>
                  <span className="block whitespace-nowrap bg-gradient-to-br from-[var(--ht-primary-light)] to-[#4ade80] bg-clip-text text-transparent">rentable.</span>
                </span>
              </span>
            </h1>

            <p
              className="text-base text-white/60 leading-[1.75] max-w-[460px] mb-8"
              style={{ animation: "up .7s ease .2s both" }}
            >
              Centralizá pacientes, turnos, cobros e historia clínica. Con{" "}
              <strong className="text-white">Avax IA</strong> por WhatsApp, el consultorio trabaja solo mientras vos atendés.
            </p>

            <div className="flex gap-[14px] flex-wrap" style={{ animation: "up .7s ease .3s both" }}>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full px-[30px] py-[14px] font-display font-bold text-[0.95rem] text-white bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary-dark)] shadow-[0_4px_24px_rgba(2,132,199,.4)] hover:-translate-y-px hover:shadow-[0_8px_28px_rgba(2,132,199,.55)] transition-all"
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Empezar gratis
              </Link>
              <Link
                href="#video"
                className="inline-flex items-center gap-2 rounded-full px-[30px] py-[14px] font-display font-semibold text-[0.95rem] text-white/85 bg-white/[0.04] border-[1.5px] border-white/20 hover:bg-white/[0.09] hover:border-white/40 transition-colors"
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M10 8l6 4-6 4V8z" /></svg>
                Ver demo
              </Link>
            </div>

            <div className="flex gap-5 flex-wrap mt-9" style={{ animation: "up .7s ease .4s both" }}>
              {["Sin tarjeta requerida", "14 días gratis", "Todas las especialidades"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-white/45 text-[0.78rem]">
                  <svg className="text-[#4ade80] shrink-0" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4" /><rect x="3" y="3" width="18" height="18" rx="3" /></svg>
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right — Animated dashboard */}
          <div className="relative" style={{ animation: "up .8s ease .2s both" }}>
            {/* Floating cards */}
            <div className="hidden md:block absolute -top-[18px] -right-[26px] bg-[rgba(6,15,30,.88)] backdrop-blur-xl border border-white/[0.12] rounded-xl px-[14px] py-[10px] shadow-[0_8px_32px_rgba(0,0,0,.35)]" style={{ animation: "flt 4s ease-in-out infinite" }}>
              <div className="font-display text-[1.3rem] font-extrabold text-[#5EEAD4]">+34%</div>
              <div className="text-[0.6rem] text-white/45 mt-px">retención mensual</div>
            </div>
            <div className="hidden md:block absolute bottom-[16px] -left-[34px] bg-[rgba(6,15,30,.88)] backdrop-blur-xl border border-white/[0.12] rounded-xl px-[14px] py-[10px] shadow-[0_8px_32px_rgba(0,0,0,.35)]" style={{ animation: "flt 5s ease-in-out infinite 1.2s" }}>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80]" style={{ animation: "blink 2s infinite" }} />
                <span className="text-[0.58rem] text-white/40">Avax IA — en línea</span>
              </div>
              <div className="text-[0.7rem] text-white">3 turnos agendados hoy</div>
            </div>

            {/* Dashboard */}
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-[18px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,.5)]">
              <div className="bg-white/[0.05] px-[15px] py-[11px] flex items-center gap-1.5 border-b border-white/[0.06]">
                <div className="w-[9px] h-[9px] rounded-full bg-[#FF5F57]" />
                <div className="w-[9px] h-[9px] rounded-full bg-[#FEBC2E]" />
                <div className="w-[9px] h-[9px] rounded-full bg-[#28C840]" />
                <div className="flex-1 h-1.5 bg-white/[0.08] rounded-md ml-1.5" />
              </div>
              <div className="grid grid-cols-[120px_1fr]">
                <div className="bg-[rgba(6,15,30,.85)] py-3 px-[7px] border-r border-white/[0.05]" style={{ animation: "slideIn .6s ease .5s both" }}>
                  <div className="font-display text-[0.68rem] font-extrabold text-[var(--ht-primary-light)] mb-3.5 px-[5px]">Avax Health</div>
                  {["Dashboard", "Pacientes", "Agenda", "Cobros", "Reportes", "Avax IA"].map((item, i) => (
                    <div
                      key={item}
                      className={`px-[7px] py-1.5 rounded-md text-[0.58rem] mb-px flex items-center gap-1.5 ${
                        i === 0 ? "bg-[rgba(2,132,199,.18)] text-[var(--ht-primary-light)] border-l-2 border-[var(--ht-primary-light)]" : "text-white/40"
                      }`}
                      style={{ animation: `fadeI .4s ease ${0.7 + i * 0.1}s both` }}
                    >
                      <span className="w-1 h-1 rounded-full bg-current" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="p-[13px] bg-[rgba(240,253,250,.03)]">
                  <div className="font-display text-[0.62rem] font-bold text-white/60 mb-[9px]" style={{ animation: "fadeI .4s ease .9s both" }}>Dashboard · Hoy</div>
                  <div className="grid grid-cols-3 gap-[5px] mb-[9px]">
                    {[
                      { l: "Turnos", v: "18", c: "#22D3EE" },
                      { l: "Pacientes", v: "142", c: "#4ade80" },
                      { l: "Cobrado", v: "$86k", c: "#5EEAD4" },
                    ].map((k, i) => (
                      <div
                        key={k.l}
                        className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-[9px] py-2"
                        style={{ animation: `popIn .5s cubic-bezier(0.23,1,0.32,1) ${1 + i * 0.15}s both` }}
                      >
                        <div className="text-[0.5rem] text-white/35 mb-0.5">{k.l}</div>
                        <div className="font-display text-[0.9rem] font-extrabold" style={{ color: k.c }}>{k.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-[9px] py-2 mb-[7px]" style={{ animation: "fadeI .4s ease 1.4s both" }}>
                    <div className="text-[0.5rem] text-white/30 mb-1.5">Turnos por día</div>
                    <div className="flex items-end gap-1 h-10">
                      {[58, 43, 80, 52, 95, 68, 40].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-sm"
                          style={{
                            height: `${h}%`,
                            background: i === 2 ? "rgba(34,211,238,.7)" : i === 4 ? "rgba(94,234,212,.7)" : "rgba(2,132,199,.5)",
                            animation: `bG .7s ease ${1.5 + i * 0.1}s both`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-lg px-[9px] py-1.5">
                    {[
                      { d: "#22D3EE", n: "M. González — Kinesiología", t: "09:00", b: "✓", bbg: "rgba(22,163,74,.15)", bc: "#4ade80" },
                      { d: "#D97706", n: "R. Pérez — Nutrición", t: "10:30", b: "pend.", bbg: "rgba(215,119,6,.15)", bc: "#D97706" },
                      { d: "#0891B2", n: "L. Martínez — Odontología", t: "11:15", b: "nuevo", bbg: "rgba(2,132,199,.15)", bc: "#22D3EE" },
                    ].map((a, i) => (
                      <div
                        key={a.n}
                        className={`flex items-center gap-1.5 py-[3px] ${i < 2 ? "border-b border-white/[0.04]" : ""}`}
                        style={{ animation: `fadeI .4s ease ${2.1 + i * 0.15}s both` }}
                      >
                        <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ background: a.d }} />
                        <div className="text-[0.55rem] text-white/55 flex-1 truncate">{a.n}</div>
                        <div className="text-[0.5rem] text-white/30">{a.t}</div>
                        <div className="text-[0.44rem] px-[5px] py-px rounded-full font-semibold" style={{ background: a.bbg, color: a.bc }}>{a.b}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ TRUST STRIP ════════ */}
      <div className="bg-white/[0.03] border-y border-white/[0.06] py-[22px] px-[5%]">
        <div className="max-w-[1100px] mx-auto flex items-center justify-center gap-9 flex-wrap">
          {[
            { ico: "🔒", color: "rgba(2,132,199,.12)", name: "Datos 100% aislados", sub: "Multi-tenant nativo" },
            { ico: "✅", color: "rgba(22,163,74,.12)", name: "Sin tarjeta requerida", sub: "14 días de prueba" },
            { ico: "🏥", color: "rgba(2,132,199,.12)", name: "Multi-especialidad", sub: "Cualquier consultorio" },
            { ico: "⚡", color: "rgba(217,119,6,.12)", name: "Setup en 2 minutos", sub: "Activación inmediata" },
          ].map((b, i, arr) => (
            <div key={b.name} className="flex items-center gap-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[0.9rem] shrink-0" style={{ background: b.color }}>{b.ico}</div>
                <div>
                  <div className="font-display text-[0.8rem] text-white/75">{b.name}</div>
                  <div className="text-[0.68rem] text-white/40">{b.sub}</div>
                </div>
              </div>
              {i < arr.length - 1 && <div className="hidden md:block w-px h-7 bg-white/[0.08] ml-9" />}
            </div>
          ))}
        </div>
      </div>

      {/* ════════ BIG METRICS ════════ */}
      <section className="bg-[linear-gradient(135deg,#040c18,#071a28)] py-20 px-[5%] relative overflow-hidden">
        <div className="text-center max-w-[660px] mx-auto mb-[52px] rv">
          <SectionStag tone="white">Impacto real</SectionStag>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">Números que hablan por sí solos</h2>
          <p className="text-base leading-[1.7] text-white/55">Datos de clínicas y consultorios que ya transformaron su gestión con Avax Health.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 max-w-[1000px] mx-auto">
          {[
            { t: 3, suf: "", lbl: "horas ahorradas\npor día", sub: "en tareas administrativas" },
            { t: 20, suf: "+", lbl: "módulos integrados\nen una sola plataforma", sub: "agenda, cobros, IA y más" },
            { t: 14, suf: " días", lbl: "de prueba gratuita\nsin tarjeta", sub: "activación inmediata" },
            { t: 100, suf: "%", lbl: "datos aislados\npor clínica", sub: "seguridad multi-tenant" },
          ].map((m, i) => (
            <div key={i} className={`text-center px-5 py-10 relative rv d${i}`}>
              {i > 0 && <div className="hidden md:block absolute left-0 top-[20%] h-[60%] w-px bg-white/[0.08]" />}
              <div className="metric-num font-display text-[3.5rem] font-black leading-none bg-gradient-to-br from-[var(--ht-primary-light)] to-[#4ade80] bg-clip-text text-transparent" data-t={m.t} data-suf={m.suf}>0</div>
              <div className="text-[0.85rem] text-white/50 mt-2 leading-snug whitespace-pre-line">{m.lbl}</div>
              <div className="text-[0.72rem] text-white/30 mt-1">{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ SPECIALTIES MARQUEE ════════ */}
      <div className="bg-white/[0.02] py-[52px] px-[5%] border-t border-white/[0.05] rv">
        <div className="text-center max-w-[660px] mx-auto mb-8">
          <SectionStag>Multi-especialidad</SectionStag>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] text-white text-[clamp(1.6rem,2.6vw,2.2rem)]">Para cualquier especialidad médica</h2>
        </div>
        <div className="overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
          <div className="flex gap-3 w-max" style={{ animation: "marq 28s linear infinite" }}>
            {[...specialties, ...specialties].map((s, i) => (
              <div key={i} className="bg-white/[0.05] border border-white/[0.08] rounded-full px-[17px] py-2 text-[0.82rem] font-medium text-white/60 whitespace-nowrap flex items-center gap-1.5 hover:bg-[rgba(2,132,199,.12)] transition-colors">
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════ PROBLEM ════════ */}
      <section className="bg-[#040c18] py-24 px-[5%]">
        <div className="text-center max-w-[660px] mx-auto mb-[52px] rv">
          <span className="inline-block bg-[rgba(220,38,38,.1)] text-[#fca5a5] text-[0.7rem] font-bold px-3 py-1 rounded-full uppercase tracking-[0.08em] mb-3 border border-[rgba(220,38,38,.2)]">El problema</span>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">¿Cuántas horas perdés cada día en esto?</h2>
          <p className="text-base leading-[1.7] text-white/55">Los profesionales dedican hasta 3 horas diarias a tareas que deberían ser automáticas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[18px] max-w-[1100px] mx-auto">
          {painPoints.map((p, i) => (
            <div key={p.title} className={`bg-white/[0.03] border border-white/[0.07] rounded-[18px] p-6 hover:-translate-y-1 hover:border-[rgba(220,38,38,.3)] transition-all rv d${(i % 3) + 1}`}>
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="font-display text-[0.95rem] font-bold text-white mb-1.5">{p.title}</div>
              <div className="text-[0.85rem] text-white/45 leading-relaxed">{p.desc}</div>
            </div>
          ))}
        </div>
        <div className="text-center pt-10 font-display text-[1.2rem] font-extrabold text-[#5EEAD4] flex items-center justify-center gap-4 mt-6">
          <span className="flex-1 h-px bg-gradient-to-r from-transparent via-[rgba(94,234,212,.25)] to-[rgba(94,234,212,.25)]" />
          Avax Health lo resuelve todo
          <span className="flex-1 h-px bg-gradient-to-r from-[rgba(94,234,212,.25)] via-[rgba(94,234,212,.25)] to-transparent" />
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section id="funcionalidades" className="bg-[#050e1b] py-24 px-[5%]">
        <div className="text-center max-w-[660px] mx-auto mb-[52px] rv">
          <SectionStag>Funcionalidades</SectionStag>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">Todo en un solo lugar</h2>
          <p className="text-base leading-[1.7] text-white/55">Más de 20 módulos integrados diseñados para el flujo real de un consultorio médico.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px] max-w-[1100px] mx-auto">
          {features.map((f) => (
            <div
              key={f.title}
              className="fc-card relative overflow-hidden bg-white/[0.03] border border-white/[0.07] rounded-[18px] p-[26px] hover:border-[var(--ht-primary)]/25 transition-colors"
            >
              <div className={`w-[46px] h-[46px] rounded-[11px] flex items-center justify-center text-[1.2rem] mb-4 bg-gradient-to-br ${f.grad}`}>{f.icon}</div>
              <div className="font-display text-[0.95rem] font-bold text-white mb-1.5 relative z-[1]">{f.title}</div>
              <div className="text-[0.85rem] text-white/45 leading-relaxed relative z-[1]">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ COMPARISON ════════ */}
      <section className="bg-[linear-gradient(160deg,#040c18,#071626)] py-24 px-[5%]">
        <div className="text-center max-w-[660px] mx-auto mb-[52px] rv">
          <SectionStag>Comparación</SectionStag>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">Antes vs. con Avax Health</h2>
          <p className="text-base leading-[1.7] text-white/55">La diferencia entre un consultorio que sobrevive y uno que crece.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[900px] mx-auto">
          <div className="rv rounded-[22px] p-8 bg-[rgba(220,38,38,.06)] border border-[rgba(220,38,38,.15)]">
            <div className="font-display text-base font-extrabold mb-6 flex items-center gap-2.5 text-[#fca5a5]">❌ Sin Avax Health</div>
            {beforeList.map((item, i) => (
              <div key={item} className={`flex items-start gap-2.5 py-2.5 ${i < beforeList.length - 1 ? "border-b border-white/[0.05]" : ""} text-[0.875rem] text-white/65`}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-px bg-[rgba(220,38,38,.2)] text-[#fca5a5]">✗</div>
                {item}
              </div>
            ))}
          </div>
          <div className="rv d1 rounded-[22px] p-8 bg-[rgba(2,132,199,.07)] border border-[rgba(2,132,199,.2)]">
            <div className="font-display text-base font-extrabold mb-6 flex items-center gap-2.5 text-[#4ade80]">✅ Con Avax Health</div>
            {afterList.map((item, i) => (
              <div key={item} className={`flex items-start gap-2.5 py-2.5 ${i < afterList.length - 1 ? "border-b border-white/[0.05]" : ""} text-[0.875rem] text-white/65`}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-px bg-[rgba(22,163,74,.2)] text-[#4ade80]">✓</div>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ AGENT IA ════════ */}
      <section id="agente" className="bg-[#040c18] py-24 px-[5%] relative overflow-hidden">
        <div className="absolute -top-[120px] -right-[100px] w-[600px] h-[600px] rounded-full pointer-events-none opacity-30" style={{ background: "radial-gradient(circle, rgba(2,132,199,.18) 0%, transparent 70%)", filter: "blur(100px)" }} />
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-[72px] items-center relative">
          <div className="rv">
            <SectionStag tone="green">Agente IA</SectionStag>
            <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">Avax trabaja mientras vos atendés.</h2>
            <p className="text-base leading-[1.7] text-white/55">Tu agente virtual por WhatsApp gestiona turnos de forma autónoma, 24/7.</p>
            <div className="flex flex-col gap-2.5 mt-[26px]">
              {agentFeatures.map((af) => (
                <div key={af.title} className="flex gap-3 items-start bg-white/[0.03] border border-white/[0.06] rounded-[13px] px-[17px] py-3.5 hover:border-[rgba(22,163,74,.3)] hover:translate-x-1 transition-all">
                  <div className="w-[33px] h-[33px] rounded-[9px] bg-[rgba(22,163,74,.14)] flex items-center justify-center text-[0.9rem] shrink-0">{af.icon}</div>
                  <div>
                    <div className="font-display text-[0.875rem] font-bold text-white mb-0.5">{af.title}</div>
                    <div className="text-[0.78rem] text-white/45">{af.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rv d2">
            <div className="bg-[#e5ddd5] rounded-[18px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,.5)]">
              <div className="bg-[#075E54] px-[15px] py-[11px] flex items-center gap-2.5">
                <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-accent)] flex items-center justify-center font-display font-bold text-[0.9rem] text-white">A</div>
                <div>
                  <div className="font-bold text-white text-[0.85rem]">Avax — Clínica Dental Sonrisa</div>
                  <div className="text-[0.65rem] text-white/65">en línea</div>
                </div>
              </div>
              <div className="p-[13px] flex flex-col gap-2 bg-[#ddd]">
                <Bubble side="s" text="Hola! Quiero sacar un turno" time="09:12" />
                <Bubble side="r" text="¡Hola! Soy Avax 👋 ¿Me decís tu nombre?" time="09:12" />
                <Bubble side="s" text="María González" time="09:13" />
                <Bubble side="r" text="Perfecto María 😊 Tengo el miércoles a las 10:00 o el jueves a las 15:30. ¿Cuál te viene mejor?" time="09:13" />
                <Bubble side="s" text="El jueves 15:30!" time="09:14" />
                <Bubble side="r" text="¡Listo! Turno confirmado el jueves 15:30 con Dr. Ramírez. Recordatorio 24hs antes. ✅" time="09:14" />
                <div className="bg-white rounded-[10px] rounded-tl-[3px] py-2 px-2.5 self-start shadow-[0_1px_2px_rgba(0,0,0,.1)]">
                  <div className="flex gap-[3px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#aaa]" style={{ animation: "typing-dot 1.2s infinite" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#aaa]" style={{ animation: "typing-dot 1.2s infinite .2s" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#aaa]" style={{ animation: "typing-dot 1.2s infinite .4s" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ VIDEO SHOWREEL ════════ */}
      <section id="video" className="bg-[linear-gradient(160deg,#071626,#040c18)] py-24 px-[5%]">
        <div className="text-center max-w-[660px] mx-auto mb-[52px] rv">
          <SectionStag>Demo</SectionStag>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">Mirá Avax Health en acción</h2>
          <p className="text-base leading-[1.7] text-white/55">Un recorrido completo por la plataforma — desde el primer turno hasta el reporte mensual con IA.</p>
        </div>
        <div className="rv max-w-[900px] mx-auto rounded-[24px] overflow-hidden relative bg-gradient-to-br from-[var(--ht-primary)]/[0.08] to-[var(--ht-accent)]/[0.05] border border-[var(--ht-primary)]/20 shadow-[0_32px_80px_rgba(0,0,0,.5)]">
          <div className="aspect-video flex items-center justify-center flex-col gap-5 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#040c18] to-[#071a28] flex items-center justify-center">
              <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(2,132,199,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(2,132,199,.04) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
            </div>
            <button className="relative z-[2] w-20 h-20 rounded-full bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform" style={{ animation: "pulsePB 2.5s ease-in-out infinite" }}>
              <svg width="28" height="28" fill="#fff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <div className="relative z-[2] text-center">
              <h3 className="font-display text-[1.4rem] font-extrabold text-white mb-1.5">Tour completo de la plataforma</h3>
              <p className="text-[0.875rem] text-white/50">6 minutos · Todas las funcionalidades · Sin instalación</p>
              <div className="flex justify-center gap-3 mt-4 flex-wrap">
                {["📅 Agenda en vivo", "🤖 Agente IA", "📊 Reportes", "💰 Cobros"].map((b) => (
                  <span key={b} className="bg-white/[0.06] border border-white/10 rounded-full px-4 py-1.5 text-[0.75rem] text-white/60 font-semibold">{b}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section className="bg-[#050e1b] py-24 px-[5%]">
        <div className="text-center max-w-[660px] mx-auto mb-[52px] rv">
          <SectionStag>Testimonios</SectionStag>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">Lo que dicen nuestros profesionales</h2>
          <p className="text-base leading-[1.7] text-white/55">Clínicas y consultorios de toda Argentina ya transformaron su gestión.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px] max-w-[1100px] mx-auto">
          {testimonials.map((t, i) => (
            <div key={t.name} className={`relative bg-white/[0.03] border border-white/[0.07] rounded-[20px] p-[26px] hover:-translate-y-1 hover:border-[var(--ht-primary)]/25 transition-all rv d${i + 1}`}>
              <div className="absolute top-[18px] right-[18px] bg-[rgba(2,132,199,.1)] border border-[rgba(2,132,199,.2)] rounded-full px-2.5 py-0.5 text-[0.62rem] font-bold text-[var(--ht-primary-light)] uppercase tracking-[0.06em]">{t.badge}</div>
              <div className="flex gap-0.5 mb-3">{[...Array(5)].map((_, k) => <span key={k} className="text-[#F59E0B] text-[0.85rem]">★</span>)}</div>
              <p className="text-[0.875rem] text-white/65 leading-[1.75] mb-4 italic">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[0.85rem] text-white shrink-0 bg-gradient-to-br ${t.grad}`}>{t.avatar}</div>
                <div>
                  <div className="font-display text-[0.85rem] font-bold text-white">{t.name}</div>
                  <div className="text-[0.75rem] text-white/40">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ INTEGRATIONS ════════ */}
      <section id="integraciones" className="bg-[#040c18] py-24 px-[5%]">
        <div className="text-center max-w-[660px] mx-auto mb-[52px] rv">
          <SectionStag>Integraciones</SectionStag>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">Conectado con lo que ya usás</h2>
          <p className="text-base leading-[1.7] text-white/55">Integración nativa sin configuraciones complejas.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[18px] max-w-[900px] mx-auto mb-11">
          <div className="rv d1 bg-white/[0.03] border border-white/[0.07] rounded-[18px] px-5 py-6 text-center hover:-translate-y-1.5 hover:border-[var(--ht-primary)]/25 hover:shadow-[0_16px_40px_rgba(0,0,0,.3)] transition-all">
            <div className="w-[52px] h-[52px] rounded-[13px] bg-[#25D366] shadow-[0_4px_16px_rgba(37,211,102,.3)] flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.86L.057 23.852a.5.5 0 0 0 .619.608l6.15-1.61A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.51-5.25-1.4l-.38-.22-3.91 1.02 1.04-3.8-.25-.39A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" /></svg>
            </div>
            <div className="font-display font-bold text-white text-[0.9rem] mb-1">WhatsApp</div>
            <div className="text-[0.77rem] text-white/40 leading-snug">Avax IA gestiona turnos, recordatorios y consentimientos automáticamente</div>
          </div>
          <div className="rv d2 bg-white/[0.03] border border-white/[0.07] rounded-[18px] px-5 py-6 text-center hover:-translate-y-1.5 hover:border-[var(--ht-primary)]/25 hover:shadow-[0_16px_40px_rgba(0,0,0,.3)] transition-all">
            <div className="w-[52px] h-[52px] rounded-[13px] bg-gradient-to-br from-[#009EE3] to-[#0070BA] shadow-[0_4px_16px_rgba(0,158,227,.3)] flex items-center justify-center mx-auto mb-3">
              <svg width="26" height="16" viewBox="0 0 30 20" fill="none"><rect x="1" y="1" width="28" height="18" rx="4" fill="none" stroke="#fff" strokeWidth="1.5" /><circle cx="11" cy="10" r="5" fill="#fff" opacity=".9" /><circle cx="19" cy="10" r="5" fill="#fff" opacity=".55" /></svg>
            </div>
            <div className="font-display font-bold text-white text-[0.9rem] mb-1">Mercado Pago</div>
            <div className="text-[0.77rem] text-white/40 leading-snug">Cada clínica conecta sus credenciales para cobrar turnos en línea</div>
          </div>
          <div className="rv d3 bg-white/[0.03] border border-white/[0.07] rounded-[18px] px-5 py-6 text-center hover:-translate-y-1.5 hover:border-[var(--ht-primary)]/25 hover:shadow-[0_16px_40px_rgba(0,0,0,.3)] transition-all">
            <div className="w-[52px] h-[52px] rounded-[13px] bg-white border-[1.5px] border-[#e5e7eb] shadow-[0_4px_16px_rgba(0,0,0,.08)] flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            </div>
            <div className="font-display font-bold text-white text-[0.9rem] mb-1">Google</div>
            <div className="text-[0.77rem] text-white/40 leading-snug">Calendar, Sheets y Docs — sincronización completa</div>
            <div className="flex justify-center gap-1.5 mt-2.5 flex-wrap">
              {[
                { l: "Calendar", c: "rgba(2,132,199,.1)", t: "#22D3EE", b: "rgba(2,132,199,.2)" },
                { l: "Sheets", c: "rgba(22,163,74,.1)", t: "#4ade80", b: "rgba(22,163,74,.2)" },
                { l: "Docs", c: "rgba(217,119,6,.1)", t: "#D97706", b: "rgba(217,119,6,.2)" },
              ].map((tag) => (
                <span key={tag.l} className="text-[0.6rem] px-2 py-0.5 rounded-full font-semibold" style={{ background: tag.c, color: tag.t, border: `1px solid ${tag.b}` }}>{tag.l}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="rv max-w-[900px] mx-auto bg-white/[0.03] border border-white/[0.08] rounded-[22px] px-10 py-9 flex items-center gap-11 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <div className="text-[0.7rem] font-bold text-[#5EEAD4] uppercase tracking-[0.08em] mb-2.5">🔗 Webhooks Configurables</div>
            <h3 className="font-display text-[1.3rem] font-extrabold text-white mb-2">Conectá con cualquier sistema</h3>
            <p className="text-[0.875rem] text-white/50 leading-[1.7]">6 eventos configurables. Compatible con n8n, Zapier, Make o cualquier endpoint propio.</p>
          </div>
          <pre className="bg-black/35 border border-white/[0.08] rounded-[11px] p-4 font-mono text-[0.68rem] text-[#4ade80] leading-[1.8] flex-1 min-w-[220px] overflow-x-auto">
{`// Payload ejemplo
{
  "evento": "turno_confirmado",
  "paciente": "María González",
  "fecha": "2026-04-28 15:30"
}`}
          </pre>
        </div>
      </section>

      {/* ════════ PRICING ════════ */}
      <section id="pricing" className="bg-[#050e1b] py-24 px-[5%]">
        <div className="text-center max-w-[660px] mx-auto mb-[52px] rv">
          <SectionStag>Planes</SectionStag>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">Empezá gratis. Escalá cuando crezcas.</h2>
          <p className="text-base leading-[1.7] text-white/55">Sin tarjeta de crédito. 14 días completos. Cancelás cuando quieras.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[960px] mx-auto">
          {plans.map((p, i) => (
            <div
              key={p.name}
              className={`relative overflow-hidden rounded-[22px] p-8 transition-all rv d${i} ${
                p.popular
                  ? "bg-white/[0.03] border border-[rgba(2,132,199,.4)] shadow-[0_8px_40px_rgba(2,132,199,.15)] scale-[1.02] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(2,132,199,.2)]"
                  : "bg-white/[0.03] border border-white/[0.08] hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,.3)]"
              }`}
            >
              {p.popular && (
                <div className="absolute top-[19px] -right-[26px] bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary)] text-white text-[0.65rem] font-bold py-1 px-9 rotate-[35deg] uppercase tracking-[0.08em]">Popular</div>
              )}
              <div className="font-display text-[0.78rem] font-bold text-white/45 uppercase tracking-[0.1em] mb-1.5">{p.name}</div>
              <div className="font-display text-[2.4rem] font-black text-white leading-none">
                <sup className="text-base align-super">$</sup>{p.price}
              </div>
              <div className="text-[0.8rem] text-white/40 mt-1 mb-5">{p.period}</div>
              <ul className="list-none mb-[26px] flex flex-col gap-2">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 items-start text-[0.83rem] text-white/65 before:content-['✓'] before:text-[#4ade80] before:font-bold before:shrink-0 before:mt-px">{f}</li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block w-full text-center py-3 rounded-full font-display font-bold text-[0.875rem] transition-all ${
                  p.popular
                    ? "bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary-dark)] text-white shadow-[0_4px_20px_rgba(2,132,199,.35)] hover:-translate-y-px hover:shadow-[0_8px_28px_rgba(2,132,199,.5)]"
                    : "border-[1.5px] border-[rgba(2,132,199,.5)] text-[var(--ht-primary-light)] hover:bg-[rgba(2,132,199,.08)]"
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ FAQ ════════ */}
      <section id="faq" className="bg-[#040c18] py-24 px-[5%]">
        <div className="text-center max-w-[660px] mx-auto mb-[52px] rv">
          <SectionStag>FAQ</SectionStag>
          <h2 className="font-display font-extrabold leading-[1.15] tracking-[-0.02em] mb-3 text-white text-[clamp(1.8rem,3vw,2.6rem)]">Preguntas frecuentes</h2>
          <p className="text-base leading-[1.7] text-white/55">Todo lo que necesitás saber antes de empezar.</p>
        </div>
        <div className="max-w-[760px] mx-auto flex flex-col gap-2.5">
          {faqItems.map((item, i) => (
            <div
              key={item.q}
              className={`bg-white/[0.03] border rounded-[14px] overflow-hidden transition-colors ${
                openFaq === i ? "border-[rgba(2,132,199,.25)]" : "border-white/[0.07]"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="flex items-center justify-between w-full px-[22px] py-[18px] gap-3 text-left"
              >
                <span className="font-display text-[0.95rem] font-bold text-white">{item.q}</span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[0.75rem] shrink-0 transition-all ${
                    openFaq === i
                      ? "bg-[rgba(2,132,199,.15)] text-[var(--ht-primary-light)] rotate-180"
                      : "bg-white/[0.06] text-white/50"
                  }`}
                >▾</span>
              </button>
              <div
                className="overflow-hidden transition-[max-height] duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]"
                style={{ maxHeight: openFaq === i ? "200px" : "0" }}
              >
                <p className="px-[22px] pb-[18px] text-[0.875rem] text-white/50 leading-[1.72]">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════ CTA FINAL ════════ */}
      <section id="trial" className="bg-[linear-gradient(160deg,#040c18,#071626)] py-24 px-[5%] text-center relative overflow-hidden">
        <div className="absolute -top-[120px] -right-[100px] w-[600px] h-[600px] rounded-full pointer-events-none opacity-40" style={{ background: "radial-gradient(circle, rgba(2,132,199,.18) 0%, transparent 70%)", filter: "blur(100px)", animation: "aurA 12s ease-in-out infinite" }} />
        <div className="absolute -bottom-[60px] left-[2%] w-[400px] h-[400px] rounded-full pointer-events-none opacity-40" style={{ background: "radial-gradient(circle, rgba(22,163,74,.12) 0%, transparent 70%)", filter: "blur(100px)", animation: "aurA 14s ease-in-out infinite reverse 2s" }} />
        <div className="relative z-[2]">
          <SectionStag tone="white">Empezá hoy</SectionStag>
          <h2 className="font-display font-black text-white tracking-[-0.025em] mb-4 text-[clamp(2rem,4vw,3rem)] mt-5">
            Tu clínica organizada.<br />Desde el primer día.
          </h2>
          <p className="text-base text-white/55 max-w-[500px] mx-auto mb-8">
            Registrate en menos de 2 minutos y probá Avax Health sin riesgos durante 14 días completos.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full px-9 py-4 font-display font-bold text-base text-white bg-gradient-to-br from-[var(--ht-primary-light)] to-[var(--ht-primary-dark)] shadow-[0_4px_24px_rgba(2,132,199,.4)] hover:-translate-y-px hover:shadow-[0_8px_28px_rgba(2,132,199,.55)] transition-all"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Crear mi cuenta gratis
          </Link>
          <div className="text-[0.75rem] text-white/30 mt-3.5">
            Sin tarjeta de crédito · Activación inmediata · Cancelás cuando quieras
          </div>
        </div>
      </section>
    </div>
  );
}

/* ──────────── Sub-components ──────────── */

function SectionStag({ children, tone = "primary" }: { children: React.ReactNode; tone?: "primary" | "green" | "white" }) {
  const styles = {
    primary: "bg-[rgba(2,132,199,.09)] text-[var(--ht-primary-light)] border-[rgba(2,132,199,.2)]",
    green: "bg-[rgba(22,163,74,.1)] text-[#4ade80] border-[rgba(22,163,74,.25)]",
    white: "bg-white/[0.06] text-white/60 border-white/[0.12]",
  }[tone];
  return (
    <div className={`inline-block text-[0.7rem] font-bold px-3 py-1 rounded-full uppercase tracking-[0.08em] mb-3 border ${styles}`}>{children}</div>
  );
}

function Bubble({ side, text, time }: { side: "s" | "r"; text: string; time: string }) {
  const isSent = side === "s";
  return (
    <div
      className={`max-w-[78%] py-1.5 px-2.5 rounded-[10px] text-[0.75rem] leading-[1.5] text-[#111] shadow-[0_1px_2px_rgba(0,0,0,.1)] ${
        isSent ? "bg-[#DCF8C6] self-end rounded-tr-[3px]" : "bg-white self-start rounded-tl-[3px]"
      }`}
    >
      {text}
      <span className="text-[0.56rem] text-black/40 float-right ml-2 mt-0.5">{time}</span>
    </div>
  );
}
