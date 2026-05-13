/**
 * Fetches recently sold single-family homes built in the last 2 years
 * to derive real market new construction price per sqft by neighborhood.
 */

const KEY  = process.env.RAPIDAPI_KEY ?? "";
const HOST = "us-real-estate-listings.p.rapidapi.com";

const SEARCH_LOCATIONS = [
  { query: "McLean,VA",       neighborhood: "McLean"       },
  { query: "Great Falls,VA",  neighborhood: "Great Falls"  },
  { query: "Vienna,VA",       neighborhood: "Vienna"       },
  { query: "Falls Church,VA", neighborhood: "Falls Church" },
  { query: "Tysons,VA",       neighborhood: "Tysons"       },
];

// Fallback prices if not enough sold comps exist
const FALLBACK_PRICE: Record<string, number> = {
  McLean:         465,
  "Great Falls":  441,
  Vienna:         457,
  "Falls Church": 405,
  Tysons:         440,
};

interface SoldListing {
  last_sold_price?: number;
  description: { sqft?: number; year_built?: number; type?: string };
}

async function fetchSoldComps(query: string): Promise<SoldListing[]> {
  const currentYear = new Date().getFullYear();
  const yearMin = currentYear - 2; // 2 years old or less = new construction

  const res = await fetch(
    `https://${HOST}/sold-homes?location=${query.replace(/ /g, "+")}&limit=50&year_built_min=${yearMin}`,
    {
      headers: { "x-rapidapi-key": KEY, "x-rapidapi-host": HOST },
      next: { revalidate: 604800 }, // 7-day cache
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json?.listings ?? [];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export async function fetchNewConstructionComps(): Promise<{
  prices: Record<string, number>;
  sampleCounts: Record<string, number>;
}> {
  const results = await Promise.allSettled(
    SEARCH_LOCATIONS.map((loc) =>
      fetchSoldComps(loc.query).then((items) => ({
        neighborhood: loc.neighborhood,
        items,
      }))
    )
  );

  const prices: Record<string, number>       = {};
  const sampleCounts: Record<string, number> = {};

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { neighborhood, items } = result.value;

    // Single family only with valid price + sqft
    const priceSqft = items
      .filter(
        (l) =>
          l.description?.type === "single_family" &&
          l.last_sold_price &&
          l.last_sold_price > 0 &&
          l.description?.sqft &&
          l.description.sqft > 500
      )
      .map((l) => l.last_sold_price! / l.description.sqft!);

    sampleCounts[neighborhood] = priceSqft.length;

    if (priceSqft.length >= 3) {
      prices[neighborhood] = Math.round(median(priceSqft));
    } else {
      // Not enough comps — use fallback
      prices[neighborhood] = FALLBACK_PRICE[neighborhood] ?? 450;
    }
  }

  return { prices, sampleCounts };
}
