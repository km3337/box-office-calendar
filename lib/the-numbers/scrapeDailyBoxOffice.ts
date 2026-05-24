import * as cheerio from "cheerio";
import type { MovieDayRanking, PastDay } from "@/types/movie";

export const DAILY_BOX_OFFICE_BASE =
  "https://www.the-numbers.com/box-office-chart/daily";

function parseMoney(text: string): number | undefined {
  const cleaned = text.replace(/\s/g, "").replace(/[$,]/g, "");
  if (!cleaned) return undefined;
  const value = Number(cleaned);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

function slugFromHref(href: string): string {
  const match = href.match(/\/movie\/(.+)/i);
  return match ? decodeURIComponent(match[1]) : href;
}

function dailyChartUrl(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${DAILY_BOX_OFFICE_BASE}/${year}/${month}/${day}`;
}

export type ScrapedDailyRanking = {
  slug: string;
  title: string;
  gross: number;
  totalGross?: number;
};

export async function scrapeDailyBoxOffice(
  dateKey: string,
): Promise<ScrapedDailyRanking[]> {
  const response = await fetch(dailyChartUrl(dateKey), {
    headers: {
      Accept: "text/html",
      "User-Agent": "box-office-calendar/1.0",
    },
  });

  if (response.status === 404) return [];

  if (!response.ok) {
    throw new Error(
      `The Numbers returned ${response.status} for daily chart ${dateKey}`,
    );
  }

  const $ = cheerio.load(await response.text());
  const rankings: ScrapedDailyRanking[] = [];

  $("table.chart-desktop tbody tr").each((_, row) => {
    const $row = $(row);
    const cells = $row.find("td");
    if (cells.length < 4) return;

    const link = cells.eq(2).find("a").first();
    const title = link.text().trim();
    if (!title) return;

    const gross = parseMoney(cells.eq(3).text());
    if (gross == null) return;

    const href = link.attr("href") ?? "";
    rankings.push({
      slug: slugFromHref(href),
      title,
      gross,
      totalGross: cells.length > 8 ? parseMoney(cells.eq(8).text()) : undefined,
    });
  });

  return rankings;
}

export function dailyRankingsToPastDay(
  dateKey: string,
  rankings: ScrapedDailyRanking[],
): PastDay {
  const topTen: MovieDayRanking[] = rankings.slice(0, 10).map((entry) => ({
    movie: {
      id: entry.slug,
      title: entry.title,
      genre: "—",
      boxOfficeToDate: entry.totalGross,
    },
    gross: entry.gross,
  }));

  return { date: dateKey, rankings: topTen };
}
