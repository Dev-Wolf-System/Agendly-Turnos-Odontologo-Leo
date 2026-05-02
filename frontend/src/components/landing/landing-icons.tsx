/**
 * Iconografía custom para la landing — Lucide-style con toques médicos.
 * No usar Lucide ni emojis: cada ícono está diseñado para evocar el modelo
 * (clínica/consultorio + IA + automatización).
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const baseSvgProps = {
  fill: "none" as const,
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
};

function withDefaults({ size = 24, strokeWidth = 1.7, ...rest }: IconProps) {
  return { width: size, height: size, strokeWidth, ...baseSvgProps, ...rest };
}

/* ─── PROBLEM SECTION — frustraciones del profesional ─── */

/** Chat caótico — agendar por WhatsApp manualmente */
export function IconChatChaos(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9l3-2" opacity="0.55" />
      <path d="M13 11h-3" opacity="0.55" />
      <path d="M16 8l-2 4" opacity="0.7" />
      <circle cx="17" cy="14" r="0.6" fill="currentColor" />
      <circle cx="8.5" cy="13.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** Carpeta médica desordenada — historial en papel */
export function IconPaperStack(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M3 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 13h6" opacity="0.65" />
      <path d="M9 16h4" opacity="0.45" />
      <path d="M14 9.5v3" />
      <path d="M12.5 11h3" />
    </svg>
  );
}

/** Gráfico con interrogación — no sé cuánto facturé */
export function IconRevenueUnknown(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 2 4-5" opacity="0.6" />
      <path d="M16 9.2c.5-1.4 2.6-1.4 3 .1.3 1-.5 1.7-1.5 2 -.5.2-.5.7-.5 1.2" />
      <circle cx="17" cy="15.8" r="0.6" fill="currentColor" />
    </svg>
  );
}

/* ─── BENTO FEATURES — núcleo del producto ─── */

/** Calendar con cruz médica — Gestión de Turnos */
export function IconCalendarMedical(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <rect x="3" y="4" width="18" height="18" rx="2.5" />
      <path d="M8 2v4M16 2v4M3 10h18" />
      <path d="M12 13v5M9.5 15.5h5" strokeWidth={2.4} />
    </svg>
  );
}

/** File con pulso (ECG line) — Historial Médico */
export function IconFilePulse(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" opacity="0.6" />
      <path d="M7 14h2l1.5-3 2 6 1.5-3h3" strokeWidth={2.1} />
    </svg>
  );
}

/** Receipt con barras — Pagos y Facturación */
export function IconReceiptChart(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2-2-2z" />
      <path d="M9 17v-3M12 17v-5M15 17v-2" strokeWidth={2.2} />
      <path d="M9 8h6" opacity="0.55" />
    </svg>
  );
}

/** Caja con cruz — Inventario médico */
export function IconBoxMedical(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.3 7L12 12l8.7-5M12 22V12" opacity="0.5" />
      <path d="M11 9.2v2M9.8 10.2h2.4" stroke="currentColor" strokeWidth={2.2} />
    </svg>
  );
}

/** Equipo médico — Multi-Profesional */
export function IconTeamMedical(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 21v-1.5A4.5 4.5 0 0 1 7 15h4a4.5 4.5 0 0 1 4.5 4.5V21" />
      <circle cx="17.5" cy="9.5" r="2.5" opacity="0.7" />
      <path d="M21.5 18v-.5A3.5 3.5 0 0 0 18 14" opacity="0.7" />
    </svg>
  );
}

/** Escudo con check pulse — Seguridad y Privacidad */
export function IconShieldCheck(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
      <path d="M9 12l2 2 4-4" strokeWidth={2.2} />
    </svg>
  );
}

/* ─── AGENT FEATURES — capacidades del agente IA ─── */

/** Lupa con paciente — busca/registra pacientes */
export function IconUserSearch(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <circle cx="10" cy="9" r="3.5" />
      <path d="M3.5 20v-1A4.5 4.5 0 0 1 8 14.5h4" />
      <circle cx="17.5" cy="17.5" r="3" />
      <path d="m22 22-2.5-2.5" strokeWidth={2.2} />
    </svg>
  );
}

