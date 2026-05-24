"use client";

import { useMemo } from "react";
import {
  CROWDED_WIDE_MIN,
  computeUpcomingOutlook,
  formatCurrency,
  formatOutlookDay,
} from "@/lib/upcomingOutlook";
import { formatWeekRange } from "@/lib/week";
import type { FutureDay } from "@/types/movie";

export type UpcomingOutlookProps = {
  weekOf: Date;
  futureWeek: FutureDay[];
  loading?: boolean;
};

function OutlookCard({
  label,
  title,
  subtitle,
  value,
}: {
  label: string;
  title: string;
  subtitle?: string;
  value: string;
}) {
  return (
    <article className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 line-clamp-2 text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
        {title}
      </p>
      {subtitle && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
      )}
      <p className="mt-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {value}
      </p>
    </article>
  );
}

function OutlookLoadingSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      aria-hidden
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-5"
        >
          <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-6 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-4 h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export function UpcomingOutlook({
  weekOf,
  futureWeek,
  loading = false,
}: UpcomingOutlookProps) {
  const outlook = useMemo(
    () => computeUpcomingOutlook(futureWeek),
    [futureWeek],
  );

  const hasReleases = outlook.totalReleases > 0;

  return (
    <section
      className="w-full"
      aria-label="Upcoming week outlook"
      aria-busy={loading}
    >
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Week outlook
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatWeekRange(weekOf)} · Schedule-based insights, not box office
          forecasts
        </p>
      </header>

      {loading ? (
        <div role="status">
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Loading week outlook…
          </p>
          <OutlookLoadingSkeleton />
        </div>
      ) : !hasReleases ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No scheduled releases for this week.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <OutlookCard
            label="Busiest release day"
            title={
              outlook.busiestDay
                ? formatOutlookDay(outlook.busiestDay.dateKey)
                : "—"
            }
            value={
              outlook.busiestDay
                ? `${outlook.busiestDay.count} ${
                    outlook.busiestDay.count === 1 ? "release" : "releases"
                  }`
                : "—"
            }
          />
          <OutlookCard
            label="Release mix"
            title={`${outlook.newCount} new · ${outlook.returningCount} returning`}
            subtitle={
              outlook.wideCount > 0 || outlook.limitedCount > 0
                ? `${outlook.wideCount} wide · ${outlook.limitedCount} limited/platform`
                : undefined
            }
            value={`${outlook.totalReleases} total this week`}
          />
          <OutlookCard
            label="Top holdover"
            title={outlook.topHoldover?.title ?? "—"}
            subtitle={outlook.topHoldover?.releaseType}
            value={
              outlook.topHoldover
                ? `${formatCurrency(outlook.topHoldover.boxOfficeToDate)} to date`
                : "No returning titles"
            }
          />
          <OutlookCard
            label="Competition watch"
            title={
              outlook.crowdedDay
                ? formatOutlookDay(outlook.crowdedDay.dateKey)
                : "No crowded days"
            }
            subtitle={
              outlook.crowdedDay
                ? `${outlook.crowdedDay.wideCount} wide releases`
                : undefined
            }
            value={
              outlook.crowdedDay
                ? `High saturation (≥${CROWDED_WIDE_MIN} wide)`
                : "Under threshold for crowding"
            }
          />
        </div>
      )}
    </section>
  );
}
