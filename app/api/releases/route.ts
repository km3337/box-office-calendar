import { NextRequest, NextResponse } from "next/server";
import { enrichFutureWeek } from "@/lib/the-numbers/enrichMovies";
import { getReleaseSchedule, RELEASE_SCHEDULE_URL } from "@/lib/the-numbers/getReleaseSchedule";
import { releasesToFutureWeek } from "@/lib/the-numbers/scrapeReleaseSchedule";
import { parseDateKey, startOfWeekSunday } from "@/lib/week";
import type { ReleaseScheduleResponse } from "@/types/the-numbers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const weekParam = searchParams.get("week");
  const yearParam = searchParams.get("year");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const year = yearParam ? Number(yearParam) : undefined;
  if (yearParam && (!Number.isInteger(year) || year! < 1900)) {
    return NextResponse.json(
      { error: "Invalid year query parameter" },
      { status: 400 },
    );
  }

  try {
    let releases = await getReleaseSchedule(year);

    if (fromParam || toParam) {
      if (!fromParam || !toParam) {
        return NextResponse.json(
          { error: "Both from and to query parameters are required together" },
          { status: 400 },
        );
      }
      releases = releases.filter(
        (release) => release.date >= fromParam && release.date <= toParam,
      );
    }

    const body: ReleaseScheduleResponse = {
      source: RELEASE_SCHEDULE_URL,
      scrapedAt: new Date().toISOString(),
      count: releases.length,
      releases,
    };

    if (weekParam) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
        return NextResponse.json(
          { error: "Invalid week query parameter (use YYYY-MM-DD)" },
          { status: 400 },
        );
      }
      body.futureWeek = await enrichFutureWeek(
        releasesToFutureWeek(
          releases,
          startOfWeekSunday(parseDateKey(weekParam)),
        ),
      );
    }

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to scrape release schedule";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
