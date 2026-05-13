import { PropertyListing } from "@/types/housing";
import { TYPICAL_NEW_BUILD_SQFT } from "./constants";

const KEY = process.env.RAPIDAPI_KEY ?? "";
const HOST = "us-real-estate-listings.p.rapidapi.com";

const SEARCH_LOCATIONS = [
  { query: "McLean,VA",       neighborhood: "McLean"       },
  { query: "Great Falls,VA",  neighborhood: "Great Falls"  },
  { query: "Vienna,VA",       neighborhood: "Vienna"       },
  { query: "Falls Church,VA", neighborhood: "Falls Church" },
  { query: "Tysons,VA",       neighborhood: "Tysons"       },
];

interface RawListing {
  property_id: string;
  listing_id: string;
  status: string;
  list_price: number;
  list_date?: string;
  href?: string;
  flags?: { is_coming_soon?: boolean };
  description: {
    year_built?: number;
    sqft?: number;
    lot_sqft?: number;
    beds?: number;
    baths_consolidated?: string;
    baths_full?: number;
    baths_half?: number;
    type?: string;
  };
  location: {
    address: {
      line?: string;
      city?: string;
      postal_code?: string;
      state_code?: string;
    };
  };
}

async function fetchPage(query: string, offset: number): Promise<{ listings: RawListing[]; total: number }> {
  const res = await fetch(
    `https://${HOST}/for-sale?location=${query.replace(/ /g, "+")}&limit=50&offset=${offset}&year_built_max=1970`,
    {
      headers: { "x-rapidapi-key": KEY, "x-rapidapi-host": HOST },
      next: { revalidate: 604800 },
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API error ${res.status} for "${query}": ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  if (json?.message) throw new Error(`API message for "${query}": ${json.message}`);
  return {
    listings: json?.listings ?? [],
    total:    json?.totalResultCount ?? 0,
  };
}

async function fetchForLocation(query: string): Promise<RawListing[]> {
  // Fetch first page to learn total count
  const first = await fetchPage(query, 0);
  const all   = [...first.listings];

  // Fetch remaining pages in parallel
  const totalPages = Math.ceil(first.total / 50);
  if (totalPages > 1) {
    const offsets = Array.from({ length: totalPages - 1 }, (_, i) => (i + 1) * 50);
    const rest = await Promise.allSettled(offsets.map((off) => fetchPage(query, off)));
    for (const r of rest) {
      if (r.status === "fulfilled") all.push(...r.value.listings);
    }
  }

  // Filter single family only
  return all.filter((l) => l.description?.type === "single_family");
}

export async function fetchRealListings(
  newConstructionPrices: Record<string, number>,
  materialMultiplier = 1.0
): Promise<{ listings: PropertyListing[]; dataNote: string }> {
  const BUILD_COST_PER_SQFT = 420;
  const DEMO_COST_PER_SQFT  = 10;
  const LOAN_RATE           = 0.075;
  const TIMELINE_MONTHS     = 18;
  const DOWN_PAYMENT        = 0.25;
  const SELLING_COST_RATE   = 0.065;

  const results = await Promise.allSettled(
    SEARCH_LOCATIONS.map((loc) =>
      fetchForLocation(loc.query).then((items) =>
        items.map((item) => ({ item, neighborhood: loc.neighborhood }))
      )
    )
  );

  const listings: PropertyListing[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status !== "fulfilled") continue;

    for (const { item, neighborhood } of result.value) {
      const id = item.property_id;
      if (seen.has(id)) continue;
      seen.add(id);

      const desc = item.description;
      const addr = item.location?.address;
      if (!item.list_price || item.list_price <= 0) continue;

      const yearBuilt  = desc.year_built ?? 0;
      const lot        = desc.lot_sqft ?? 0;
      const livingArea = desc.sqft ?? 0;

      const typicalBuild = TYPICAL_NEW_BUILD_SQFT[neighborhood] ?? 4000;
      const newBuildSqft = lot > 0
        ? Math.min(Math.max(Math.round(lot * 0.3), 3000), typicalBuild)
        : typicalBuild;

      const propertyType: "teardown" | "lot_only" =
        (!livingArea || livingArea < 200) ? "lot_only" : "teardown";

      const isComing = item.status === "coming_soon" || item.flags?.is_coming_soon === true;
      const status: "active" | "coming_soon" = isComing ? "coming_soon" : "active";

      const baths = parseFloat(desc.baths_consolidated ?? "0") ||
        (desc.baths_full ?? 0) + (desc.baths_half ?? 0) * 0.5;

      const salePricePerSqft = newConstructionPrices[neighborhood] ?? 450;
      const buildCost        = newBuildSqft * BUILD_COST_PER_SQFT * materialMultiplier;
      const demolitionCost   = propertyType === "lot_only" ? 0 : livingArea * DEMO_COST_PER_SQFT;
      const loanBase         = (item.list_price + buildCost + demolitionCost) * (1 - DOWN_PAYMENT);
      const holdingCosts     = loanBase * (LOAN_RATE / 12) * TIMELINE_MONTHS;
      const expectedSale     = newBuildSqft * salePricePerSqft;
      const sellingCosts     = expectedSale * SELLING_COST_RATE;
      const totalInvestment  = item.list_price + buildCost + demolitionCost + holdingCosts + sellingCosts;
      const profit           = expectedSale - totalInvestment;
      const roi              = (profit / (totalInvestment - sellingCosts)) * 100;

      listings.push({
        id:           `prop-${id}`,
        address:      addr?.line ?? "Unknown",
        neighborhood,
        zip:          addr?.postal_code ?? "",
        yearBuilt,
        listPrice:    item.list_price,
        lotSqft:      lot,
        existingSqft: livingArea,
        newBuildSqft,
        beds:         desc.beds ?? 0,
        baths,
        propertyType,
        status,
        listedDate:   item.list_date,
        daysOnMarket: item.list_date
          ? Math.floor((Date.now() - new Date(item.list_date).getTime()) / 86400000)
          : 0,
        demolitionCost,
        buildCost,
        holdingCosts,
        expectedSale,
        sellingCosts,
        totalInvestment,
        profit,
        roi,
        newConstructionPricePerSqft: salePricePerSqft,
        detailUrl: item.href,
      });
    }
  }

  listings.sort((a, b) => b.roi - a.roi);

  return {
    listings,
    dataNote: "Live Realtor.com data · Pre-1970 homes & lots · Updated weekly",
  };
}
