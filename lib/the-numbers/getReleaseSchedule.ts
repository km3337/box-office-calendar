import { unstable_cache } from "next/cache";
import {
  RELEASE_SCHEDULE_URL,
  scrapeReleaseSchedule,
} from "@/lib/the-numbers/scrapeReleaseSchedule";
import type { ScrapedRelease } from "@/types/the-numbers";

const CACHE_TAG = "the-numbers-release-schedule";

export async function getReleaseSchedule(
  year?: number,
): Promise<ScrapedRelease[]> {
  const cacheKey = year != null ? String(year) : "default";

  return unstable_cache(
    () => scrapeReleaseSchedule(year),
    [CACHE_TAG, cacheKey],
    { revalidate: 3600, tags: [CACHE_TAG] },
  )();
}

export { RELEASE_SCHEDULE_URL };
