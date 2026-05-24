import type { FutureDay, Movie } from "@/types/movie";

/** Minimum wide releases on one day to flag as crowded. */
export const CROWDED_WIDE_MIN = 3;

export type UpcomingOutlook = {
  totalReleases: number;
  newCount: number;
  returningCount: number;
  wideCount: number;
  limitedCount: number;
  busiestDay: { dateKey: string; count: number } | null;
  topHoldover: {
    title: string;
    releaseType: string;
    boxOfficeToDate: number;
  } | null;
  crowdedDay: { dateKey: string; wideCount: number } | null;
};

export function isReturningRelease(movie: Movie): boolean {
  return movie.boxOfficeToDate != null && movie.boxOfficeToDate > 0;
}

export function isWideRelease(releaseType: string): boolean {
  return /\bwide\b/i.test(releaseType);
}

function maxByDate(
  counts: Map<string, number>,
): { dateKey: string; count: number } | null {
  let best: { dateKey: string; count: number } | null = null;
  for (const [dateKey, count] of counts) {
    if (!best || count > best.count) best = { dateKey, count };
  }
  return best;
}

export function computeUpcomingOutlook(futureWeek: FutureDay[]): UpcomingOutlook {
  let newCount = 0;
  let returningCount = 0;
  let wideCount = 0;
  let limitedCount = 0;
  const releasesPerDay = new Map<string, number>();
  const widePerDay = new Map<string, number>();
  let topHoldover: UpcomingOutlook["topHoldover"] = null;

  for (const day of futureWeek) {
    if (day.movies.length > 0) {
      releasesPerDay.set(day.date, day.movies.length);
    }

    let dayWide = 0;
    for (const movie of day.movies) {
      if (isReturningRelease(movie)) {
        returningCount += 1;
      } else {
        newCount += 1;
      }

      if (isWideRelease(movie.genre)) {
        wideCount += 1;
        dayWide += 1;
      } else if (movie.genre) {
        limitedCount += 1;
      }

      const gross = movie.boxOfficeToDate ?? 0;
      if (gross > 0 && (!topHoldover || gross > topHoldover.boxOfficeToDate)) {
        topHoldover = {
          title: movie.title,
          releaseType: movie.genre,
          boxOfficeToDate: gross,
        };
      }
    }

    if (dayWide > 0) {
      widePerDay.set(day.date, dayWide);
    }
  }

  const busiestDay = maxByDate(releasesPerDay);
  const busiestWide = maxByDate(widePerDay);
  const crowdedDay =
    busiestWide && busiestWide.count >= CROWDED_WIDE_MIN
      ? { dateKey: busiestWide.dateKey, wideCount: busiestWide.count }
      : null;

  return {
    totalReleases: newCount + returningCount,
    newCount,
    returningCount,
    wideCount,
    limitedCount,
    busiestDay,
    topHoldover,
    crowdedDay,
  };
}

export function formatOutlookDay(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
