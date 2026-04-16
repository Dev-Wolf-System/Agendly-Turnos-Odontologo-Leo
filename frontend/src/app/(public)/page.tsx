"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

/* ── Intersection Observer hook for fade-in animations ── */

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("animate-in");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    const children = el.querySelectorAll(".reveal");
    children.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);
  return ref;
}

/* ── Inline SVG Icons ── */

function CalendarIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
      <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
      <path d="M8 18h.01" /><path d="M12 18h.01" />
    </svg>
  );
}

function ClipboardIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  );
}

function CreditCardIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" />
    </svg>
  );
}

function PackageIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
  );
}

function MessageIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" />
    </svg>
  );
}

function BuildingIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
      <path d="M12 10h.01" /><path d="M12 14h.01" />
      <path d="M16 10h.01" /><path d="M16 14h.01" />
      <path d="M8 10h.01" /><path d="M8 14h.01" />
    </svg>
  );
}

function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" />
    </svg>
  );
}

function ArrowRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function ChevronDownIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* ── Dashboard Mockup ── */

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[var(--ht-primary)]/20 via-[var(--ht-primary-light)]/20 to-[var(--ht-accent-dark)]/10 blur-2xl" />
      <div className="relative rounded-xl border border-border/60 bg-card shadow-2xl shadow-[var(--ht-primary)]/10 overflow-hidden">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-border/40 bg-muted/50 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <div className="w-3 h-3 rounded-full bg-green-400/70" />
          </div>
          <div className="flex-1 mx-8">
            <div className="mx-auto max-w-sm rounded-md bg-background/80 border border-border/30 px-3 py-1 text-xs text-muted-foreground text-center">
              avaxhealth.com/dashboard
            </div>
          </div>
        </div>
        {/* Dashboard content mockup */}
        <div className="p-4 sm:p-6 bg-background/50">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Turnos Hoy", value: "12", color: "from-blue-500 to-[var(--ht-primary)]" },
              { label: "Pacientes", value: "847", color: "from-[var(--ht-primary-light)] to-[var(--ht-accent-dark)]" },
              { label: "Ingresos", value: "$284k", color: "from-emerald-500 to-teal-500" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-border/40 bg-card p-3">
                <p className="text-[10px] sm:text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-lg sm:text-2xl font-bold bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent`}>
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border/40 bg-card p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs sm:text-sm font-semibold">Agenda del día</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Abril 2026</div>
            </div>
            <div className="space-y-2">
              {[
                { time: "09:00", name: "María García", type: "Consulta", bg: "bg-blue-500/10 border-blue-500/20" },
                { time: "10:30", name: "Juan López", type: "Control", bg: "bg-emerald-500/10 border-emerald-500/20" },
                { time: "11:00", name: "Ana Martínez", type: "Limpieza", bg: "bg-purple-500/10 border-purple-500/20" },
                { time: "14:00", name: "Carlos Ruiz", type: "Ortodoncia", bg: "bg-amber-500/10 border-amber-500/20" },
              ].map((apt) => (
                <div key={apt.time} className={`flex items-center gap-3 rounded-lg border ${apt.bg} px-3 py-2`}>
                  <span className="text-[10px] sm:text-xs font-mono text-muted-foreground w-10">{apt.time}</span>
                  <span className="text-xs sm:text-sm font-medium flex-1 truncate">{apt.name}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">{apt.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Data ── */

const features = [
  {
    icon: CalendarIcon,
    title: "Gestión de Turnos",
    description: "Calendario inteligente con vistas diaria, semanal y lista. Control de solapamiento y recordatorios automáticos por WhatsApp.",
    gradient: "from-blue-500 to-[var(--ht-primary)]",
  },
  {
    icon: ClipboardIcon,
    title: "Historial Médico",
    description: "Fichas completas por paciente con timeline de procedimientos, diagnósticos y documentos adjuntos.",
    gradient: "from-[var(--ht-primary)] to-[var(--ht-accent)]",
  },
  {
    icon: CreditCardIcon,
    title: "Pagos y Facturación",
    description: "Control financiero con KPIs en tiempo real, múltiples métodos de pago y reportes detallados por período.",
    gradient: "from-[var(--ht-primary-light)] to-[var(--ht-accent-dark)]",
  },
  {
    icon: PackageIcon,
    title: "Inventario y Proveedores",
    description: "Stock en tiempo real, alertas de bajo inventario y gestión de proveedores con categorías.",
    gradient: "from-[var(--ht-accent)] to-fuchsia-500",
  },
  {
    icon: MessageIcon,
    title: "WhatsApp + IA",
    description: "Agente inteligente que atiende pacientes 24/7: agenda turnos, responde consultas y envía recordatorios automáticamente.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BuildingIcon,
    title: "Multi-Clínica",
    description: "Panel de administración SaaS para gestionar múltiples clínicas, planes y suscripciones desde un lugar.",
    gradient: "from-amber-500 to-orange-500",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Registrate",
    description: "Creá tu cuenta en menos de 2 minutos. Sin tarjeta de crédito ni instalaciones.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Configurá",
    description: "Personalizá horarios, profesionales, tratamientos y más desde un panel intuitivo. Listo en minutos.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Gestioná",
    description: "Empezá a atender pacientes, agendar turnos y hacer crecer tu negocio desde el día uno.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
      </svg>
    ),
  },
];

const testimonials = [
  {
    name: "Dra. Laura Méndez",
    role: "Directora — Centro Odontológico Sonrisa",
    text: "Desde que usamos Avax Health, la gestión de turnos pasó de ser un caos a algo automático. Nuestros pacientes reciben recordatorios y la agenda se organiza sola.",
    avatar: "LM",
  },
  {
    name: "Dr. Martín Álvarez",
    role: "Kinesiólogo — Kinesis Centro",
    text: "El historial médico digital nos ahorró horas de papeleo. Ahora tengo todo el historial de cada paciente en segundos, desde cualquier dispositivo.",
    avatar: "MA",
  },
  {
    name: "Lic. Carolina Vega",
    role: "Administradora — Clínica Integral Salud",
    text: "El control financiero y los reportes nos dieron visibilidad real del negocio. Por primera vez sabemos exactamente cuánto facturamos por profesional.",
    avatar: "CV",
  },
];

const integrations = [
  { name: "WhatsApp", icon: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )},
  { name: "Google Calendar", icon: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  )},
  { name: "Mercado Pago", icon: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
      <path d="M12 18V6" />
    </svg>
  )},
  { name: "Gmail", icon: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )},
  { name: "Inteligencia Artificial", icon: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4v1h2a2 2 0 0 1 2 2v1a3 3 0 0 1-3 3h-1v2h1a3 3 0 0 1 3 3v1a2 2 0 0 1-2 2h-2v1a4 4 0 0 1-8 0v-1H6a2 2 0 0 1-2-2v-1a3 3 0 0 1 3-3h1v-2H7a3 3 0 0 1-3-3V9a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z" />
    </svg>
  )},
];

