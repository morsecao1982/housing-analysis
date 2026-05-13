import { PropertyListing } from "@/types/housing";
import { TYPICAL_NEW_BUILD_SQFT } from "./constants";

const KEY  = process.env.RAPIDAPI_KEY ?? "";

// Zip → neighborhood name
const ZIP_TO_NEIGHBORHOOD: Record<string, string> = {
  "22101": "McLean",
  "22102": "McLean",
  "22066": "Great Falls",
  "22180": "Vienna",
  "22181": "Vienna",
  "22182": "Tysons",
  "22041": "Falls Church",
  "22042": "Falls Church",
  "22043": "Falls Church",
  "22046": "Falls Church",
};

// Search locations per neighborhood (city names get more results than zip codes)
const SEARCH_LOCATIONS = [
  { query: "McLean VA",       neighborhood: "McLean" },
  { query: "Great Falls VA",  neighborhood: "Great Falls" },
  { query: "Vienna VA",       neighborhood: "Vienna" },
  { query: "Falls Church VA", neighborhood: "Falls Church" },
  { query: "Tysons VA",       neighborhood: "Tysons" },
];

interface ZillowListing {
  zpid: number;
  streetAddress: string;
  zipcode: string;
  city: string;
  state: string;
  price: number;
  bathrooms: number;
  bedrooms: number;
  livingArea: number;
  homeStatus: string;
  daysOnZillow: number;
  lotAreaValue: number;
  lotAreaUnit: string;
  comingSoonOnMarketDate?: number;
  detailUrl?: string;
}

async function fetchListingsForLocation(
  query: string
): Promise<{ listing: ZillowListing; detailUrl: string }[]> {
  const res = await fetch(
    `https://real-estate-zillow-com.p.rapidapi.com/v1/search/sale?location_or_rid=${encodeURIComponent(query)}&property_types=house&page=1`,
    {
      headers: {
        "x-rapidapi-key":  KEY,
        "x-rapidapi-host": "real-estate-zillow-com.p.rapidapi.com",
      },
      next: { revalidate: 86400 },
    }
  );
  const json = await res.json();
  const listings: ZillowListing[] = (json?.data?.listings ?? [])
    .map((l: Record<string, unknown>) => l?.hdpData && (l.hdpData as Record<string, unknown>)?.homeInfo)
    .filter(Boolean);

  return (json?.data?.listings ?? []).map((l: Record<string, unknown>) => ({
    listing: (l?.hdpData as Record<string, unknown>)?.homeInfo as ZillowListing,
    detailUrl: (l.detailUrl as string) ?? "",
  })).filter((x: { listing: ZillowListing | undefined }) => x.listing);
}

