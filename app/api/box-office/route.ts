import { NextRequest, NextResponse } from "next/server";
import { getPastWeek } from "@/lib/the-numbers/getPastWeek";
import { parseDateKey, startOfWeekSunday, toDateKey } from "@/lib/week";
import type { BoxOfficeWeekResponse } from "@/types/the-numbers";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const weekParam = request.nextUrl.searchParams.get("week");

  if (!weekParam) {
    return NextResponse.json(
      { error: "Missing week query parameter (use ISO date)" },
      { status: 400 },
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    return NextResponse.json(
      { error: "Invalid week query parameter (use YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const weekStart = startOfWeekSunday(parseDateKey(weekParam));

  try {
    const pastWeek = await getPastWeek(weekStart);
    const body: BoxOfficeWeekResponse = {
      weekOf: toDateKey(weekStart),
      scrapedAt: new Date().toISOString(),
      pastWeek,
    };

    return NextResponse.json(body, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to scrape box office";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
