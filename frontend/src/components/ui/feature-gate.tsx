"use client";

import { Lock, Zap } from "lucide-react";
import Link from "next/link";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";

interface FeatureGateProps {
  /** Feature key del backend (ej: 'whatsapp_agent') */
  feature: string;
  /** Nombre legible del plan mínimo requerido */
  planRequired?: string;
  children: React.ReactNode;
  /**
   * overlay: muestra children difuminados con overlay de lock encima (default)
   * replace: reemplaza completamente el contenido con la card de upgrade
   * hide: oculta silenciosamente (para items de menú)
   */
  mode?: "overlay" | "replace" | "hide";
  /** Descripción corta de qué hace la función bloqueada */
  description?: string;
}

function UpgradeCard({
  planRequired,
  description,
}: {
  planRequired?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--muted)]/40 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--ht-primary)]/10">
        <Lock className="h-6 w-6 text-[var(--ht-primary)]" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Función no disponible en tu plan
        </p>
        {description && (
          <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
            {description}
          </p>
        )}
        {planRequired && (
          <p className="text-xs text-[var(--text-muted)]">
            Disponible en:{" "}
            <span className="font-semibold text-[var(--ht-primary)]">
              {planRequired}
            </span>{" "}
            o superior
          </p>
        )}
      </div>
      <Link
        href="/dashboard/suscripcion"
        className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-2 text-xs font-semibold text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-90"
      >
        <Zap className="h-3.5 w-3.5" />
        Ver planes disponibles
      </Link>
    </div>
  );
}

function OverlayLock({
  planRequired,
  children,
}: {
  planRequired?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-xl">
      {/* Contenido real difuminado */}
      <div
        className="pointer-events-none select-none blur-[2px] opacity-40"
        aria-hidden="true"
      >
        {children}
      </div>
      {/* Overlay de bloqueo */}
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--card)]/60 backdrop-blur-[1px]">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--card)] px-6 py-5 text-center shadow-[var(--shadow-md)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--ht-primary)]/10">
            <Lock className="h-5 w-5 text-[var(--ht-primary)]" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Función bloqueada
            </p>
            {planRequired && (
              <p className="text-xs text-[var(--text-muted)]">
                Requiere{" "}
                <span className="font-medium text-[var(--ht-primary)]">
                  {planRequired}
                </span>
              </p>
            )}
          </div>
          <Link
            href="/dashboard/suscripcion"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-primary)] transition-all hover:opacity-90"
          >
            <Zap className="h-3 w-3" />
            Mejorar plan
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * FeatureGate — envuelve contenido que requiere una feature específica del plan.
 *
 * Uso:
 * ```tsx
 * <FeatureGate feature="whatsapp_agent" planRequired="Avax Consultorio Plus IA">
 *   <ConfiguracionAgente />
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  planRequired,
  children,
  mode = "overlay",
  description,
}: FeatureGateProps) {
  const { isEnabled, loading } = useFeatureFlags();

  // Mientras carga features, renderiza normalmente para evitar parpadeo
  if (loading) {
    return <>{children}</>;
  }

  // Si la feature está habilitada, render normal
  if (isEnabled(feature)) {
    return <>{children}</>;
  }

  // Feature bloqueada — aplicar modo correspondiente
  if (mode === "hide") {
    return null;
  }

  if (mode === "replace") {
    return <UpgradeCard planRequired={planRequired} description={description} />;
  }

  // mode === "overlay" (default)
  return (
    <OverlayLock planRequired={planRequired}>{children}</OverlayLock>
  );
}
