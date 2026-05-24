import { unstable_cache } from "next/cache";
import { weekDateKeys } from "@/lib/week";
import type { PastDay } from "@/types/movie";
import { enrichPastWeek } from "@/lib/the-numbers/enrichMovies";
import {
  dailyRankingsToPastDay,
  scrapeDailyBoxOffice,
} from "@/lib/the-numbers/scrapeDailyBoxOffice";

const CACHE_TAG = "the-numbers-daily-box-office";

export async function getDailyBoxOffice(dateKey: string) {
  return unstable_cache(
    () => scrapeDailyBoxOffice(dateKey),
    [CACHE_TAG, dateKey],
    { revalidate: 3600, tags: [CACHE_TAG] },
  )();
}

export async function getPastWeek(weekOf: Date): Promise<PastDay[]> {
  const keys = weekDateKeys(weekOf);
  const days = await Promise.all(
    keys.map(async (date) => {
      const rankings = await getDailyBoxOffice(date);
      return dailyRankingsToPastDay(date, rankings);
    }),
  );
  return enrichPastWeek(days);
}
