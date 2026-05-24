"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UpcomingOutlook } from "@/components/UpcomingOutlook";
import { WeekNavigator } from "@/components/WeekNavigator";
import { WeeklyChart } from "@/components/WeeklyChart";
import { WeeklyHighlights } from "@/components/WeeklyHighlights";
import {
  currentWeekOf,
  isPastWeek,
  parseDateKey,
  startOfWeekSunday,
  toDateKey,
} from "@/lib/week";
import type { FutureDay, PastDay } from "@/types/movie";
import type {
  BoxOfficeWeekResponse,
  ReleaseScheduleResponse,
} from "@/types/the-numbers";

export function HomePage() {
  const [weekStartKey, setWeekStartKey] = useState(() =>
    toDateKey(currentWeekOf()),
  );
  const weekOf = useMemo(() => parseDateKey(weekStartKey), [weekStartKey]);

  const [pastWeek, setPastWeek] = useState<PastDay[]>([]);
  const [futureWeek, setFutureWeek] = useState<FutureDay[]>([]);
  const [loadingBoxOffice, setLoadingBoxOffice] = useState(true);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [boxOfficeError, setBoxOfficeError] = useState<string | null>(null);
  const [releasesError, setReleasesError] = useState<string | null>(null);

  const viewingPast = isPastWeek(weekOf);

  const loadBoxOffice = useCallback(
    async (weekKey: string, signal: AbortSignal) => {
      const response = await fetch(`/api/box-office?week=${weekKey}`, {
        signal,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : "Failed to load box office data",
        );
      }

      const data: BoxOfficeWeekResponse = await response.json();
      return data;
    },
    [],
  );

  const loadReleases = useCallback(
    async (weekKey: string, signal: AbortSignal) => {
      const response = await fetch(`/api/releases?week=${weekKey}`, { signal });

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
    },
    [],
  );

  const fetchGenerationRef = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const generation = ++fetchGenerationRef.current;
    const requestedWeekKey = weekStartKey;

    const isStale = () => fetchGenerationRef.current !== generation;

    setLoadingBoxOffice(true);
    setLoadingReleases(true);
    setBoxOfficeError(null);
    setReleasesError(null);

    loadBoxOffice(requestedWeekKey, controller.signal)
      .then((data) => {
        if (isStale() || data.weekOf !== requestedWeekKey) return;
        setPastWeek(data.pastWeek ?? []);
      })
      .catch((err: unknown) => {
        if (isStale() || controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setBoxOfficeError(
          err instanceof Error ? err.message : "Something went wrong",
        );
      })
      .finally(() => {
        if (!isStale()) setLoadingBoxOffice(false);
      });

    loadReleases(requestedWeekKey, controller.signal)
      .then((data) => {
        if (isStale()) return;
        setFutureWeek(data);
      })
      .catch((err: unknown) => {
        if (isStale() || controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setReleasesError(
          err instanceof Error ? err.message : "Something went wrong",
        );
      })
      .finally(() => {
        if (!isStale()) setLoadingReleases(false);
      });

    return () => {
      controller.abort();
    };
  }, [weekStartKey, loadBoxOffice, loadReleases]);

  const handleWeekChange = (next: Date) => {
    setWeekStartKey(toDateKey(startOfWeekSunday(next)));
  };

  const error = viewingPast ? boxOfficeError : releasesError;

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

        <div className="mt-10 space-y-10">
          {error && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
              role="alert"
            >
              {error}
            </p>
          )}
          {viewingPast ? (
            <>
              <WeeklyChart
                key={weekStartKey}
                mode="past"
                weekOf={weekOf}
                loading={loadingBoxOffice}
                pastWeek={pastWeek}
              />
              <WeeklyHighlights
                weekOf={weekOf}
                pastWeek={pastWeek}
                loading={loadingBoxOffice}
              />
            </>
          ) : (
            <>
              <UpcomingOutlook
                weekOf={weekOf}
                futureWeek={futureWeek}
                loading={loadingReleases}
              />
              <WeeklyChart
                key={weekStartKey}
                mode="future"
                weekOf={weekOf}
                loading={loadingReleases}
                futureWeek={futureWeek}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
