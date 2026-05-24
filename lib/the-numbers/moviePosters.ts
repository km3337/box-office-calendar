export const MOVIE_POSTER_BASE =
  "https://media.the-numbers.com/images/movie-posters";

export function posterUrlFromSlug(slug: string): string {
  return `${MOVIE_POSTER_BASE}/${encodeURIComponent(slug)}.jpg`;
}
