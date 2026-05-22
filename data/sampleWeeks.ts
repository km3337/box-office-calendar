import { weekDateKeys } from "@/lib/week";
import type { FutureDay, Movie, PastDay } from "@/types/movie";

export { weekDateKeys };

const pastMovies: Movie[] = [
  { id: "p1", title: "Neon Horizon", genre: "Sci-Fi" },
  { id: "p2", title: "The Last Orchard", genre: "Drama" },
  { id: "p3", title: "Midnight Relay", genre: "Action" },
  { id: "p4", title: "Paper Comet", genre: "Comedy" },
  { id: "p5", title: "Harbor Lights", genre: "Romance" },
  { id: "p6", title: "Static Kingdom", genre: "Thriller" },
  { id: "p7", title: "Driftwood Saints", genre: "Western" },
  { id: "p8", title: "Glass Orchard", genre: "Horror" },
  { id: "p9", title: "City of Echoes", genre: "Mystery" },
  { id: "p10", title: "Copper Line", genre: "Crime" },
];

const futureMovies: Movie[] = [
  { id: "f1", title: "Starlight Protocol", genre: "Sci-Fi" },
  { id: "f2", title: "Neon Horizon", genre: "Sci-Fi", boxOfficeToDate: 142_000_000 },
  { id: "f3", title: "Garden of Rust", genre: "Drama" },
  { id: "f4", title: "Midnight Relay", genre: "Action", boxOfficeToDate: 88_500_000 },
  { id: "f5", title: "The Violet Engine", genre: "Animation" },
  { id: "f6", title: "Paper Comet", genre: "Comedy", boxOfficeToDate: 41_200_000 },
  { id: "f7", title: "Iron Monsoon", genre: "Action" },
  { id: "f8", title: "Harbor Lights", genre: "Romance", boxOfficeToDate: 29_800_000 },
];

function buildPastRankings(dayIndex: number): PastDay["rankings"] {
  const base = 18_000_000 - dayIndex * 800_000;
  return pastMovies.map((movie, rank) => ({
    movie,
    gross: Math.round(base - rank * 1_450_000 + (dayIndex % 3) * 200_000),
  }));
}

/** Week of May 11, 2026 (sample past week). */
export const SAMPLE_PAST_WEEK_OF = new Date(2026, 4, 14);

export function getSamplePastWeek(weekOf: Date = SAMPLE_PAST_WEEK_OF): PastDay[] {
  return weekDateKeys(weekOf).map((date, index) => ({
    date,
    rankings: buildPastRankings(index),
  }));
}

/** Week of May 25, 2026 (sample upcoming week). */
export const SAMPLE_FUTURE_WEEK_OF = new Date(2026, 4, 28);

const futureSchedule: Movie[][] = [
  [],
  [futureMovies[0], futureMovies[1]],
  [futureMovies[2]],
  [futureMovies[3], futureMovies[4], futureMovies[5]],
  [futureMovies[6]],
  [futureMovies[7], futureMovies[0]],
  [futureMovies[4]],
];

export function getSampleFutureWeek(): FutureDay[] {
  const keys = weekDateKeys(SAMPLE_FUTURE_WEEK_OF);
  return keys.map((date, index) => ({
    date,
    movies: futureSchedule[index] ?? [],
  }));
}
