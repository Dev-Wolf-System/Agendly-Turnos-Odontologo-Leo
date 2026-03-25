"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import type { Turno } from "@/services/turnos.service";
import { CalendarEvent } from "./CalendarEvent";
import { CalendarHeader } from "./CalendarHeader";
import {
  getWeekDays,
  formatWeekRange,
  isToday,
  toDateString,
  getHourLabels,
  getEventPosition,
  getNowPosition,
  timeFromY,
  SLOT_HEIGHT,
  HOUR_START,
  HOUR_END,
} from "@/lib/calendar-utils";

interface WeekCalendarProps {
  turnos: Turno[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onSlotClick: (start: Date, end: Date) => void;
  onEventClick: (turno: Turno) => void;
  onViewChange: (view: string) => void;
}

function layoutOverlapping(
  events: { turno: Turno; top: number; height: number }[],
) {
  if (events.length === 0) return [];
  const sorted = [...events].sort((a, b) => a.top - b.top);
  const groups: (typeof sorted)[] = [];
  let currentGroup: typeof sorted = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const ev = sorted[i];
    const groupEnd = Math.max(...currentGroup.map((e) => e.top + e.height));
    if (ev.top < groupEnd) {
      currentGroup.push(ev);
    } else {
      groups.push(currentGroup);
      currentGroup = [ev];
    }
  }
  groups.push(currentGroup);

  const result: {
    turno: Turno;
    top: number;
    height: number;
    colIndex: number;
    colCount: number;
  }[] = [];

  for (const group of groups) {
    const cols: number[] = [];
    for (const ev of group) {
      let col = 0;
      while (cols[col] !== undefined && ev.top < cols[col]) col++;
      cols[col] = ev.top + ev.height;
      result.push({ ...ev, colIndex: col, colCount: 0 });
    }
    const colCount = cols.length;
    for (
      let i = result.length - group.length;
      i < result.length;
      i++
    ) {
      result[i].colCount = colCount;
    }
  }

  return result;
}

export function WeekCalendar({
  turnos,
  currentDate,
  onDateChange,
  onSlotClick,
  onEventClick,
  onViewChange,
}: WeekCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [nowPos, setNowPos] = useState(getNowPosition());
  const days = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const hourLabels = useMemo(() => getHourLabels(), []);
  const totalHeight = (HOUR_END - HOUR_START + 1) * SLOT_HEIGHT;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (8 - HOUR_START) * SLOT_HEIGHT - 20;
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setNowPos(getNowPosition()), 60000);
    return () => clearInterval(interval);
  }, []);

  const turnosByDay = useMemo(() => {
    const map = new Map<string, Turno[]>();
    for (const day of days) map.set(toDateString(day), []);
    for (const turno of turnos) {
      const key = toDateString(new Date(turno.start_time));
      map.get(key)?.push(turno);
    }
    return map;
  }, [turnos, days]);

  const goPrev = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    onDateChange(d);
  }, [currentDate, onDateChange]);

  const goNext = useCallback(() => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    onDateChange(d);
  }, [currentDate, onDateChange]);

  const goToday = useCallback(() => onDateChange(new Date()), [onDateChange]);

  const handleColumnClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, day: Date) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top + (scrollRef.current?.scrollTop || 0);
      const start = timeFromY(y, day);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      onSlotClick(start, end);
    },
    [onSlotClick],
  );

  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
    <div className="flex flex-col rounded-xl border border-border bg-background shadow-sm overflow-hidden">
      {/* Calendar Header */}
      <CalendarHeader
        label={formatWeekRange(days)}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        viewMode="semana"
        onViewChange={onViewChange}
      />

      {/* Day Headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-muted/30">
        <div className="border-r border-border" />
        {days.map((day, i) => {
          const today = isToday(day);
          const key = toDateString(day);
          const dayCount = turnosByDay.get(key)?.length || 0;
          return (
            <div
              key={day.toISOString()}
              className={`flex flex-col items-center py-2.5 ${
                i < 6 ? "border-r border-border" : ""
              } ${today ? "bg-primary/5" : ""}`}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  today
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {dayNames[i]}
              </span>
              <span
                className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  today
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                {day.getDate()}
              </span>
              {dayCount > 0 && (
                <span className={`mt-1 text-[10px] font-medium ${today ? "text-primary" : "text-muted-foreground"}`}>
                  {dayCount} turno{dayCount !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 400px)" }}
      >
        <div
          className="relative"
          style={{ height: totalHeight }}
        >
          {/* Horizontal grid lines */}
          {hourLabels.map((_, i) => (
            <div
              key={`line-${i}`}
              className="absolute left-0 right-0 border-t border-border/60 pointer-events-none"
              style={{ top: i * SLOT_HEIGHT }}
            />
          ))}
          {hourLabels.map((_, i) => (
            <div
              key={`half-${i}`}
              className="absolute left-0 right-0 border-t border-border/25 pointer-events-none"
              style={{ top: i * SLOT_HEIGHT + SLOT_HEIGHT / 2 }}
            />
          ))}

          {/* Grid overlay with columns */}
          <div className="absolute inset-0 grid grid-cols-[56px_repeat(7,1fr)]">
            {/* Time labels column */}
            <div className="relative border-r border-border bg-muted/20">
              {hourLabels.map((label, i) => (
                <div
                  key={label}
                  className="absolute w-full"
                  style={{ top: i * SLOT_HEIGHT }}
                >
                  <span className="absolute -top-2.5 right-2 text-[11px] tabular-nums font-medium text-muted-foreground/70">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, dayIndex) => {
              const key = toDateString(day);
              const dayTurnos = turnosByDay.get(key) || [];
              const events = dayTurnos.map((turno) => ({
                turno,
                ...getEventPosition(turno.start_time, turno.end_time),
              }));
              const laidOut = layoutOverlapping(events);
              const today = isToday(day);

              return (
                <div
                  key={key}
                  className={`relative ${
                    dayIndex < 6
                      ? "border-r border-border/40"
                      : ""
                  } ${today ? "bg-primary/[0.03]" : "hover:bg-muted/20"} transition-colors`}
                  onClick={(e) => handleColumnClick(e, day)}
                >
                  {/* Events */}
                  {laidOut.map((ev) => (
                    <CalendarEvent
                      key={ev.turno.id}
                      turno={ev.turno}
                      top={ev.top}
                      height={ev.height}
                      onClick={onEventClick}
                      columnCount={ev.colCount}
                      columnIndex={ev.colIndex}
                    />
                  ))}

                  {/* Current time indicator */}
                  {today && nowPos > 0 && nowPos < totalHeight && (
                    <div
                      className="absolute inset-x-0 z-30 pointer-events-none"
                      style={{ top: nowPos }}
                    >
                      <div className="relative">
                        <div className="absolute -left-[5px] -top-[5px] h-[11px] w-[11px] rounded-full bg-red-500 shadow-md shadow-red-500/30" />
                        <div className="h-[2px] bg-red-500 shadow-sm shadow-red-500/20" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
