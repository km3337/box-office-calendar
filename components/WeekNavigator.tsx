"use client";

import {
  addWeeks,
  currentWeekOf,
  formatWeekRange,
  isCurrentWeek,
  midWeekDate,
  monthLabel,
  weekOfMonthYear,
  yearRange,
} from "@/lib/week";

type WeekNavigatorProps = {
  weekOf: Date;
  onWeekChange: (weekOf: Date) => void;
};

export function WeekNavigator({ weekOf, onWeekChange }: WeekNavigatorProps) {
  const anchor = midWeekDate(weekOf);
  const month = anchor.getMonth();
  const year = anchor.getFullYear();
  const isThisWeek = isCurrentWeek(weekOf);
  const years = yearRange(year);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Viewing week
          </p>
          <p className="mt-0.5 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {formatWeekRange(weekOf)}
          </p>
          {isThisWeek && (
            <span className="mt-1.5 inline-block rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white dark:bg-zinc-100 dark:text-zinc-900">
              This week
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onWeekChange(currentWeekOf())}
          disabled={isThisWeek}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-default disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Today
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onWeekChange(addWeeks(weekOf, -1))}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Previous week"
        >
          ← Prev
        </button>
        <button
          type="button"
          onClick={() => onWeekChange(addWeeks(weekOf, 1))}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          aria-label="Next week"
        >
          Next →
        </button>

        <label className="sr-only" htmlFor="week-month">
          Month
        </label>
        <select
          id="week-month"
          value={month}
          onChange={(event) =>
            onWeekChange(weekOfMonthYear(year, Number(event.target.value)))
          }
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          {Array.from({ length: 12 }, (_, index) => (
            <option key={index} value={index}>
              {monthLabel(index)}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="week-year">
          Year
        </label>
        <select
          id="week-year"
          value={year}
          onChange={(event) =>
            onWeekChange(weekOfMonthYear(Number(event.target.value), month))
          }
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
