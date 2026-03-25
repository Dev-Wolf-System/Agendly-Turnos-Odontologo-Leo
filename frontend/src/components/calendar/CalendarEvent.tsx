"use client";

import type { Turno } from "@/services/turnos.service";
import { TRATAMIENTOS_LABELS, type TipoTratamiento } from "@/services/turnos.service";

const estadoStyles: Record<string, { bg: string; border: string; text: string; dot: string; hover: string }> = {
  pendiente: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-400 dark:border-amber-500",
    text: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-400",
    hover: "hover:bg-amber-100/80 dark:hover:bg-amber-950/60",
  },
  confirmado: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-400 dark:border-blue-500",
    text: "text-blue-800 dark:text-blue-200",
    dot: "bg-blue-400",
    hover: "hover:bg-blue-100/80 dark:hover:bg-blue-950/60",
  },
  completado: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-400 dark:border-emerald-500",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-400",
    hover: "hover:bg-emerald-100/80 dark:hover:bg-emerald-950/60",
  },
  cancelado: {
    bg: "bg-red-50/60 dark:bg-red-950/30",
    border: "border-red-300 dark:border-red-600",
    text: "text-red-500 dark:text-red-400",
    dot: "bg-red-400",
    hover: "hover:bg-red-100/60 dark:hover:bg-red-950/40",
  },
};

interface CalendarEventProps {
  turno: Turno;
  top: number;
  height: number;
  onClick: (turno: Turno) => void;
  columnCount?: number;
  columnIndex?: number;
}

export function CalendarEvent({
  turno,
  top,
  height,
  onClick,
  columnCount = 1,
  columnIndex = 0,
}: CalendarEventProps) {
  const style = estadoStyles[turno.estado] || estadoStyles.pendiente;
  const startTime = new Date(turno.start_time).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(turno.end_time).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const isCancelled = turno.estado === "cancelado";

  const widthPercent = 100 / columnCount;
  const leftPercent = columnIndex * widthPercent;
  const insetRight = columnCount > 1 ? 2 : 4;

  return (
    <button
      type="button"
      className={`absolute group rounded-lg border-l-[3px] ${style.border} ${style.bg} ${style.hover} px-2 py-1 text-left transition-all duration-150 hover:shadow-lg hover:scale-[1.02] cursor-pointer overflow-hidden`}
      style={{
        top: top + 1,
        height: Math.max(height - 2, 20),
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - ${insetRight}px)`,
        zIndex: 10 + columnIndex,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(turno);
      }}
    >
      <div className="flex items-start gap-1.5">
        <div className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot} ${!isCancelled ? "animate-pulse" : "opacity-50"}`} />
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold leading-tight truncate ${style.text} ${isCancelled ? "line-through opacity-60" : ""}`}>
            {turno.paciente
              ? `${turno.paciente.nombre} ${turno.paciente.apellido}`
              : "Sin paciente"}
          </p>
          {height >= 36 && (
            <p className={`text-[10px] leading-tight mt-0.5 ${style.text} opacity-70`}>
              {startTime} – {endTime}
            </p>
          )}
          {height >= 54 && turno.tipo_tratamiento && (
            <p className={`text-[10px] leading-tight mt-0.5 ${style.text} opacity-60 truncate`}>
              {TRATAMIENTOS_LABELS[turno.tipo_tratamiento as TipoTratamiento] || turno.tipo_tratamiento}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
