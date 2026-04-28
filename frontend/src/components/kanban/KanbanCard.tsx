"use client";

import type { Turno } from "@/services/turnos.service";
import { TRATAMIENTOS_LABELS } from "@/services/turnos.service";
import { cn } from "@/lib/utils";
import {
  Clock,
  User,
  MoreVertical,
  Edit,
  DollarSign,
  Trash2,
  FileText,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const estadoStyles: Record<string, { bg: string; border: string; text: string; dot: string; ring: string }> = {
  pendiente: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-700",
    text: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
    ring: "ring-amber-400/30",
  },
  confirmado: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-700",
    text: "text-blue-800 dark:text-blue-200",
    dot: "bg-blue-500",
    ring: "ring-blue-400/30",
  },
  completado: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-700",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
    ring: "ring-emerald-400/30",
  },
  cancelado: {
    bg: "bg-red-50/60 dark:bg-red-950/20",
    border: "border-red-200 dark:border-red-700",
    text: "text-red-600 dark:text-red-300",
    dot: "bg-red-500",
    ring: "ring-red-400/20",
  },
  perdido: {
    bg: "bg-orange-50/60 dark:bg-orange-950/20",
    border: "border-orange-200 dark:border-orange-700",
    text: "text-orange-600 dark:text-orange-300",
    dot: "bg-orange-500",
    ring: "ring-orange-400/20",
  },
};

interface KanbanCardProps {
  turno: Turno;
  onClick: (turno: Turno) => void;
  onEdit: (turno: Turno) => void;
  onPago: (turno: Turno) => void;
  onStatusChange: (turno: Turno) => void;
  onDelete: (turno: Turno) => void;
  onReprogramar: (turno: Turno) => void;
  onConsentimiento: (turno: Turno) => void;
  isDragging?: boolean;
  onDragStart?: (turno: Turno) => void;
  onDragEnd?: () => void;
}

export function KanbanCard({
  turno,
  onClick,
  onEdit,
  onPago,
  onStatusChange,
  onDelete,
  onReprogramar,
  onConsentimiento,
  isDragging = false,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  const style = estadoStyles[turno.estado] || estadoStyles.pendiente;
  const isCancelled = turno.estado === "cancelado";
  const isLost = turno.estado === "perdido";
  const isReprogramable = isLost && !turno.fue_reprogramado;
  const canCharge = !["cancelado", "perdido"].includes(turno.estado);

  const timeLabel = new Date(turno.start_time).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endTime = new Date(turno.end_time).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const tratamientoLabel = turno.tipo_tratamiento
    ? TRATAMIENTOS_LABELS[turno.tipo_tratamiento] || turno.tipo_tratamiento
    : null;

  const sourceBadge =
    turno.source === "whatsapp" ? (
      <Badge variant="outline" className="text-[10px] h-5">
        WhatsApp
      </Badge>
    ) : turno.source === "dashboard" ? (
      <Badge variant="secondary" className="text-[10px] h-5">
        Dashboard
      </Badge>
    ) : null;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("turnoId", turno.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(turno);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={cn(
        "group relative cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50"
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
          style.bg,
          style.border,
          "hover:ring-2",
          style.ring
        )}
        onClick={() => onClick(turno)}
      >
        {/* Glow effect en hover */}
        <div
          className={cn(
            "absolute -top-10 -right-10 h-20 w-20 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-10",
            style.dot
          )}
        />

        {/* Header: Hora + Menu */}
        <div className="flex items-start justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <div className={cn("h-2 w-2 rounded-full animate-pulse", style.dot)} />
            <span className={cn("text-xs font-semibold tabular-nums", style.text)}>
              {timeLabel} - {endTime}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex h-6 w-6 items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ht-primary)]/30"
              onClick={(e) => e.stopPropagation()}
              aria-label="Acciones"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onEdit(turno)}>
                <Edit className="h-3.5 w-3.5 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange(turno)}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Cambiar estado
              </DropdownMenuItem>
              {canCharge && (
                <DropdownMenuItem onClick={() => onPago(turno)}>
                  <DollarSign className="h-3.5 w-3.5 mr-2" />
                  Registrar pago
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onConsentimiento(turno)}>
                {turno.consentimiento_aceptado ? (
                  <>
                    <ShieldCheck className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                    Ver consentimiento
                  </>
                ) : (
                  <>
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Enviar consentimiento
                  </>
                )}
              </DropdownMenuItem>
              {isReprogramable && (
                <DropdownMenuItem onClick={() => onReprogramar(turno)}>
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Reprogramar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => onDelete(turno)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Paciente */}
        <div className="mb-2">
          <p className={cn("text-sm font-semibold truncate", isCancelled || isLost ? "line-through opacity-60" : "text-foreground")}>
            {turno.paciente
              ? `${turno.paciente.nombre} ${turno.paciente.apellido}`
              : "Sin paciente"}
          </p>
          {turno.paciente?.dni && (
            <p className="text-xs text-muted-foreground mt-0.5">
              DNI: {turno.paciente.dni}
            </p>
          )}
        </div>

        {/* Profesional */}
        {turno.user && (
          <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {turno.user.nombre} {turno.user.apellido}
            </span>
          </div>
        )}

        {/* Tratamiento */}
        {tratamientoLabel && (
          <div className="mb-2.5">
            <Badge variant="outline" className="text-[10px] h-auto py-0.5 px-1.5 font-normal">
              {tratamientoLabel}
            </Badge>
          </div>
        )}

        {/* Footer: Obra social + source */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 min-w-0">
            <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground truncate">
              {new Date(turno.start_time).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
          {sourceBadge}
        </div>

        {/* Indicador de consentimiento firmado */}
        {turno.consentimiento_aceptado && (
          <div className="absolute top-2 right-8">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          </div>
        )}
      </div>
    </div>
  );
}
