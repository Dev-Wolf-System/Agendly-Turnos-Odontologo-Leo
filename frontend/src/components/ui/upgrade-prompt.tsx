"use client";

import { useFeatureFlag } from "@/hooks/useFeatureFlags";

interface UpgradePromptProps {
  featureKey: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
}

const FEATURE_LABELS: Record<string, { title: string; description: string }> = {
  whatsapp_agent: {
    title: "Agente WhatsApp IA",
    description: "Automatizá la atención con un agente inteligente que gestiona turnos por WhatsApp.",
  },
  multi_consultorio: {
    title: "Multi-Consultorio",
    description: "Gestioná múltiples consultorios dentro de tu clínica con agendas independientes.",
  },
  advanced_reports: {
    title: "Reportes Avanzados",
    description: "Accedé a reportes detallados de rendimiento, facturación y ocupación.",
  },
  csv_export: {
    title: "Exportación CSV",
    description: "Exportá datos de pacientes, turnos y pagos en formato CSV.",
  },
  custom_branding: {
    title: "Branding Personalizado",
    description: "Personalizá la apariencia con tu logo y colores corporativos.",
  },
  api_access: {
    title: "Acceso API",
    description: "Integrá Avax Health con tus sistemas externos mediante nuestra API.",
  },
  audit_logs: {
    title: "Registro de Auditoría",
    description: "Seguimiento completo de todas las acciones realizadas en el sistema.",
  },
  priority_support: {
    title: "Soporte Prioritario",
    description: "Acceso a soporte técnico prioritario con tiempos de respuesta garantizados.",
  },
};

export function UpgradePrompt({
  featureKey,
  title,
  description,
  children,
}: UpgradePromptProps) {
  const { enabled, loading } = useFeatureFlag(featureKey);

  if (loading) return null;
  if (enabled) return <>{children}</>;

  const labels = FEATURE_LABELS[featureKey];
  const displayTitle = title ?? labels?.title ?? "Función Premium";
  const displayDesc =
    description ?? labels?.description ?? "Esta función no está incluida en tu plan actual.";

  return (
    <div className="relative rounded-2xl border border-dashed border-[#3a6a93] dark:border-[#1f3d5e] bg-[#eef3f8]/50 dark:bg-[#0e1f33]/20 p-6">
      {/* Locked overlay */}
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1b3553] to-[#5bbcad] text-white shadow-lg">
          <LockIcon className="h-6 w-6" />
        </div>

        <div>
          <h3 className="text-lg font-semibold">{displayTitle}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {displayDesc}
          </p>
        </div>

        <button
          onClick={() => {
            // TODO: abrir modal de upgrade o redirigir a página de planes
            window.alert("Contactá al administrador para actualizar tu plan.");
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1b3553] to-[#5bbcad] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1b3553]/25 hover:shadow-xl hover:shadow-[#1b3553]/30 transition-all duration-300 hover:-translate-y-0.5"
        >
          <CrownIcon className="h-4 w-4" />
          Mejorar Plan
        </button>
      </div>
    </div>
  );
}

export function FeatureGate({
  featureKey,
  fallback,
  children,
}: {
  featureKey: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { enabled, loading } = useFeatureFlag(featureKey);

  if (loading) return null;
  if (enabled) return <>{children}</>;
  return <>{fallback ?? null}</>;
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CrownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5.5 21h13" />
    </svg>
  );
}