const stats = [
  { value: "+200", label: "Clínicas activas" },
  { value: "+40.000", label: "Turnos gestionados" },
  { value: "−60%", label: "Inasistencias con IA" },
  { value: "99.9%", label: "Uptime garantizado" },
];

const painPoints = [
  {
    emoji: "📱",
    problem: "¿Seguís coordinando turnos por WhatsApp?",
    solution: "Con Avax Health tu agenda se gestiona sola — recordatorios automáticos, confirmaciones y cancelaciones sin intervención manual.",
  },
  {
    emoji: "📋",
    problem: "¿El historial de tus pacientes está en papel o en planillas?",
    solution: "Digitalizá fichas médicas, diagnósticos y documentos. Buscá cualquier paciente en segundos desde cualquier dispositivo.",
  },
  {
    emoji: "💸",
    problem: "¿No sabés cuánto facturaste este mes por profesional?",
    solution: "Dashboard financiero en tiempo real con KPIs de ingresos, pagos pendientes y métricas de ocupación.",
  },
];

const audiences = [
  {
    title: "Consultorios",
    description: "Profesionales independientes que quieren digitalizar su práctica y ahorrar tiempo en administración.",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" /><path d="M2 20h20" /><path d="M14 12v.01" />
      </svg>
    ),
  },
  {
    title: "Clínicas",
    description: "Equipos de 2 a 20 profesionales que necesitan coordinar agendas y compartir historiales clínicos.",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="16" height="20" x="4" y="2" rx="2" /><path d="M9 22v-4h6v4" />
        <path d="M8 6h.01" /><path d="M16 6h.01" /><path d="M12 6h.01" />
        <path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" />
        <path d="M8 10h.01" /><path d="M8 14h.01" />
      </svg>
    ),
  },
  {
    title: "Centros Médicos",
    description: "Redes de salud con múltiples sedes que necesitan gestión centralizada y reportes consolidados.",
    icon: (
      <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
        <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />
      </svg>
    ),
  },
];

