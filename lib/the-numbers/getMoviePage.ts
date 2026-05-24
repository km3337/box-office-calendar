import { unstable_cache } from "next/cache";
import {
  scrapeMoviePage,
  type ScrapedMovieDetails,
} from "@/lib/the-numbers/scrapeMoviePage";

const CACHE_TAG = "the-numbers-movie-page";

export async function getMoviePage(slug: string): Promise<ScrapedMovieDetails> {
  return unstable_cache(
    () => scrapeMoviePage(slug),
    [CACHE_TAG, slug],
    { revalidate: 86400, tags: [CACHE_TAG] },
  )();
}
