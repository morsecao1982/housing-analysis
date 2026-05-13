import { PPI_SERIES } from "./constants";
import { MaterialIndex } from "@/types/housing";

const BLS_API = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

export async function fetchMaterials(): Promise<{ materials: MaterialIndex[]; materialCostMultiplier: number }> {
  const results = await Promise.allSettled(
    PPI_SERIES.map(async (series) => {
      const res  = await fetch(`${BLS_API}${series.id}`, { next: { revalidate: 604800 } });
      const json = await res.json();
      const data: { year: string; period: string; value: string }[] =
        json?.Results?.series?.[0]?.data ?? [];

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

      const currentValue  = history[history.length - 1]?.value ?? 100;
      const baselineValue = history[0]?.value ?? 100;
      return {
        name: series.name, seriesId: series.id, currentValue, baselineValue,
        changePercent: baselineValue > 0 ? ((currentValue - baselineValue) / baselineValue) * 100 : 0,
        history, weight: series.weight,
      } as MaterialIndex;
    })
  );

  const materials = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<MaterialIndex>).value);

  const totalWeight = materials.reduce((s, m) => s + m.weight, 0);
  const materialCostMultiplier = totalWeight > 0
    ? materials.reduce((s, m) => s + (m.baselineValue > 0 ? m.currentValue / m.baselineValue : 1) * m.weight, 0) / totalWeight
    : 1;

  return { materials, materialCostMultiplier };
}
