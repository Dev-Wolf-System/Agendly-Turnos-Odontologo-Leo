"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar, List, CalendarDays, CalendarRange } from "lucide-react";

const ListIcon = List;
const CalendarDayIcon = CalendarDays;
const CalendarWeekIcon = CalendarRange;

interface CalendarHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  viewMode: string;
  onViewChange: (view: string) => void;
}

export function CalendarHeader({
  label,
  onPrev,
  onNext,
  onToday,
  viewMode,
  onViewChange,
}: CalendarHeaderProps) {
  const views = [
    { key: "tabla", label: "Lista", icon: ListIcon },
    { key: "dia", label: "Día", icon: CalendarDayIcon },
    { key: "semana", label: "Semana", icon: CalendarWeekIcon },
  ];

  return (
    <header className="flex items-center justify-between px-3 sm:px-5 py-3 bg-gradient-to-r from-background to-muted/30 border-b border-border gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm sm:text-base font-semibold text-foreground tracking-tight truncate">
          {label}
        </h2>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={onNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs font-medium hidden sm:inline-flex"
          onClick={onToday}
        >
          Hoy
        </Button>
      </div>

      <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5 shrink-0">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => onViewChange(v.key)}
            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              viewMode === v.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <v.icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{v.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
}