const faqItems = [
  {
    q: "¿Necesito instalar algo?",
    a: "No. Avax Health funciona 100% en la nube desde cualquier navegador. Sin instalaciones, sin servidores propios.",
  },
  {
    q: "¿Funciona para cualquier especialidad médica?",
    a: "Sí. Odontología, kinesiología, nutrición, psicología, medicina general y más. Podés configurar la especialidad y los tratamientos a medida.",
  },
  {
    q: "¿Qué pasa con mis datos si cancelo?",
    a: "Tus datos son tuyos. Si decidís cancelar, tenés 30 días para exportarlos. No eliminamos nada sin tu consentimiento.",
  },
  {
    q: "¿Puedo tener múltiples profesionales en la misma clínica?",
    a: "Sí. Cada profesional tiene su propia agenda, sus pacientes y sus estadísticas. El plan define cuántos usuarios podés tener.",
  },
  {
    q: "¿El agente de WhatsApp agenda turnos automáticamente?",
    a: "Sí. El agente IA puede buscar disponibilidad, confirmar turnos y enviar recordatorios sin intervención manual, las 24 horas.",
  },
  {
    q: "¿Hay período de prueba gratuito?",
    a: "Sí, 14 días gratis sin tarjeta de crédito. Acceso completo a todas las funcionalidades desde el primer día.",
  },
];

