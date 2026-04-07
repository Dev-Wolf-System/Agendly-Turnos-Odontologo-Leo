/* ═══════════════════════════════════════════════════════════════
   Design System — Constantes centralizadas
   ═══════════════════════════════════════════════════════════════ */

/**
 * Mapeo de estados a clases Tailwind usando tokens semánticos.
 * Cubre turnos, pagos y cualquier entidad con estado.
 */
export const STATUS_COLORS: Record<string, string> = {
  // Turnos
  completado: "bg-status-success-bg text-status-success-fg border border-[var(--success-border)]",
  confirmado: "bg-status-info-bg text-status-info-fg border border-[var(--info-border)]",
  pendiente: "bg-status-warning-bg text-status-warning-fg border border-[var(--warning-border)]",
  cancelado: "bg-status-error-bg text-status-error-fg border border-[var(--danger-border)]",
  perdido: "bg-status-warning-bg text-status-warning-fg border border-[var(--warning-border)]",
  // Pagos
  aprobado: "bg-status-success-bg text-status-success-fg border border-[var(--success-border)]",
  rechazado: "bg-status-error-bg text-status-error-fg border border-[var(--danger-border)]",
  // Genéricos
  activo: "bg-status-success-bg text-status-success-fg border border-[var(--success-border)]",
  inactivo: "bg-status-neutral-bg text-status-neutral-fg border border-[var(--border-light)]",
  abierto: "bg-status-info-bg text-status-info-fg border border-[var(--info-border)]",
  cerrado: "bg-status-neutral-bg text-status-neutral-fg border border-[var(--border-light)]",
  resuelto: "bg-status-success-bg text-status-success-fg border border-[var(--success-border)]",
  en_progreso: "bg-status-info-bg text-status-info-fg border border-[var(--info-border)]",
};

/**
 * Labels en español para estados de turnos.
 */
export const ESTADO_TURNO_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  completado: "Completado",
  cancelado: "Cancelado",
  perdido: "Perdido",
};

/**
 * Colores para gráficos Recharts (hex para compatibilidad directa).
 */
export const CHART_COLORS = {
  primary: "#0EA5E9",
  accent: "#10B981",
  success: "#10B981",
  info: "#0EA5E9",
  warning: "#F59E0B",
  error: "#EF4444",
  muted: "#94A3B8",
  /** Paleta ordenada para PieCharts / BarCharts */
  palette: ["#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#94A3B8"],
};

/**
 * Estilo compartido para tooltips de Recharts.
 */
export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  borderRadius: "10px",
  border: "none",
  background: "#0F172A",
  color: "#F8FAFC",
  fontSize: "13px",
  boxShadow: "var(--shadow-xl)",
  padding: "8px 12px",
};

/**
 * Meses abreviados en español (clave = "01"-"12").
 */
export const MONTH_LABELS: Record<string, string> = {
  "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic",
};
