import * as cheerio from "cheerio";
import type { FutureDay, Movie } from "@/types/movie";
import type { ScrapedRelease } from "@/types/the-numbers";
import { weekDateKeys } from "@/lib/week";

export const RELEASE_SCHEDULE_URL =
  "https://www.the-numbers.com/movies/release-schedule";

function parseBoxOffice(text: string): number | undefined {
  const cleaned = text.replace(/\s/g, "").replace(/[$,]/g, "");
  if (!cleaned) return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function slugFromHref(href: string): string {
  const match = href.match(/\/movie\/(.+)/i);
  return match ? decodeURIComponent(match[1]) : href;
}

function parseReleaseType(movieCellText: string, title: string): string {
  const afterTitle = movieCellText.slice(title.length).trim();
  const match = afterTitle.match(/\(([^)]+)\)/);
  return match?.[1]?.trim() ?? "";
}

export async function scrapeReleaseSchedule(
  year?: number,
): Promise<ScrapedRelease[]> {
  const url =
    year != null
      ? `${RELEASE_SCHEDULE_URL}?year=${year}`
      : RELEASE_SCHEDULE_URL;

  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "User-Agent": "box-office-calendar/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `The Numbers returned ${response.status} for release schedule`,
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const releases: ScrapedRelease[] = [];
  let currentDate: string | null = null;

  $("table").each((_, table) => {
    const headers = $(table)
      .find("th")
      .toArray()
      .map((th) => $(th).text().replace(/\s+/g, " ").trim());
    if (!headers.some((text) => text.includes("Release Date"))) return;

    $(table)
      .find("tr")
      .each((_, row) => {
        const $row = $(row);
        const cells = $row.find("td");
        if (cells.length < 3) return;

        const colspan = cells.first().attr("colspan");
        if (colspan === "4") {
          const headerText = cells.first().text().trim();
          if (!headerText) return;
          return;
        }

        const rowId = $row.attr("id");
        if (rowId && /^\d{4}-\d{2}-\d{2}$/.test(rowId)) {
          currentDate = rowId;
        }

        if (!currentDate) return;

        const movieCell = cells.eq(1);
        const link = movieCell.find("a").first();
        const title = link.text().trim();
        if (!title) return;

        const href = link.attr("href") ?? "";
        const slug = slugFromHref(href);
        const releaseType = parseReleaseType(movieCell.text().trim(), title);
        const distributor = cells.eq(2).text().trim();
        const boxOfficeToDate = parseBoxOffice(cells.eq(3).text());

        releases.push({
          date: currentDate,
          slug,
          title,
          releaseType,
          distributor,
          boxOfficeToDate,
          isReRelease: /re-release/i.test(releaseType),
          sourceUrl: href.startsWith("http")
            ? href
            : `https://www.the-numbers.com${href}`,
        });
      });
  });

  if (releases.length === 0) {
    throw new Error("No releases found in The Numbers release schedule page");
  }

  return releases;
}

export function scrapedReleaseToMovie(release: ScrapedRelease): Movie {
  return {
    id: release.slug,
    title: release.title,
    genre: release.releaseType || "Unknown",
    boxOfficeToDate: release.boxOfficeToDate,
  };
}

export function releasesToFutureWeek(
  releases: ScrapedRelease[],
  weekOf: Date,
): FutureDay[] {
  const keys = new Set(weekDateKeys(weekOf));
  const byDate = new Map<string, Movie[]>();

  for (const date of keys) {
    byDate.set(date, []);
  }

  for (const release of releases) {
    if (!keys.has(release.date)) continue;
    byDate.get(release.date)!.push(scrapedReleaseToMovie(release));
  }

  return weekDateKeys(weekOf).map((date) => ({
    date,
    movies: byDate.get(date) ?? [],
  }));
}
