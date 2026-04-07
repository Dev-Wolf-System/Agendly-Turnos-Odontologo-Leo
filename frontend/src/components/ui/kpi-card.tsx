"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactNode } from "react";

type KpiVariant = "primary" | "accent" | "warm" | "danger";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  href?: string;
  variant?: KpiVariant;
  gradient?: string;
  className?: string;
}

const variantStyles: Record<KpiVariant, { icon: string; glow: string }> = {
  primary: {
    icon: "bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-primary-dark)] shadow-[var(--shadow-primary)]",
    glow: "bg-[var(--ht-primary)]",
  },
  accent: {
    icon: "bg-gradient-to-br from-[var(--ht-accent)] to-[var(--ht-accent-dark)] shadow-[var(--shadow-accent)]",
    glow: "bg-[var(--ht-accent)]",
  },
  warm: {
    icon: "bg-gradient-to-br from-[var(--ht-accent-warm)] to-[var(--ht-accent-warm-dark)] shadow-[0_4px_20px_rgba(245,158,11,0.25)]",
    glow: "bg-[var(--ht-accent-warm)]",
  },
  danger: {
    icon: "bg-gradient-to-br from-[var(--ht-danger)] to-[#DC2626] shadow-[0_4px_20px_rgba(239,68,68,0.25)]",
    glow: "bg-[var(--ht-danger)]",
  },
};

export function KpiCard({
  label,
  value,
  sub,
  icon,
  href,
  variant = "primary",
  gradient,
  className,
}: KpiCardProps) {
  const styles = variantStyles[variant];

  const content = (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--border-light)] bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Background glow decoration */}
      <div className={cn("absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-[0.06]", styles.glow)} />

      <div className="flex items-start justify-between relative">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
          <p className="text-3xl font-bold tracking-tight font-[family-name:var(--font-display)] text-[var(--text-primary)] tabular-nums">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-[var(--text-muted)]">{sub}</p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white",
            gradient ? `bg-gradient-to-br ${gradient}` : styles.icon,
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
