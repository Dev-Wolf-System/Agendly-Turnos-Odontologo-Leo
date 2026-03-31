/**
 * Feature keys estándar del sistema Avax Health.
 * Usar estas constantes en @RequireFeature() y en la configuración de planes.
 */
export const FEATURES = {
  WHATSAPP_AGENT: 'whatsapp_agent',
  WHATSAPP_REMINDERS: 'whatsapp_reminders',
  MULTI_CONSULTORIO: 'multi_consultorio',
  ADVANCED_REPORTS: 'advanced_reports',
  CSV_EXPORT: 'csv_export',
  CUSTOM_BRANDING: 'custom_branding',
  API_ACCESS: 'api_access',
  AUDIT_LOGS: 'audit_logs',
  PRIORITY_SUPPORT: 'priority_support',
  INVENTARIO: 'inventario',
  PAGOS: 'pagos',
  PROVEEDORES: 'proveedores',
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * Estructura de los 4 planes Avax Health con sus features.
 * Referencia para seed/migración de datos.
 *
 * Avax Consultorio Standard:
 *   - Básico: turnos, pacientes, historial
 *   - inventario, pagos, proveedores
 *   - whatsapp_reminders, csv_export
 *   - max_usuarios: 3, max_pacientes: 500
 *
 * Avax Consultorio Plus IA:
 *   - Todo lo de Standard +
 *   - whatsapp_agent, advanced_reports, custom_branding, audit_logs
 *   - max_usuarios: 5, max_pacientes: 2000
 *
 * Avax Clinica Standard:
 *   - Todo lo de Consultorio Plus IA +
 *   - multi_consultorio, api_access
 *   - max_usuarios: 15, max_pacientes: null (ilimitado)
 *
 * Avax Clinica Plus IA:
 *   - Todas las features habilitadas +
 *   - priority_support
 *   - max_usuarios: 50, max_pacientes: null (ilimitado)
 */
export const PLAN_TEMPLATES = {
  CONSULTORIO_STANDARD: {
    nombre: 'Avax Consultorio Standard',
    precio_mensual: 4990,
    max_usuarios: 3,
    max_pacientes: 500,
    features: {
      whatsapp_agent: false,
      whatsapp_reminders: true,
      multi_consultorio: false,
      advanced_reports: false,
      csv_export: true,
      custom_branding: false,
      api_access: false,
      audit_logs: false,
      priority_support: false,
      inventario: true,
      pagos: true,
      proveedores: true,
    },
  },
  CONSULTORIO_PLUS_IA: {
    nombre: 'Avax Consultorio Plus IA',
    precio_mensual: 9990,
    max_usuarios: 5,
    max_pacientes: 2000,
    features: {
      whatsapp_agent: true,
      whatsapp_reminders: true,
      multi_consultorio: false,
      advanced_reports: true,
      csv_export: true,
      custom_branding: true,
      api_access: false,
      audit_logs: true,
      priority_support: false,
      inventario: true,
      pagos: true,
      proveedores: true,
    },
  },
  CLINICA_STANDARD: {
    nombre: 'Avax Clinica Standard',
    precio_mensual: 19990,
    max_usuarios: 15,
    max_pacientes: null,
    features: {
      whatsapp_agent: true,
      whatsapp_reminders: true,
      multi_consultorio: true,
      advanced_reports: true,
      csv_export: true,
      custom_branding: true,
      api_access: true,
      audit_logs: true,
      priority_support: false,
      inventario: true,
      pagos: true,
      proveedores: true,
    },
  },
  CLINICA_PLUS_IA: {
    nombre: 'Avax Clinica Plus IA',
    precio_mensual: 34990,
    max_usuarios: 50,
    max_pacientes: null,
    features: {
      whatsapp_agent: true,
      whatsapp_reminders: true,
      multi_consultorio: true,
      advanced_reports: true,
      csv_export: true,
      custom_branding: true,
      api_access: true,
      audit_logs: true,
      priority_support: true,
      inventario: true,
      pagos: true,
      proveedores: true,
    },
  },
};
