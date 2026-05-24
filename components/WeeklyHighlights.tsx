"use client";

import { useMemo } from "react";
import { formatWeekRange } from "@/lib/week";
import type { PastDay } from "@/types/movie";

export type WeeklyHighlightsProps = {
  weekOf: Date;
  pastWeek: PastDay[];
  loading?: boolean;
};

type WeekHighlights = {
  topMovie: { title: string; genre: string; gross: number } | null;
  topGenre: { genre: string; gross: number } | null;
  bestDay: { dateKey: string; gross: number } | null;
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

function formatDayLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

function maxEntry<K>(map: Map<K, number>): [K, number] | null {
  let best: [K, number] | null = null;
  for (const [key, value] of map) {
    if (!best || value > best[1]) best = [key, value];
  }
  return best;
}

function computeHighlights(pastWeek: PastDay[]): WeekHighlights {
  const movieTotals = new Map<
    string,
    { title: string; genre: string; gross: number }
  >();
  const genreTotals = new Map<string, number>();
  const dayTotals = new Map<string, number>();

  for (const day of pastWeek) {
    let dayGross = 0;
    for (const { movie, gross } of day.rankings) {
      dayGross += gross;
      const existing = movieTotals.get(movie.id);
      if (existing) {
        existing.gross += gross;
      } else {
        movieTotals.set(movie.id, {
          title: movie.title,
          genre: movie.genre,
          gross,
        });
      }
      if (movie.genre && movie.genre !== "—") {
        genreTotals.set(
          movie.genre,
          (genreTotals.get(movie.genre) ?? 0) + gross,
        );
      }
    }
    if (day.rankings.length > 0) {
      dayTotals.set(day.date, dayGross);
    }
  }

  let topMovie: WeekHighlights["topMovie"] = null;
  for (const entry of movieTotals.values()) {
    if (!topMovie || entry.gross > topMovie.gross) topMovie = entry;
  }

  const topGenreEntry = maxEntry(genreTotals);
  const bestDayEntry = maxEntry(dayTotals);

  return {
    topMovie,
    topGenre: topGenreEntry
      ? { genre: topGenreEntry[0], gross: topGenreEntry[1] }
      : null,
    bestDay: bestDayEntry
      ? { dateKey: bestDayEntry[0], gross: bestDayEntry[1] }
      : null,
  };
}

function HighlightCard({
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
      <p className="mt-3 text-sm font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
        {value}
      </p>
    </article>
  );
}

function HighlightsLoadingSkeleton() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-3"
      aria-hidden
    >
      {Array.from({ length: 3 }, (_, index) => (
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

export function WeeklyHighlights({
  weekOf,
  pastWeek,
  loading = false,
}: WeeklyHighlightsProps) {
  const highlights = useMemo(
    () => computeHighlights(pastWeek),
    [pastWeek],
  );

  const hasData =
    highlights.topMovie ?? highlights.topGenre ?? highlights.bestDay;

  return (
    <section
      className="w-full"
      aria-label="Weekly highlights"
      aria-busy={loading}
    >
      <header className="mb-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Weekly highlights
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatWeekRange(weekOf)}
        </p>
      </header>

      {loading ? (
        <div role="status">
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Loading weekly highlights…
          </p>
          <HighlightsLoadingSkeleton />
        </div>
      ) : !hasData ? (
        <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          No box office data for this week.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <HighlightCard
            label="Highest grossing movie"
            title={highlights.topMovie?.title ?? "—"}
            subtitle={highlights.topMovie?.genre}
            value={
              highlights.topMovie
                ? `${formatCurrency(highlights.topMovie.gross)} total`
                : "—"
            }
          />
          <HighlightCard
            label="Highest grossing genre"
            title={highlights.topGenre?.genre ?? "—"}
            value={
              highlights.topGenre
                ? `${formatCurrency(highlights.topGenre.gross)} total`
                : "—"
            }
          />
          <HighlightCard
            label="Best day for sales"
            title={
              highlights.bestDay
                ? formatDayLabel(highlights.bestDay.dateKey)
                : "—"
            }
            value={
              highlights.bestDay
                ? `${formatCurrency(highlights.bestDay.gross)} total`
                : "—"
            }
          />
        </div>
      )}
    </section>
  );
}
