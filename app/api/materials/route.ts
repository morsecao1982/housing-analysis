import { NextResponse } from "next/server";
import { PPI_SERIES } from "@/lib/constants";
import { MaterialIndex } from "@/types/housing";

const BLS_API = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

export async function GET() {
  try {
    const results = await Promise.allSettled(
      PPI_SERIES.map(async (series) => {
        const res = await fetch(`${BLS_API}${series.id}`, {
          next: { revalidate: 604800 },
        });
        const json = await res.json();
        const data: { year: string; period: string; value: string }[] =
          json?.Results?.series?.[0]?.data ?? [];

        // Sort ascending and take last 24 months
        const sorted = data
          .filter((d) => d.period.startsWith("M"))
          .sort((a, b) => {
            const da = new Date(`${a.year}-${a.period.slice(1).padStart(2, "0")}-01`);
            const db = new Date(`${b.year}-${b.period.slice(1).padStart(2, "0")}-01`);
            return da.getTime() - db.getTime();
          })
          .slice(-24);

        const history = sorted.map((d) => ({
          date: `${d.year}-${d.period.slice(1).padStart(2, "0")}`,
          value: parseFloat(d.value),
        }));

        const currentValue = history[history.length - 1]?.value ?? 100;
        const baselineValue = history[0]?.value ?? 100;
        const changePercent = baselineValue > 0
          ? ((currentValue - baselineValue) / baselineValue) * 100
          : 0;

        return {
          name: series.name,
          seriesId: series.id,
          currentValue,
          baselineValue,
          changePercent,
          history,
          weight: series.weight,
        } as MaterialIndex;
      })
    );

    const materials: MaterialIndex[] = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<MaterialIndex>).value);

    // Weighted average multiplier vs 2-year baseline
    const materialCostMultiplier =
      materials.reduce((sum, m) => {
        const ratio = m.baselineValue > 0 ? m.currentValue / m.baselineValue : 1;
        return sum + ratio * m.weight;
      }, 0) / materials.reduce((sum, m) => sum + m.weight, 0);

    return NextResponse.json(
      { materials, materialCostMultiplier },
      { headers: { "Cache-Control": "s-maxage=86400, stale-while-revalidate" } }
    );
  } catch (error) {
    console.error("Materials data error:", error);
    return NextResponse.json({ error: "Failed to fetch materials data" }, { status: 500 });
  }
}
