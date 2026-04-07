"use client";

import { STATUS_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  label?: string;
  size?: "sm" | "default";
  className?: string;
  onClick?: () => void;
}

export function StatusBadge({
  status,
  label,
  size = "default",
  className,
  onClick,
}: StatusBadgeProps) {
  const colorClasses = STATUS_COLORS[status] ?? STATUS_COLORS.inactivo;
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        size === "sm"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-0.5 text-xs",
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        colorClasses,
        className,
      )}
    >
      {displayLabel}
    </span>
  );
}
