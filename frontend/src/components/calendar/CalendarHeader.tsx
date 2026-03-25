"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

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
    { key: "dia", label: "Día" },
    { key: "semana", label: "Semana" },
    { key: "tabla", label: "Tabla" },
  ];

  return (
    <header className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-background to-muted/30 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-base font-semibold text-foreground tracking-tight">
          {label}
        </h2>
        <div className="flex items-center gap-0.5 ml-1">
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
          className="h-8 text-xs font-medium"
          onClick={onToday}
        >
          Hoy
        </Button>
      </div>

      <div className="hidden md:flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => onViewChange(v.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
              viewMode === v.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>
    </header>
  );
}
