/** Core movie record — extend as real data sources are wired in. */
export type Movie = {
  id: string;
  title: string;
  genre: string;
  /** Poster image URL from The Numbers (when enriched). */
  posterUrl?: string;
  /** Lifetime box office before this week; omit or 0 for first-time releases. */
  boxOfficeToDate?: number;
};

export type MovieDayRanking = {
  movie: Movie;
  gross: number;
};

/** Past week: daily box office rankings (up to top 10 per day). */
export type PastDay = {
  date: string;
  rankings: MovieDayRanking[];
};

/** Future week: movies scheduled or expected on a given day. */
export type FutureDay = {
  date: string;
  movies: Movie[];
};