/** Calendar con + grande — agenda turnos */
export function IconCalendarPlus(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <rect x="3" y="4" width="18" height="18" rx="2.5" />
      <path d="M8 2v4M16 2v4M3 10h18" />
      <path d="M16 17h-3M14.5 14.5v3" strokeWidth={2.3} />
      <path d="M7 14h3" opacity="0.55" />
    </svg>
  );
}

/** Bot chat — responde consultas */
export function IconBotChat(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M12 3v3" />
      <circle cx="9" cy="12" r="0.9" fill="currentColor" />
      <circle cx="15" cy="12" r="0.9" fill="currentColor" />
      <path d="M9.5 16h5" opacity="0.7" />
      <path d="M3 12h-1M22 12h-1" />
    </svg>
  );
}

/** Sliders — personalizable */
export function IconSliders(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M4 7h11" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M4 17h6" />
      <circle cx="13" cy="17" r="2.5" />
      <path d="M16 17h4" />
    </svg>
  );
}

/* ─── HOW IT WORKS ─── */

/** Sign-up con cruz */
export function IconSignup(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <circle cx="11" cy="8" r="3.5" />
      <path d="M3.5 20v-1A4.5 4.5 0 0 1 8 14.5h4a4.5 4.5 0 0 1 3.5 1.7" />
      <path d="M19 14v6M16 17h6" strokeWidth={2.2} />
    </svg>
  );
}

/** Tuerca con sliders — configurar */
export function IconTune(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" />
    </svg>
  );
}

/** Pulso ascendente — gestionar/crecer */
export function IconGrow(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M3 17l5-5 4 3 8-9" strokeWidth={2.2} />
      <path d="M14 6h6v6" />
    </svg>
  );
}

/* ─── INTEGRATIONS — marca específica ─── */

export function IconWhatsapp(props: IconProps) {
  return (
    <svg {...withDefaults(props)} fill="currentColor" stroke="none">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.86L.057 23.852a.5.5 0 0 0 .619.608l6.15-1.61A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.51-5.25-1.4l-.38-.22-3.91 1.02 1.04-3.8-.25-.39A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

export function IconMercadoPago(props: IconProps) {
  return (
    <svg {...withDefaults(props)} fill="currentColor" stroke="none" viewBox="0 0 30 20">
      <rect x="1" y="1" width="28" height="18" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="11" cy="10" r="5" opacity=".95" />
      <circle cx="19" cy="10" r="5" opacity=".55" />
    </svg>
  );
}

export function IconGoogle(props: IconProps) {
  return (
    <svg {...withDefaults(props)} stroke="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/* ─── UTILITY ─── */

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...withDefaults({ strokeWidth: 2.4, ...props })}>
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...withDefaults({ strokeWidth: 2.5, ...props })}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...withDefaults({ strokeWidth: 2.5, ...props })}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...withDefaults({ strokeWidth: 2, ...props })}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeWidth={2.2} />
    </svg>
  );
}

export function IconStar(props: IconProps) {
  return (
    <svg {...withDefaults(props)} fill="currentColor" stroke="none">
      <path d="M12 2.5l2.91 5.9 6.51.95-4.71 4.59 1.11 6.48L12 17.4l-5.83 3.06 1.11-6.48L2.57 9.35l6.51-.95L12 2.5z" />
    </svg>
  );
}

export function IconBuilding(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
      <path d="M2 20h20" />
      <path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01" />
    </svg>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" />
      <path d="M7 11h2l1.5-3 2 6 1.5-3h3" strokeWidth={2} opacity="0.7" />
    </svg>
  );
}

export function IconLeaf(props: IconProps) {
  return (
    <svg {...withDefaults(props)}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19.2 2.96c.3 1.5 1.3 7.2-2 11.04A7 7 0 0 1 11 20z" />
      <path d="M2 22c4-3 7-6 12-12" opacity="0.5" />
    </svg>
  );
}
