import { PropertyListing } from "@/types/housing";
import { TYPICAL_NEW_BUILD_SQFT } from "./constants";

const KEY = process.env.RAPIDAPI_KEY ?? "";

const SEARCH_LOCATIONS = [
  { query: "McLean VA",       neighborhood: "McLean"       },
  { query: "Great Falls VA",  neighborhood: "Great Falls"  },
  { query: "Vienna VA",       neighborhood: "Vienna"       },
  { query: "Falls Church VA", neighborhood: "Falls Church" },
  { query: "Tysons VA",       neighborhood: "Tysons"       },
];

interface ZillowSearchListing {
  zpid: number;
  detailUrl: string;
  beds: number;
  baths: number;
  area: number;                    // living area sqft
  isPaidBuilderNewConstruction: boolean;
  hdpData: {
    homeInfo: {
      streetAddress: string;
      zipcode: string;
      price: number;
      bathrooms: number;
      bedrooms: number;
      livingArea: number;
      homeStatus: string;
      daysOnZillow: number;
      lotAreaValue: number;
      lotAreaUnit: string;
      comingSoonOnMarketDate?: number;
      zestimate?: number;
    };
  };
}

async function searchListings(query: string): Promise<ZillowSearchListing[]> {
  const res = await fetch(
    `https://real-estate-zillow-com.p.rapidapi.com/v1/search/sale?location_or_rid=${encodeURIComponent(query)}&property_types=house&page=1`,
    {
      headers: {
        "x-rapidapi-key":  KEY,
        "x-rapidapi-host": "real-estate-zillow-com.p.rapidapi.com",
      },
      next: { revalidate: 604800 },
    }
  );
  if (!res.ok) return [];
  const json = await res.json();
  return json?.data?.listings ?? [];
}

function lotToSqft(value: number, unit: string): number {
  if (!value || value <= 0) return 0;
  if (unit === "acres") return Math.round(value * 43560);
  return Math.round(value);
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

  // Fetch all neighborhoods in parallel — only 5 API calls total
  const results = await Promise.allSettled(
    SEARCH_LOCATIONS.map((loc) =>
      searchListings(loc.query).then((items) =>
        items.map((item) => ({ item, neighborhood: loc.neighborhood }))
      )
    )
  );

  const listings: PropertyListing[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;

    for (const { item, neighborhood } of result.value) {
      const h = item.hdpData?.homeInfo;
      if (!h || !h.price || h.price <= 0) continue;

      // Skip confirmed new builder construction
      if (item.isPaidBuilderNewConstruction) continue;

      const lot          = lotToSqft(h.lotAreaValue, h.lotAreaUnit);
      const typicalBuild = TYPICAL_NEW_BUILD_SQFT[neighborhood] ?? 4000;
      const newBuildSqft = lot > 0
        ? Math.min(Math.max(Math.round(lot * 0.3), 3000), typicalBuild)
        : typicalBuild;

      const propertyType: "teardown" | "lot_only" =
        (!h.livingArea || h.livingArea < 200) ? "lot_only" : "teardown";

      const isComing = h.homeStatus === "COMING_SOON" ||
        (h.comingSoonOnMarketDate != null && h.comingSoonOnMarketDate > Date.now());
      const status: "active" | "coming_soon" = isComing ? "coming_soon" : "active";
      const expectedDate = h.comingSoonOnMarketDate
        ? new Date(h.comingSoonOnMarketDate).toISOString().split("T")[0]
        : undefined;

      const salePricePerSqft = newConstructionPrices[neighborhood] ?? 450;
      const buildCost        = newBuildSqft * BUILD_COST_PER_SQFT * materialMultiplier;
      const demolitionCost   = propertyType === "lot_only" ? 0 : (h.livingArea ?? 0) * DEMO_COST_PER_SQFT;
      const loanBase         = (h.price + buildCost + demolitionCost) * (1 - DOWN_PAYMENT);
      const holdingCosts     = loanBase * (LOAN_RATE / 12) * TIMELINE_MONTHS;
      const expectedSale     = newBuildSqft * salePricePerSqft;
      const sellingCosts     = expectedSale * SELLING_COST_RATE;
      const totalInvestment  = h.price + buildCost + demolitionCost + holdingCosts + sellingCosts;
      const profit           = expectedSale - totalInvestment;
      const roi              = (profit / (totalInvestment - sellingCosts)) * 100;

      const detailUrl = item.detailUrl.startsWith("http")
        ? item.detailUrl
        : `https://www.zillow.com${item.detailUrl}`;

      listings.push({
        id:           `zpid-${item.zpid}`,
        address:      h.streetAddress,
        neighborhood,
        zip:          h.zipcode,
        yearBuilt:    0,           // not available from search API
        listPrice:    h.price,
        lotSqft:      lot,
        existingSqft: h.livingArea ?? 0,
        newBuildSqft,
        beds:         h.bedrooms ?? 0,
        baths:        h.bathrooms ?? 0,
        propertyType,
        status,
        expectedDate,
        daysOnMarket: h.daysOnZillow ?? 0,
        demolitionCost,
        buildCost,
        holdingCosts,
        expectedSale,
        sellingCosts,
        totalInvestment,
        profit,
        roi,
        newConstructionPricePerSqft: salePricePerSqft,
        detailUrl,
      });
    }
  }

  listings.sort((a, b) => b.roi - a.roi);

  return {
    listings,
    dataNote: "Live Zillow data via RapidAPI · Year built unavailable from search API — click Zillow ↗ to verify · Updated daily",
  };
}
