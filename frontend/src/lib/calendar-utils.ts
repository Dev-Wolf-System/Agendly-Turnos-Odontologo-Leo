export function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  // Monday = 0, Sunday = 6
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

export function formatWeekRange(days: Date[]): string {
  const first = days[0];
  const last = days[6];
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()} - ${last.toLocaleDateString("es-AR", opts)} ${last.getFullYear()}`;
  }
  return `${first.toLocaleDateString("es-AR", opts)} - ${last.toLocaleDateString("es-AR", opts)} ${last.getFullYear()}`;
}

export function formatDayHeader(date: Date): string {
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return `${dayNames[date.getDay()]} ${date.getDate()}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const HOUR_START = 7;
export const HOUR_END = 21;
export const SLOT_HEIGHT = 56; // px per hour

export function getHourLabels(): string[] {
  const labels: string[] = [];
  for (let h = HOUR_START; h <= HOUR_END; h++) {
    labels.push(`${String(h).padStart(2, "0")}:00`);
  }
  return labels;
}

export function getEventPosition(
  startTime: string,
  endTime: string,
): { top: number; height: number } {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const originMinutes = HOUR_START * 60;

  const top = ((startMinutes - originMinutes) / 60) * SLOT_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * SLOT_HEIGHT, 20);

  return { top, height };
}

export function getNowPosition(): number {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const originMinutes = HOUR_START * 60;
  return ((minutes - originMinutes) / 60) * SLOT_HEIGHT;
}

export function timeFromY(y: number, date: Date): Date {
  const totalMinutes = HOUR_START * 60 + (y / SLOT_HEIGHT) * 60;
  // Snap to 15 min intervals
  const snapped = Math.round(totalMinutes / 15) * 15;
  const hours = Math.floor(snapped / 60);
  const minutes = snapped % 60;
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}
