/** A single theatrical release row from The Numbers release schedule. */
export type ScrapedRelease = {
  date: string;
  slug: string;
  title: string;
  releaseType: string;
  distributor: string;
  boxOfficeToDate?: number;
  isReRelease: boolean;
  sourceUrl: string;
};

export type ReleaseScheduleResponse = {
  source: string;
  scrapedAt: string;
  count: number;
  releases: ScrapedRelease[];
  futureWeek?: import("@/types/movie").FutureDay[];
};

export type BoxOfficeWeekResponse = {
  weekOf: string;
  scrapedAt: string;
  pastWeek: import("@/types/movie").PastDay[];
};
