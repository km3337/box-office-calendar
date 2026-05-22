"use client";

import { useCallback, useEffect, useState } from "react";
import { WeekNavigator } from "@/components/WeekNavigator";
import { WeeklyChart } from "@/components/WeeklyChart";
import { getSamplePastWeek } from "@/data/sampleWeeks";
import {
  currentWeekOf,
  isPastWeek,
  startOfWeekSunday,
  toDateKey,
} from "@/lib/week";
import type { FutureDay } from "@/types/movie";
import type { ReleaseScheduleResponse } from "@/types/the-numbers";

export function HomePage() {
  const [weekOf, setWeekOf] = useState(currentWeekOf);
  const [futureWeek, setFutureWeek] = useState<FutureDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewingPast = isPastWeek(weekOf);

  const loadReleases = useCallback(async (anchor: Date, signal: AbortSignal) => {
    const weekQuery = toDateKey(startOfWeekSunday(anchor));
    const response = await fetch(`/api/releases?week=${weekQuery}`, { signal });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        typeof body.error === "string"
          ? body.error
          : "Failed to load release schedule",
      );
    }

    const data: ReleaseScheduleResponse = await response.json();
    return data.futureWeek ?? [];
  }, []);

  useEffect(() => {
    if (viewingPast) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    loadReleases(weekOf, controller.signal)
      .then(setFutureWeek)
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setFutureWeek([]);
        setError(err instanceof Error ? err.message : "Something went wrong");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [weekOf, viewingPast, loadReleases]);

  const handleWeekChange = (next: Date) => {
    setWeekOf(startOfWeekSunday(next));
  };

  return (
    <div className="min-h-full bg-zinc-50 font-sans dark:bg-zinc-950">
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Box Office Calendar
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
            Browse by week. Past weeks show daily box office leaders; this week
            and future weeks show theatrical releases from The Numbers.
          </p>
        </header>

        <WeekNavigator weekOf={weekOf} onWeekChange={handleWeekChange} />

        <div className="mt-10">
          {viewingPast ? (
            <WeeklyChart
              mode="past"
              weekOf={weekOf}
              pastWeek={getSamplePastWeek(weekOf)}
            />
          ) : (
            <>
              {loading && (
                <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Loading releases…
                </p>
              )}
              {error && (
                <p
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
                  role="alert"
                >
                  {error}
                </p>
              )}
              <WeeklyChart
                mode="future"
                weekOf={weekOf}
                futureWeek={futureWeek}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
