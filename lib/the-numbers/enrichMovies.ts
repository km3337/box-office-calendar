import { getMoviePage } from "@/lib/the-numbers/getMoviePage";
import type { ScrapedMovieDetails } from "@/lib/the-numbers/scrapeMoviePage";
import type { FutureDay, Movie, PastDay } from "@/types/movie";

function applyDetails(movie: Movie, details: ScrapedMovieDetails): Movie {
  return {
    ...movie,
    genre: details.genre?.trim() || movie.genre,
    posterUrl: details.posterUrl ?? movie.posterUrl,
  };
}

export async function enrichMovieMap(
  movies: Iterable<Movie>,
): Promise<Map<string, Movie>> {
  const byId = new Map<string, Movie>();
  for (const movie of movies) {
    byId.set(movie.id, movie);
  }

  await Promise.all(
    [...byId.keys()].map(async (id) => {
      try {
        const details = await getMoviePage(id);
        byId.set(id, applyDetails(byId.get(id)!, details));
      } catch {
        // Keep original movie if enrichment fails.
      }
    }),
  );

  return byId;
}

export async function enrichPastWeek(pastWeek: PastDay[]): Promise<PastDay[]> {
  const movieMap = await enrichMovieMap(
    pastWeek.flatMap((day) => day.rankings.map((r) => r.movie)),
  );

  return pastWeek.map((day) => ({
    ...day,
    rankings: day.rankings.map((ranking) => ({
      ...ranking,
      movie: movieMap.get(ranking.movie.id) ?? ranking.movie,
    })),
  }));
}

export async function enrichFutureWeek(
  futureWeek: FutureDay[],
): Promise<FutureDay[]> {
  const movieMap = await enrichMovieMap(
    futureWeek.flatMap((day) => day.movies),
  );

  return futureWeek.map((day) => ({
    ...day,
    movies: day.movies.map((movie) => movieMap.get(movie.id) ?? movie),
  }));
}
