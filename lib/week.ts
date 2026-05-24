/** Local calendar date as YYYY-MM-DD (avoids UTC drift from toISOString). */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse YYYY-MM-DD as local midnight — never use `new Date(isoDate)` (UTC). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeekSunday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function endOfWeekSaturday(weekOf: Date): Date {
  const end = startOfWeekSunday(weekOf);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Sun–Sat ISO date keys for the week containing `weekOf`. */
export function weekDateKeys(weekOf: Date): string[] {
  const start = startOfWeekSunday(weekOf);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return toDateKey(day);
  });
}

export function addWeeks(weekOf: Date, weeks: number): Date {
  const d = startOfWeekSunday(weekOf);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

/** Wednesday of the week — stable for month/year UI when the week crosses a boundary. */
export function midWeekDate(weekOf: Date): Date {
  const d = startOfWeekSunday(weekOf);
  d.setDate(d.getDate() + 3);
  return d;
}

export function weekOfMonthYear(year: number, month: number): Date {
  return startOfWeekSunday(new Date(year, month, 1));
}

export function formatWeekRange(weekOf: Date): string {
  const start = startOfWeekSunday(weekOf);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: start.getFullYear() !== end.getFullYear() ? "numeric" : undefined,
  });
  const startStr = fmt.format(start);
  const endFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr} – ${endFmt.format(end)}`;
}

export function isCurrentWeek(weekOf: Date, today: Date = new Date()): boolean {
  return (
    toDateKey(startOfWeekSunday(weekOf)) ===
    toDateKey(startOfWeekSunday(today))
  );
}

/** Entire week ended before today. */
export function isPastWeek(weekOf: Date, today: Date = new Date()): boolean {
  return endOfWeekSaturday(weekOf) < startOfDay(today);
}

export function currentWeekOf(): Date {
  return startOfWeekSunday(new Date());
}

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function monthLabel(month: number): string {
  return MONTH_LABELS[month] ?? "";
}

export function yearRange(
  centerYear: number,
  past = 10,
  future = 3,
): number[] {
  const years: number[] = [];
  for (let y = centerYear - past; y <= centerYear + future; y++) {
    years.push(y);
  }
  return years;
}
