import { NextResponse } from "next/server";
import { ZILLOW_ZHVI_URL, PRIMARY_ZIPS, NEIGHBORHOODS } from "@/lib/constants";
import { NeighborhoodData } from "@/types/housing";

const NOVA_ZIPS = new Set(
  NEIGHBORHOODS.flatMap((n) => n.zipCodes)
);

export async function GET() {
  try {
    const res = await fetch(ZILLOW_ZHVI_URL, { cache: "no-store" });
    const csv = await res.text();

    const lines = csv.split("\n");
    const headers = lines[0].split(",");

    // Find date columns (format: YYYY-MM-DD)
    const dateCols = headers
      .map((h, i) => ({ header: h.trim(), index: i }))
      .filter(({ header }) => /^\d{4}-\d{2}-\d{2}$/.test(header))
      .slice(-24); // last 24 months

    const zipData: Record<string, { date: string; value: number }[]> = {};

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",");
      const zip = cols[headers.indexOf("RegionName")]?.trim();
      if (!zip || !NOVA_ZIPS.has(zip)) continue;

      zipData[zip] = dateCols
        .map(({ header, index }) => ({
          date: header,
          value: parseFloat(cols[index]) || 0,
        }))
        .filter((d) => d.value > 0);
    }

    const neighborhoods: NeighborhoodData[] = Object.entries(PRIMARY_ZIPS).map(
      ([name, zip]) => {
        const history = zipData[zip] ?? [];
        const latest = history[history.length - 1]?.value ?? 0;
        const oneMonthAgo = history[history.length - 2]?.value ?? latest;
        const twelveMonthsAgo = history[history.length - 13]?.value ?? latest;

        return {
          name,
          zipCode: zip,
          medianHomeValue: latest,
          medianHomeValueChange1Mo: latest > 0 && oneMonthAgo > 0
            ? ((latest - oneMonthAgo) / oneMonthAgo) * 100
            : 0,
          medianHomeValueChange12Mo: latest > 0 && twelveMonthsAgo > 0
            ? ((latest - twelveMonthsAgo) / twelveMonthsAgo) * 100
            : 0,
          priceHistory: history,
        };
      }
    );

    return NextResponse.json(neighborhoods, {
      headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" },
    });
  } catch (error) {
    console.error("Market data error:", error);
    return NextResponse.json({ error: "Failed to fetch market data" }, { status: 500 });
  }
}
