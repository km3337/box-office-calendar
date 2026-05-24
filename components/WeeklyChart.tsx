"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { startOfWeekSunday, toDateKey } from "@/lib/week";
import type { FutureDay, Movie, PastDay } from "@/types/movie";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const VISIBLE_RELEASE_LIMIT = 4;

export type WeeklyChartProps = {
  mode: "past" | "future";
  /** Any date within the Sun–Sat week to display. */
  weekOf: Date;
  loading?: boolean;
  /** Required when `mode` is `"past"`. */
  pastWeek?: PastDay[];
  /** Required when `mode` is `"future"`. */
  futureWeek?: FutureDay[];
};

type WeekDay = {
  date: Date;
  dateKey: string;
  label: (typeof DAY_LABELS)[number];
};

function buildWeekDays(weekOf: Date): WeekDay[] {
  const start = startOfWeekSunday(weekOf);
  return DAY_LABELS.map((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, dateKey: toDateKey(date), label };
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatDayHeading(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function ChartLoadingSkeleton({ mode }: { mode: "past" | "future" }) {
  if (mode === "past") {
    return (
      <div
        className="grid grid-cols-7 gap-2 sm:gap-3"
        aria-hidden
      >
        {DAY_LABELS.map((label) => (
          <div key={label} className="flex min-w-0 animate-pulse flex-col">
            <div className="mb-2 h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="flex flex-1 flex-col rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex h-32 items-end justify-center sm:h-40">
                <div className="h-2/3 w-full max-w-[3.5rem] rounded-t-md bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="mt-2 h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-1 h-2 w-10 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2"
      aria-hidden
    >
      {DAY_LABELS.map((label) => (
        <div
          key={label}
          className="flex min-w-0 animate-pulse flex-col rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <div className="h-3 w-8 rounded bg-zinc-200 dark:bg-zinc-800" />
            <div className="mt-1 h-2 w-12 rounded bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <div className="flex flex-col gap-2 p-2">
            <div className="h-14 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-14 rounded-md bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

function releaseStatus(movie: Movie): "new" | "returning" {
  return movie.boxOfficeToDate != null && movie.boxOfficeToDate > 0
    ? "returning"
    : "new";
}

function MoviePoster({
  movie,
  width,
  height,
}: {
  movie: Movie;
  width: number;
  height: number;
}) {
  if (!movie.posterUrl) return null;

  return (
    <Image
      src={movie.posterUrl}
      alt=""
      width={width}
      height={height}
      className="shrink-0 rounded object-cover bg-zinc-200 dark:bg-zinc-800"
      unoptimized
    />
  );
}

function ReleaseListItem({ movie }: { movie: Movie }) {
  const status = releaseStatus(movie);
  return (
    <li className="flex gap-2 rounded-md bg-white px-2 py-2 dark:bg-zinc-900">
      <MoviePoster movie={movie} width={36} height={54} />
      <div className="min-w-0 flex-1">
      <p className="line-clamp-2 text-xs font-medium leading-snug text-zinc-900 dark:text-zinc-50">
        {movie.title}
      </p>
      <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
        {movie.genre}
      </p>
      <span
        className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
          status === "new"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            : "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300"
        }`}
      >
        {status}
      </span>
      </div>
    </li>
  );
}

function FutureDayModal({
  day,
  movies,
  onClose,
}: {
  day: WeekDay;
  movies: Movie[];
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Releases — {formatDayHeading(day.date)}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {movies.length} {movies.length === 1 ? "movie" : "movies"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            Close
          </button>
        </header>
        <ul className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-4">
          {movies.map((movie) => (
            <ReleaseListItem key={movie.id} movie={movie} />
          ))}
        </ul>
      </div>
    </div>
  );
}

function PastDayModal({
  day,
  rankings,
  onClose,
}: {
  day: WeekDay;
  rankings: PastDay["rankings"];
  onClose: () => void;
}) {
  const titleId = useId();
  const topTen = rankings.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Top movies — {formatDayHeading(day.date)}
            </h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Daily box office (top {topTen.length})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            aria-label="Close"
          >
            Close
          </button>
        </header>
        <ol className="divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
          {topTen.map((entry, index) => (
            <li
              key={`${entry.movie.id}-${index}`}
              className="flex items-center gap-3 px-5 py-3"
            >
              <span className="w-6 shrink-0 text-sm font-medium text-zinc-400">
                {index + 1}
              </span>
              <MoviePoster movie={entry.movie} width={40} height={60} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                  {entry.movie.title}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {entry.movie.genre}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                {formatCurrency(entry.gross)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function PastWeekView({
  weekDays,
  pastByDate,
}: {
  weekDays: WeekDay[];
  pastByDate: Map<string, PastDay>;
}) {
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null);

  const maxGross = useMemo(() => {
    let max = 0;
    for (const day of weekDays) {
      const rankings = pastByDate.get(day.dateKey)?.rankings ?? [];
      const top = rankings[0]?.gross ?? 0;
      if (top > max) max = top;
    }
    return max || 1;
  }, [weekDays, pastByDate]);

  const selectedRankings = selectedDay
    ? (pastByDate.get(selectedDay.dateKey)?.rankings ?? [])
    : [];

  const closeModal = useCallback(() => setSelectedDay(null), []);

  return (
    <>
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {weekDays.map((day) => {
          const rankings = pastByDate.get(day.dateKey)?.rankings ?? [];
          const top = rankings[0];
          const heightPct = top ? (top.gross / maxGross) * 100 : 0;
          const hasData = Boolean(top);

          return (
            <div key={day.dateKey} className="flex min-w-0 flex-col">
              <span className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {day.label}
              </span>
              <div className="flex flex-1 flex-col items-stretch justify-end rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex h-32 items-end justify-center sm:h-40">
                  <button
                    type="button"
                    disabled={!hasData}
                    onClick={() => hasData && setSelectedDay(day)}
                    className="group flex h-full w-full max-w-[3.5rem] flex-col items-center justify-end disabled:cursor-default"
                    aria-label={
                      hasData
                        ? `View top movies for ${formatDayHeading(day.date)}`
                        : `No data for ${day.label}`
                    }
                  >
                    <span
                      className="w-full min-h-[4px] rounded-t-md bg-zinc-800 transition-colors group-enabled:hover:bg-zinc-600 dark:bg-zinc-200 dark:group-enabled:hover:bg-zinc-400"
                      style={{ height: `${heightPct}%` }}
                    />
                  </button>
                </div>
                <p
                  className="mt-2 line-clamp-2 text-center text-[10px] leading-tight text-zinc-600 dark:text-zinc-400 sm:text-xs"
                  title={top?.movie.title}
                >
                  {top?.movie.title ?? "—"}
                </p>
                {top && (
                  <p className="mt-0.5 text-center text-[10px] tabular-nums text-zinc-500 dark:text-zinc-500">
                    {formatCurrency(top.gross)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {selectedDay && selectedRankings.length > 0 && (
        <PastDayModal
          day={selectedDay}
          rankings={selectedRankings}
          onClose={closeModal}
        />
      )}
    </>
  );
}

function FutureWeekView({
  weekDays,
  futureByDate,
}: {
  weekDays: WeekDay[];
  futureByDate: Map<string, FutureDay>;
}) {
  const [selectedDay, setSelectedDay] = useState<{
    day: WeekDay;
    movies: Movie[];
  } | null>(null);

  const closeModal = useCallback(() => setSelectedDay(null), []);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2">
        {weekDays.map((day) => {
          const movies = futureByDate.get(day.dateKey)?.movies ?? [];
          const hasMore = movies.length > VISIBLE_RELEASE_LIMIT;
          const visibleMovies = movies.slice(0, VISIBLE_RELEASE_LIMIT);
          const hiddenCount = movies.length - VISIBLE_RELEASE_LIMIT;

          const cardBody = (
            <>
              <header className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {day.label}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                  {day.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </header>
              <ul className="flex flex-1 flex-col gap-2 p-2">
                {movies.length === 0 ? (
                  <li className="py-4 text-center text-xs text-zinc-400">
                    No releases
                  </li>
                ) : (
                  visibleMovies.map((movie) => (
                    <ReleaseListItem key={movie.id} movie={movie} />
                  ))
                )}
              </ul>
              {hasMore && (
                <p className="border-t border-zinc-200 px-3 py-2 text-center text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                  +{hiddenCount} more — view all
                </p>
              )}
            </>
          );

          if (hasMore) {
            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDay({ day, movies })}
                className="flex min-w-0 flex-col rounded-lg border border-zinc-200 bg-zinc-50 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                aria-label={`View all ${movies.length} releases for ${formatDayHeading(day.date)}`}
              >
                {cardBody}
              </button>
            );
          }

          return (
            <div
              key={day.dateKey}
              className="flex min-w-0 flex-col rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
            >
              {cardBody}
            </div>
          );
        })}
      </div>
      {selectedDay && (
        <FutureDayModal
          day={selectedDay.day}
          movies={selectedDay.movies}
          onClose={closeModal}
        />
      )}
    </>
  );
}

export function WeeklyChart({
  mode,
  weekOf,
  loading = false,
  pastWeek = [],
  futureWeek = [],
}: WeeklyChartProps) {
  const weekDays = useMemo(() => buildWeekDays(weekOf), [weekOf]);

  const pastByDate = useMemo(() => {
    const map = new Map<string, PastDay>();
    for (const day of pastWeek) map.set(day.date, day);
    return map;
  }, [pastWeek]);

  const futureByDate = useMemo(() => {
    const map = new Map<string, FutureDay>();
    for (const day of futureWeek) map.set(day.date, day);
    return map;
  }, [futureWeek]);

  const loadingLabel =
    mode === "past" ? "Loading weekly box office" : "Loading upcoming releases";

  return (
    <section
      className="w-full"
      aria-label={mode === "past" ? "Past week box office chart" : "Upcoming week releases"}
      aria-busy={loading}
    >
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {mode === "past" ? "Weekly box office" : "Upcoming releases"}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatDayHeading(weekDays[0].date)} – {formatDayHeading(weekDays[6].date)}
        </p>
      </header>
      {loading ? (
        <div role="status">
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            {loadingLabel}…
          </p>
          <ChartLoadingSkeleton mode={mode} />
        </div>
      ) : mode === "past" ? (
        <PastWeekView weekDays={weekDays} pastByDate={pastByDate} />
      ) : (
        <FutureWeekView weekDays={weekDays} futureByDate={futureByDate} />
      )}
    </section>
  );
}
