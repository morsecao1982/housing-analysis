import { ZILLOW_ZHVI_URL, PRIMARY_ZIPS, NEIGHBORHOODS } from "./constants";
import { NeighborhoodData } from "@/types/housing";

const ZILLOW_TOP_TIER_URL =
  "https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.67_1.0_sm_sa_month.csv";

const NOVA_ZIPS = new Set(NEIGHBORHOODS.flatMap((n) => n.zipCodes));

function parseZillowCsv(csv: string) {
  const lines = csv.split("\n");
  const headers = lines[0].split(",");
  const dateCols = headers
    .map((h, i) => ({ header: h.trim(), index: i }))
    .filter(({ header }) => /^\d{4}-\d{2}-\d{2}$/.test(header))
    .slice(-24);

  const zipData: Record<string, { date: string; value: number }[]> = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const zip = cols[headers.indexOf("RegionName")]?.trim();
    if (!zip || !NOVA_ZIPS.has(zip)) continue;
    zipData[zip] = dateCols
      .map(({ header, index }) => ({ date: header, value: parseFloat(cols[index]) || 0 }))
      .filter((d) => d.value > 0);
  }
  return zipData;
}

export async function fetchMarketData(): Promise<NeighborhoodData[]> {
  const [medianRes, topTierRes] = await Promise.all([
    fetch(ZILLOW_ZHVI_URL,     { next: { revalidate: 604800 } }),
    fetch(ZILLOW_TOP_TIER_URL, { next: { revalidate: 604800 } }),
  ]);
  const [medianCsv, topTierCsv] = await Promise.all([medianRes.text(), topTierRes.text()]);
  const medianData  = parseZillowCsv(medianCsv);
  const topTierData = parseZillowCsv(topTierCsv);

  return Object.entries(PRIMARY_ZIPS).map(([name, zip]) => {
    const history   = medianData[zip]  ?? [];
    const ncHistory = topTierData[zip] ?? [];
    const latest         = history[history.length - 1]?.value ?? 0;
    const oneMonthAgo    = history[history.length - 2]?.value ?? latest;
    const twelveMonAgo   = history[history.length - 13]?.value ?? latest;
    const ncLatest       = ncHistory[ncHistory.length - 1]?.value ?? 0;
    const ncTwelveMonAgo = ncHistory[ncHistory.length - 13]?.value ?? ncLatest;
    return {
      name, zipCode: zip,
      medianHomeValue:           latest,
      medianHomeValueChange1Mo:  latest > 0 && oneMonthAgo  > 0 ? ((latest - oneMonthAgo)  / oneMonthAgo)  * 100 : 0,
      medianHomeValueChange12Mo: latest > 0 && twelveMonAgo > 0 ? ((latest - twelveMonAgo) / twelveMonAgo) * 100 : 0,
      priceHistory:              history,
      newConstructionValue:      ncLatest,
      newConstructionChange12Mo: ncLatest > 0 && ncTwelveMonAgo > 0 ? ((ncLatest - ncTwelveMonAgo) / ncTwelveMonAgo) * 100 : 0,
      newConstructionHistory:    ncHistory,
    };
  });
}
