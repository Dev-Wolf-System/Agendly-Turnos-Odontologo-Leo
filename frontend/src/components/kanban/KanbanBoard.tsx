"use client";

import { useState, useMemo, useCallback } from "react";
import type { Turno, EstadoTurno } from "@/services/turnos.service";
import { KanbanCard } from "./KanbanCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  CalendarDays,
  Filter,
  Search,
  X,
} from "lucide-react";
import { ESTADO_TURNO_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const COLUMN_ORDER: EstadoTurno[] = [
  "pendiente",
  "confirmado",
  "completado",
  "cancelado",
  "perdido",
];

const COLUMN_ICONS: Record<EstadoTurno, string> = {
  pendiente: "bg-amber-500",
  confirmado: "bg-blue-500",
  completado: "bg-emerald-500",
  cancelado: "bg-red-500",
  perdido: "bg-orange-500",
};

interface KanbanBoardProps {
  turnos: Turno[];
  onEdit: (turno: Turno) => void;
  onPago: (turno: Turno) => void;
  onStatusChange: (turno: Turno) => void;
  onStatusUpdate: (turnoId: string, nuevoEstado: EstadoTurno) => Promise<void> | void;
  onDelete: (turno: Turno) => void;
  onReprogramar: (turno: Turno) => void;
  onConsentimiento: (turno: Turno) => void;
  onSlotClick: (start: Date, end: Date) => void;
}

export function KanbanBoard({
  turnos,
  onEdit,
  onPago,
  onStatusChange,
  onStatusUpdate,
  onDelete,
  onReprogramar,
  onConsentimiento,
  onSlotClick,
}: KanbanBoardProps) {
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroProfesional, setFiltroProfesional] = useState<string>("all");
  const [filtroTratamiento, setFiltroTratamiento] = useState<string>("all");

  // Drag state
  const [dragOverColumn, setDragOverColumn] = useState<EstadoTurno | null>(null);

  // Extraer profesionales y tratamientos únicos
  const profesionales = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string }>();
    turnos.forEach((t) => {
      if (t.user && !map.has(t.user.id)) {
        map.set(t.user.id, { id: t.user.id, nombre: `${t.user.nombre} ${t.user.apellido}` });
      }
    });
    return Array.from(map.values());
  }, [turnos]);

  const tratamientos = useMemo(() => {
    const set = new Set<string>();
    turnos.forEach((t) => {
      if (t.tipo_tratamiento) set.add(t.tipo_tratamiento);
    });
    return Array.from(set);
  }, [turnos]);

  // Filtrar turnos
  const filteredTurnos = useMemo(() => {
    return turnos.filter((t) => {
      // Búsqueda por nombre/paciente
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const pacienteMatch =
          t.paciente?.nombre?.toLowerCase().includes(search) ||
          t.paciente?.apellido?.toLowerCase().includes(search) ||
          t.paciente?.dni?.includes(search);
        const profMatch =
          t.user?.nombre?.toLowerCase().includes(search) ||
          t.user?.apellido?.toLowerCase().includes(search);
        if (!pacienteMatch && !profMatch) return false;
      }
      // Filtro por profesional
      if (filtroProfesional !== "all" && t.user_id !== filtroProfesional) {
        return false;
      }
      // Filtro por tratamiento
      if (filtroTratamiento !== "all" && t.tipo_tratamiento !== filtroTratamiento) {
        return false;
      }
      return true;
    });
  }, [turnos, searchTerm, filtroProfesional, filtroTratamiento]);

  // Agrupar por estado
  const turnosPorEstado = useMemo(() => {
    const map = new Map<EstadoTurno, Turno[]>();
    COLUMN_ORDER.forEach((estado) => map.set(estado, []));
    filteredTurnos.forEach((t) => {
      const list = map.get(t.estado);
      if (list) list.push(t);
    });
    // Ordenar por hora dentro de cada columna
    COLUMN_ORDER.forEach((estado) => {
      const list = map.get(estado);
      if (list) {
        list.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      }
    });
    return map;
  }, [filteredTurnos]);

  // Handlers de drag & drop
  const [draggedTurno, setDraggedTurno] = useState<Turno | null>(null);

  const handleDragStart = useCallback((turno: Turno) => {
    setDraggedTurno(turno);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, estado: EstadoTurno) => {
    e.preventDefault();
    setDragOverColumn(estado);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetEstado: EstadoTurno) => {
      e.preventDefault();
      if (draggedTurno && targetEstado && draggedTurno.estado !== targetEstado) {
        await onStatusUpdate(draggedTurno.id, targetEstado);
      }
      setDraggedTurno(null);
      setDragOverColumn(null);
    },
    [draggedTurno, onStatusUpdate]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedTurno(null);
    setDragOverColumn(null);
  }, []);

  // Crear turno desde header
  const handleNewTurno = () => {
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(Math.ceil(now.getMinutes() / 30) * 30);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);
    onSlotClick(start, end);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header con filtros y acciones */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          {/* Búsqueda */}
          <div className="flex flex-col gap-1.5 min-w-[200px]">
            <Label className="text-xs font-medium">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Paciente, profesional, DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filtro Profesional */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Profesional</Label>
            <Select
              value={filtroProfesional}
              onValueChange={(v: string | null) => v && setFiltroProfesional(v)}
            >
              <SelectTrigger className="h-9 w-[180px] text-sm">
                <span className="flex flex-1 text-left truncate text-sm">
                  {filtroProfesional === "all"
                    ? "Todos los profesionales"
                    : profesionales.find((p) => p.id === filtroProfesional)?.nombre || "Profesional"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los profesionales</SelectItem>
                {profesionales.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Tratamiento */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium">Tratamiento</Label>
            <Select
              value={filtroTratamiento}
              onValueChange={(v: string | null) => v && setFiltroTratamiento(v)}
            >
              <SelectTrigger className="h-9 w-[180px] text-sm">
                <span className="flex flex-1 text-left truncate text-sm">
                  {filtroTratamiento === "all" ? "Todos los tratamientos" : filtroTratamiento}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tratamientos</SelectItem>
                {tratamientos.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset filtros */}
          {(searchTerm || filtroProfesional !== "all" || filtroTratamiento !== "all") && (
            <div className="flex items-end pb-0.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFiltroProfesional("all");
                  setFiltroTratamiento("all");
                }}
                className="h-9 text-xs"
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Limpiar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Acción Nuevo Turno */}
        <Button
          onClick={handleNewTurno}
          className="h-9 gap-2 bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] hover:opacity-90 text-white shadow-[var(--shadow-primary)] hover:shadow-md transition-all"
        >
          <CalendarDays className="h-4 w-4" />
          Nuevo Turno
        </Button>
      </div>

      {/* Tablero Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {COLUMN_ORDER.map((estado) => {
          const columnTurnos = turnosPorEstado.get(estado) || [];
          const isOver = dragOverColumn === estado;

          return (
            <div
              key={estado}
              className={cn(
                "flex flex-col gap-3 rounded-xl border bg-muted/20 p-3 transition-colors",
                isOver && "bg-muted/40 ring-2 ring-[var(--ht-primary)]/30"
              )}
              onDragOver={(e) => handleDragOver(e, estado)}
              onDrop={(e) => handleDrop(e, estado)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2.5 w-2.5 rounded-full", COLUMN_ICONS[estado])} />
                  <h3 className="text-sm font-semibold text-foreground">
                    {ESTADO_TURNO_LABELS[estado]}
                  </h3>
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                    {columnTurnos.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2.5 min-h-[200px]">
                {columnTurnos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-xs">
                    <CalendarDays className="h-8 w-8 mb-2 opacity-20" />
                    <p className="font-medium">Sin turnos</p>
                  </div>
                ) : (
                  columnTurnos.map((turno) => (
                    <KanbanCard
                      key={turno.id}
                      turno={turno}
                      onClick={onEdit}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onEdit={onEdit}
                      onPago={onPago}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                      onReprogramar={onReprogramar}
                      onConsentimiento={onConsentimiento}
                      isDragging={draggedTurno?.id === turno.id}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
