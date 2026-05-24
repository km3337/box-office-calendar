import * as cheerio from "cheerio";
import { posterUrlFromSlug } from "@/lib/the-numbers/moviePosters";

export type ScrapedMovieDetails = {
  genre?: string;
  posterUrl?: string;
};

function absoluteUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `https://www.the-numbers.com${href.startsWith("/") ? href : `/${href}`}`;
}

export async function scrapeMoviePage(
  slug: string,
): Promise<ScrapedMovieDetails> {
  const response = await fetch(
    `https://www.the-numbers.com/movie/${encodeURIComponent(slug)}`,
    {
      headers: {
        Accept: "text/html",
        "User-Agent": "box-office-calendar/1.0",
      },
    },
  );

  if (response.status === 404) {
    return { posterUrl: posterUrlFromSlug(slug) };
  }

  if (!response.ok) {
    throw new Error(
      `The Numbers returned ${response.status} for movie ${slug}`,
    );
  }

  const $ = cheerio.load(await response.text());
  const details: ScrapedMovieDetails = {};

  $("tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length < 2) return;

    const label = cells.first().text().replace(/\s+/g, " ").trim();
    if (!/^Genre:/i.test(label)) return;

    const genre = cells.eq(1).text().trim();
    if (genre) details.genre = genre;
  });

  const posterSrc = $(".thumbnail img").first().attr("src")?.trim();
  if (posterSrc) {
    details.posterUrl = absoluteUrl(posterSrc);
  } else {
    details.posterUrl = posterUrlFromSlug(slug);
  }

  return details;
}