async function fetchYearBuilt(detailUrl: string): Promise<number | null> {
  try {
    const url = detailUrl.startsWith("http") ? detailUrl : `https://www.zillow.com${detailUrl}`;
    const res = await fetch(
      `https://private-zillow.p.rapidapi.com/byurl?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "x-rapidapi-key":  KEY,
          "x-rapidapi-host": "private-zillow.p.rapidapi.com",
        },
        next: { revalidate: 86400 },
      }
    );
    const json = await res.json();
    const yr = parseInt(json?.yearBuilt);
    return isNaN(yr) ? null : yr;
  } catch {
    return null;
  }
}

function lotSqft(value: number, unit: string): number {
  if (!value) return 0;
  if (unit === "sqft") return Math.round(value);
  if (unit === "acres") return Math.round(value * 43560);
  return Math.round(value); // fallback assume sqft
}

function toStatus(homeStatus: string, comingSoon?: number): "active" | "coming_soon" {
  if (comingSoon && comingSoon > Date.now()) return "coming_soon";
  if (homeStatus === "COMING_SOON") return "coming_soon";
  return "active";
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

  // Step 1: Fetch all listings for all neighborhoods
  const allListings: { listing: ZillowListing; detailUrl: string; neighborhood: string }[] = [];

  const searchResults = await Promise.allSettled(
    SEARCH_LOCATIONS.map((loc) =>
      fetchListingsForLocation(loc.query).then((items) =>
        items.map((x) => ({ ...x, neighborhood: loc.neighborhood }))
      )
    )
  );

  for (const result of searchResults) {
    if (result.status === "fulfilled") {
      allListings.push(...result.value);
    }
  }

  // Step 2: Fetch yearBuilt for all listings in parallel (batches of 10)
  const BATCH_SIZE = 10;
  const yearBuiltMap: Record<string, number | null> = {};

  for (let i = 0; i < allListings.length; i += BATCH_SIZE) {
    const batch = allListings.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((x) => fetchYearBuilt(x.detailUrl).then((yr) => ({ zpid: x.listing.zpid, yr })))
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        yearBuiltMap[r.value.zpid] = r.value.yr;
      }
    }
  }

  // Step 3: Filter pre-1970 and build PropertyListing objects
  const listings: PropertyListing[] = [];

  for (const { listing: l, detailUrl, neighborhood } of allListings) {
    const yearBuilt = yearBuiltMap[l.zpid] ?? null;

    // Include if yearBuilt unknown (show all) or pre-1970
    if (yearBuilt !== null && yearBuilt > 1970) continue;
    if (!l.price || l.price <= 0) continue;

    const lot = lotSqft(l.lotAreaValue, l.lotAreaUnit);
    const typicalBuild = TYPICAL_NEW_BUILD_SQFT[neighborhood] ?? 4000;
    const newBuildSqft = lot > 0
      ? Math.min(Math.max(Math.round(lot * 0.3), 3000), typicalBuild)
      : typicalBuild;

    const propertyType: "teardown" | "lot_only" =
      (!l.livingArea || l.livingArea < 200) ? "lot_only" : "teardown";

    const status = toStatus(l.homeStatus, l.comingSoonOnMarketDate);
    const expectedDate = l.comingSoonOnMarketDate
      ? new Date(l.comingSoonOnMarketDate).toISOString().split("T")[0]
      : undefined;

    const salePricePerSqft = newConstructionPrices[neighborhood] ?? 450;
    const buildCost       = newBuildSqft * BUILD_COST_PER_SQFT * materialMultiplier;
    const demolitionCost  = propertyType === "lot_only" ? 0 : (l.livingArea ?? 0) * DEMO_COST_PER_SQFT;
    const loanBase        = (l.price + buildCost + demolitionCost) * (1 - DOWN_PAYMENT);
    const holdingCosts    = loanBase * (LOAN_RATE / 12) * TIMELINE_MONTHS;
    const expectedSale    = newBuildSqft * salePricePerSqft;
    const sellingCosts    = expectedSale * SELLING_COST_RATE;
    const totalInvestment = l.price + buildCost + demolitionCost + holdingCosts + sellingCosts;
    const profit          = expectedSale - totalInvestment;
    const roi             = (profit / (totalInvestment - sellingCosts)) * 100;

    const zip = l.zipcode ?? ZIP_TO_NEIGHBORHOOD[l.zipcode ?? ""] ?? "22101";

    listings.push({
      id:           `zpid-${l.zpid}`,
      address:      l.streetAddress ?? "Unknown",
      neighborhood,
      zip,
      yearBuilt:    yearBuilt ?? 0,
      listPrice:    l.price,
      lotSqft:      lot,
      existingSqft: l.livingArea ?? 0,
      newBuildSqft,
      beds:         l.bedrooms ?? 0,
      baths:        l.bathrooms ?? 0,
      propertyType,
      status,
      listedDate:   undefined,
      expectedDate,
      daysOnMarket: l.daysOnZillow ?? 0,
      demolitionCost,
      buildCost,
      holdingCosts,
      expectedSale,
      sellingCosts,
      totalInvestment,
      profit,
      roi,
      newConstructionPricePerSqft: salePricePerSqft,
      detailUrl: detailUrl.startsWith("http") ? detailUrl : `https://www.zillow.com${detailUrl}`,
    });
  }

  listings.sort((a, b) => b.roi - a.roi);

  return {
    listings,
    dataNote: `Live Zillow data · ${listings.length} properties · Pre-1970 homes & lots · Updated daily`,
  };
}
