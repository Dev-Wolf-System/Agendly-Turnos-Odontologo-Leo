"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";

type KpiVariant = "primary" | "accent" | "warm" | "danger";

type TrendDirection = "up" | "down" | "flat";

interface KpiTrend {
  value: string;
  direction: TrendDirection;
  /** Si el incremento es positivo visualmente (por defecto: up=good, down=bad). Poner `false` para invertir, ej. tiempo de espera. */
  positive?: boolean;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  href?: string;
  variant?: KpiVariant;
  gradient?: string;
  className?: string;
  trend?: KpiTrend;
  /** Valor 0-100 para mostrar una barra de progreso contextual */
  progress?: number;
}

const variantStyles: Record<KpiVariant, { icon: string; glow: string; progress: string }> = {
  primary: {
    icon: "bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-primary-dark)] shadow-[var(--shadow-primary)]",
    glow: "bg-[var(--ht-primary)]",
    progress: "bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-primary-light)]",
  },
  accent: {
    icon: "bg-gradient-to-br from-[var(--ht-accent)] to-[var(--ht-accent-dark)] shadow-[var(--shadow-accent)]",
    glow: "bg-[var(--ht-accent)]",
    progress: "bg-gradient-to-r from-[var(--ht-accent)] to-[var(--ht-accent-dark)]",
  },
  warm: {
    icon: "bg-gradient-to-br from-[var(--ht-accent-warm)] to-[var(--ht-accent-warm-dark)] shadow-[0_4px_20px_rgba(245,158,11,0.25)]",
    glow: "bg-[var(--ht-accent-warm)]",
    progress: "bg-gradient-to-r from-[var(--ht-accent-warm)] to-[var(--ht-accent-warm-dark)]",
  },
  danger: {
    icon: "bg-gradient-to-br from-[var(--ht-danger)] to-[#DC2626] shadow-[0_4px_20px_rgba(239,68,68,0.25)]",
    glow: "bg-[var(--ht-danger)]",
    progress: "bg-gradient-to-r from-[var(--ht-danger)] to-[#DC2626]",
  },
};

function TrendBadge({ trend }: { trend: KpiTrend }) {
  const isPositive =
    trend.positive !== undefined
      ? trend.positive
      : trend.direction === "up"
        ? true
        : trend.direction === "down"
          ? false
          : null;

  const tone =
    isPositive === true
      ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]"
      : isPositive === false
        ? "bg-[var(--status-error-bg)] text-[var(--status-error-fg)]"
        : "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]";

  const Icon =
    trend.direction === "up" ? ArrowUpRight : trend.direction === "down" ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
        tone,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {trend.value}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon,
  href,
  variant = "primary",
  gradient,
  className,
  trend,
  progress,
}: KpiCardProps) {
  const styles = variantStyles[variant];
  const pct = progress !== undefined ? Math.max(0, Math.min(100, progress)) : null;

  const content = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-[var(--border-light)] bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/40",
        className,
      )}
    >
      {/* Background glow decoration */}
      <div
        className={cn(
          "pointer-events-none absolute -top-4 -right-4 h-24 w-24 rounded-full opacity-[0.06] transition-opacity duration-200 group-hover:opacity-[0.10]",
          styles.glow,
        )}
        aria-hidden="true"
      />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
            {trend && <TrendBadge trend={trend} />}
          </div>
          <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)] text-[var(--text-primary)] tabular-nums">
            {value}
          </p>
          {sub && <p className="text-xs text-[var(--text-muted)]">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white",
            gradient ? `bg-gradient-to-br ${gradient}` : styles.icon,
          )}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      {pct !== null && (
        <div className="relative mt-4">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${label}: ${pct}%`}
          >
            <div
              className={cn("h-full rounded-full transition-[width] duration-500 ease-out", styles.progress)}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none">
        {content}
      </Link>
    );
  }

  return content;
}