/* ── FAQ Item component ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-border/50 bg-card">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 font-medium text-sm sm:text-base select-none list-none">
        {q}
        <ChevronDownIcon className="w-5 h-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="px-6 pb-5 pt-0 text-sm text-muted-foreground leading-relaxed border-t border-border/40 mt-0 pt-4">
        {a}
      </div>
    </details>
  );
}

export default function LandingPage() {
  const containerRef = useScrollReveal();

  return (
    <div ref={containerRef}>
      <style jsx global>{`
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-gradient-to-br from-[var(--ht-primary)]/20 via-[var(--ht-primary-light)]/20 to-[var(--ht-accent-dark)]/10 blur-3xl" />
          <div className="absolute top-40 -left-40 h-72 w-72 rounded-full bg-[#0F172A]/10 blur-3xl" />
          <div className="absolute top-60 -right-40 h-72 w-72 rounded-full bg-[var(--ht-accent)]/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 sm:pt-24 sm:pb-12 lg:px-8 lg:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="reveal mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-[#0F172A]/10 px-4 py-1.5 text-sm font-medium text-primary/90">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--ht-primary-dark)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0F172A]" />
              </span>
              Plataforma SaaS para salud · 14 días gratis
            </div>

            <h1 className="reveal reveal-delay-1 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Tu clínica merece una gestión{" "}
              <span className="bg-gradient-to-r from-[var(--ht-primary)] via-[var(--ht-primary-light)] to-[var(--ht-accent-dark)] bg-clip-text text-transparent">
                del siglo XXI
              </span>
            </h1>

            <p className="reveal reveal-delay-2 mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Turnos, pacientes, historial médico, pagos e inventario. Todo en
              un solo lugar, impulsado por inteligencia artificial.{" "}
              <strong className="text-foreground">Sin papel, sin planillas, sin caos.</strong>
            </p>

            <div className="reveal reveal-delay-3 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--ht-primary)]/25 hover:opacity-90 hover:shadow-[var(--ht-primary)]/40 transition-all"
              >
                Empezar gratis — 14 días
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/planes"
                className="inline-flex items-center justify-center rounded-xl border border-border px-8 py-3.5 text-base font-semibold text-foreground hover:bg-muted transition-colors"
              >
                Ver planes y precios
              </Link>
            </div>

            <div className="reveal reveal-delay-4 mt-5 flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                Sin tarjeta de crédito
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                Cancelás cuando quieras
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                Soporte incluido
              </span>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="reveal mt-16 sm:mt-20">
            <DashboardMockup />
          </div>
        </div>
      </section>

      {/* ══════════════════ PAIN POINTS ══════════════════ */}
      <section className="relative py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              ¿Te suena familiar alguna de estas situaciones?
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {painPoints.map((p, i) => (
              <div
                key={p.problem}
                className={`reveal reveal-delay-${i + 1} rounded-xl border border-border/50 bg-card p-6 space-y-3`}
              >
                <div className="text-3xl">{p.emoji}</div>
                <p className="font-semibold text-sm leading-snug text-foreground">
                  {p.problem}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {p.solution}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ PARA QUIÉN ══════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Pensado para profesionales de la salud
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Desde consultorios individuales hasta redes de clínicas.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {audiences.map((a, i) => (
              <div
                key={a.title}
                className={`reveal reveal-delay-${i + 1} group relative rounded-xl border border-border/50 bg-card p-8 text-center transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-[var(--ht-primary)]/5`}
              >
                <div className="mx-auto mb-4 inline-flex rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] p-3 text-white shadow-md">
                  {a.icon}
                </div>
                <h3 className="text-lg font-semibold">{a.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {a.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="relative py-20 sm:py-28" id="funcionalidades">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--ht-primary)]/[0.02] to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Todo lo que tu clínica necesita
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Una plataforma integral que reemplaza múltiples herramientas dispersas.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`reveal reveal-delay-${(i % 3) + 1} group relative rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-border hover:shadow-lg hover:shadow-[var(--ht-primary)]/5`}
              >
                <div className={`mb-4 inline-flex rounded-xl bg-gradient-to-br ${f.gradient} p-3 text-white shadow-md`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-xl opacity-0 transition-opacity group-hover:opacity-100">
                  <div className={`absolute -inset-px rounded-xl bg-gradient-to-br ${f.gradient} opacity-[0.06]`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ CÓMO FUNCIONA ══════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Empezá en 3 pasos simples
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Registrate y tenés tu clínica funcionando en minutos.
            </p>
          </div>

          <div className="relative grid gap-8 sm:grid-cols-3">
            <div className="pointer-events-none absolute top-16 left-[16.67%] right-[16.67%] hidden sm:block">
              <div className="h-px w-full bg-gradient-to-r from-[var(--ht-primary)]/20 via-[var(--ht-primary-light)]/30 to-[var(--ht-accent-dark)]/20" />
            </div>

            {howItWorks.map((s, i) => (
              <div key={s.step} className={`reveal reveal-delay-${i + 1} relative text-center`}>
                <div className="relative mx-auto mb-6 inline-flex">
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-lg shadow-[var(--ht-primary)]/20">
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-background border-2 border-accent text-xs font-bold text-primary">
                    {s.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS ══════════════════ */}
      <section className="relative py-16 sm:py-20 reveal">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm px-6 py-12 sm:px-12">
            <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text text-transparent sm:text-4xl">
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

      {/* ══════════════════ TESTIMONIALS ══════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Lo que dicen nuestros clientes
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Profesionales de la salud que transformaron su gestión.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className={`reveal reveal-delay-${i + 1} rounded-xl border border-border/50 bg-card p-6 transition-all hover:shadow-lg hover:shadow-[var(--ht-primary)]/5`}
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-border/40 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-xs font-bold text-white shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ INTEGRATIONS ══════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--ht-primary)]/[0.02] to-transparent" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Se integra con tus herramientas
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Conectá WhatsApp, calendario, pagos y más desde un solo lugar.
            </p>
          </div>

          <div className="reveal flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            {integrations.map((ig) => (
              <div
                key={ig.name}
                className="group flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card px-6 py-5 transition-all hover:border-accent/30 hover:shadow-md"
              >
                <div className="text-muted-foreground group-hover:text-primary transition-colors">
                  {ig.icon}
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {ig.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURE HIGHLIGHTS ══════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Diseñado para crecer con vos
            </h2>
            <p className="mt-4 text-muted-foreground">
              Cada funcionalidad pensada para ahorrar tiempo y reducir errores.
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="reveal space-y-6">
              {[
                { title: "Recordatorios automáticos", desc: "Tus pacientes reciben recordatorios por WhatsApp antes de cada turno. Reducí inasistencias hasta un 60%." },
                { title: "Reportes en tiempo real", desc: "Dashboard con KPIs de turnos, ingresos, pacientes y ocupación. Tomá decisiones basadas en datos reales." },
                { title: "Multi-profesional", desc: "Cada profesional tiene su agenda, sus pacientes y sus estadísticas. Gestión centralizada con roles y permisos." },
                { title: "Seguridad y privacidad", desc: "Datos encriptados, roles y permisos por usuario. Cumplimos con los estándares de protección de datos de salud." },
              ].map((f) => (
                <div key={f.title} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircleIcon className="w-5 h-5 text-[var(--ht-accent)]" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{f.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="reveal reveal-delay-2 relative">
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[var(--ht-primary)]/10 via-[var(--ht-primary-light)]/10 to-transparent blur-2xl" />
              <div className="relative rounded-xl border border-border/60 bg-card shadow-xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Panel de control</p>
                    <p className="text-xs text-muted-foreground">Vista en tiempo real</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-3 text-muted-foreground">Turnos esta semana</p>
                  <div className="flex items-end gap-2 h-24">
                    {[40, 65, 85, 55, 90, 70, 45].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-[var(--ht-primary)] to-[var(--ht-accent)]"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {["L", "M", "X", "J", "V", "S", "D"][i]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: "Hoy", value: "12" },
                    { label: "Semana", value: "68" },
                    { label: "Ocupación", value: "87%" },
                  ].map((s) => (
                    <div key={s.label} className="text-center rounded-lg bg-muted/50 p-2">
                      <p className="text-lg font-bold bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent)] bg-clip-text text-transparent">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FAQ ══════════════════ */}
      <section className="relative py-20 sm:py-28" id="faq">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--ht-primary)]/[0.02] to-transparent" />
        </div>

        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-muted-foreground text-lg">
              Todo lo que necesitás saber antes de empezar.
            </p>
          </div>

          <div className="reveal space-y-3">
            {faqItems.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>

          <div className="reveal reveal-delay-2 mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Tenés otra pregunta?{" "}
              <a
                href="mailto:soporte@avaxhealth.com"
                className="font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Escribinos a soporte@avaxhealth.com
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA FINAL ══════════════════ */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[400px] w-[700px] rounded-full bg-gradient-to-t from-[var(--ht-primary-light)]/10 to-[var(--ht-primary)]/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="reveal relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-[var(--ht-primary)] to-[#0d1f33] px-6 py-16 sm:px-16 sm:py-20 text-center">
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[var(--ht-accent)]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[var(--ht-accent-dark)]/10 blur-3xl" />

            <div className="relative inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-sm text-white/80 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              14 días gratis — sin tarjeta de crédito
            </div>

            <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Transformá tu clínica{" "}
              <span className="bg-gradient-to-r from-[var(--ht-primary-light)] to-[var(--ht-accent-dark)] bg-clip-text text-transparent">
                hoy mismo
              </span>
            </h2>
            <p className="relative mt-4 text-lg text-white/70 max-w-xl mx-auto">
              Más de 200 profesionales de la salud ya gestionan su clínica con Avax Health.
              Soporte incluido desde el día uno.
            </p>
            <div className="relative mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary shadow-lg hover:bg-white/90 transition-all"
              >
                Comenzar ahora — Es gratis
                <ArrowRightIcon className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/planes"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Ver planes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
