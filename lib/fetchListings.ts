import { PropertyListing } from "@/types/housing";
import { TYPICAL_NEW_BUILD_SQFT } from "./constants";

// Fallback hardcoded prices (used only when market data unavailable)
const FALLBACK_PRICE: Record<string, number> = {
  McLean: 550, "Great Falls": 480, Vienna: 420, "Falls Church": 420, Tysons: 460,
};

export function deriveNewConstructionPrices(
  neighborhoods: { name: string; newConstructionValue: number }[]
): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const n of neighborhoods) {
    const typicalSqft = TYPICAL_NEW_BUILD_SQFT[n.name];
    if (n.newConstructionValue > 0 && typicalSqft > 0) {
      // Top-tier ZHVI ÷ typical new build sqft = implied $/sqft for premium new builds
      prices[n.name] = Math.round(n.newConstructionValue / typicalSqft);
    } else {
      prices[n.name] = FALLBACK_PRICE[n.name] ?? 450;
    }
  }
  return prices;
}

const BUILD_COST_PER_SQFT = 420;
const DEMO_COST_PER_SQFT  = 10;
const LOAN_RATE           = 0.075;
const TIMELINE_MONTHS     = 18;
const DOWN_PAYMENT        = 0.25;
const SELLING_COST_RATE   = 0.065;

type RawListing = {
  id: string; address: string; neighborhood: string; zip: string;
  yearBuilt: number; listPrice: number; lotSqft: number;
  existingSqft: number; newBuildSqft: number;
  beds: number; baths: number;
  propertyType: "teardown" | "lot_only";
  status: "active" | "coming_soon" | "pending";
  listedDate?: string; expectedDate?: string; daysOnMarket: number;
};

const RAW_LISTINGS: RawListing[] = [
  // ── McLean teardowns ──────────────────────────────────────────────────────
  { id: "mcl-001", address: "7234 Old Dominion Dr",    neighborhood: "McLean",       zip: "22101", yearBuilt: 1959, listPrice: 1250000, lotSqft: 15000, existingSqft: 2100, newBuildSqft: 4500, beds: 3, baths: 2.0, propertyType: "teardown",  status: "active",      listedDate: "2026-04-15", daysOnMarket: 27 },
  { id: "mcl-002", address: "1823 Chain Bridge Rd",    neighborhood: "McLean",       zip: "22101", yearBuilt: 1947, listPrice: 1100000, lotSqft: 18500, existingSqft: 1800, newBuildSqft: 5000, beds: 3, baths: 1.5, propertyType: "teardown",  status: "active",      listedDate: "2026-03-28", daysOnMarket: 45 },
  { id: "mcl-003", address: "8231 Lewinsville Rd",     neighborhood: "McLean",       zip: "22102", yearBuilt: 1955, listPrice: 1450000, lotSqft: 22000, existingSqft: 2800, newBuildSqft: 5500, beds: 4, baths: 2.5, propertyType: "teardown",  status: "active",      listedDate: "2026-04-22", daysOnMarket: 20 },
  { id: "mcl-004", address: "6912 Georgetown Pike",    neighborhood: "McLean",       zip: "22101", yearBuilt: 1963, listPrice: 1600000, lotSqft: 28000, existingSqft: 3200, newBuildSqft: 6200, beds: 4, baths: 3.0, propertyType: "teardown",  status: "coming_soon", expectedDate: "2026-05-20", daysOnMarket: 0 },
  { id: "mcl-005", address: "7801 Westwood Rd",        neighborhood: "McLean",       zip: "22101", yearBuilt: 1950, listPrice:  980000, lotSqft: 12000, existingSqft: 1600, newBuildSqft: 4200, beds: 3, baths: 1.5, propertyType: "teardown",  status: "active",      listedDate: "2026-04-01", daysOnMarket: 41 },
  { id: "mcl-006", address: "8445 Old Courthouse Rd",  neighborhood: "McLean",       zip: "22102", yearBuilt: 1968, listPrice: 1350000, lotSqft: 14000, existingSqft: 2400, newBuildSqft: 4800, beds: 4, baths: 2.0, propertyType: "teardown",  status: "coming_soon", expectedDate: "2026-05-28", daysOnMarket: 0 },
  // ── McLean lots ───────────────────────────────────────────────────────────
  { id: "mcl-l01", address: "7500 Idylwood Rd",        neighborhood: "McLean",       zip: "22101", yearBuilt: 0,    listPrice:  950000, lotSqft: 13500, existingSqft: 0,    newBuildSqft: 4500, beds: 0, baths: 0,   propertyType: "lot_only",  status: "active",      listedDate: "2026-04-20", daysOnMarket: 22 },
  { id: "mcl-l02", address: "8102 Georgetown Pike",    neighborhood: "McLean",       zip: "22102", yearBuilt: 0,    listPrice: 1150000, lotSqft: 20000, existingSqft: 0,    newBuildSqft: 5500, beds: 0, baths: 0,   propertyType: "lot_only",  status: "coming_soon", expectedDate: "2026-06-05", daysOnMarket: 0 },
  // ── Great Falls teardowns ─────────────────────────────────────────────────
  { id: "grf-001", address: "9823 Georgetown Pike",    neighborhood: "Great Falls",  zip: "22066", yearBuilt: 1958, listPrice: 1050000, lotSqft: 32000, existingSqft: 2200, newBuildSqft: 5800, beds: 3, baths: 2.0, propertyType: "teardown",  status: "active",      listedDate: "2026-04-10", daysOnMarket: 32 },
  { id: "grf-002", address: "703 Walker Rd",           neighborhood: "Great Falls",  zip: "22066", yearBuilt: 1965, listPrice:  900000, lotSqft: 26000, existingSqft: 1900, newBuildSqft: 5200, beds: 3, baths: 1.5, propertyType: "teardown",  status: "active",      listedDate: "2026-03-15", daysOnMarket: 58 },
  { id: "grf-003", address: "1220 Utterback Store Rd", neighborhood: "Great Falls",  zip: "22066", yearBuilt: 1952, listPrice: 1200000, lotSqft: 43000, existingSqft: 2600, newBuildSqft: 6500, beds: 4, baths: 2.5, propertyType: "teardown",  status: "coming_soon", expectedDate: "2026-06-01", daysOnMarket: 0 },
  { id: "grf-004", address: "9601 Springvale Rd",      neighborhood: "Great Falls",  zip: "22066", yearBuilt: 1969, listPrice:  850000, lotSqft: 22000, existingSqft: 1800, newBuildSqft: 5000, beds: 3, baths: 2.0, propertyType: "teardown",  status: "active",      listedDate: "2026-04-28", daysOnMarket: 14 },
  // ── Great Falls lots ──────────────────────────────────────────────────────
  { id: "grf-l01", address: "10201 Braddock Rd",       neighborhood: "Great Falls",  zip: "22066", yearBuilt: 0,    listPrice:  750000, lotSqft: 35000, existingSqft: 0,    newBuildSqft: 6000, beds: 0, baths: 0,   propertyType: "lot_only",  status: "active",      listedDate: "2026-04-02", daysOnMarket: 40 },
  { id: "grf-l02", address: "11503 Highland Rd",       neighborhood: "Great Falls",  zip: "22066", yearBuilt: 0,    listPrice:  680000, lotSqft: 28000, existingSqft: 0,    newBuildSqft: 5500, beds: 0, baths: 0,   propertyType: "lot_only",  status: "coming_soon", expectedDate: "2026-05-18", daysOnMarket: 0 },
  // ── Vienna teardowns ──────────────────────────────────────────────────────
  { id: "vie-001", address: "312 Maple Ave W",         neighborhood: "Vienna",       zip: "22180", yearBuilt: 1960, listPrice:  750000, lotSqft:  9500, existingSqft: 1500, newBuildSqft: 3600, beds: 3, baths: 1.5, propertyType: "teardown",  status: "active",      listedDate: "2026-04-05", daysOnMarket: 37 },
  { id: "vie-002", address: "909 Yeonas Dr SW",        neighborhood: "Vienna",       zip: "22180", yearBuilt: 1955, listPrice:  820000, lotSqft: 11000, existingSqft: 1700, newBuildSqft: 4000, beds: 3, baths: 2.0, propertyType: "teardown",  status: "active",      listedDate: "2026-04-18", daysOnMarket: 24 },
  { id: "vie-003", address: "124 Park St NE",          neighborhood: "Vienna",       zip: "22180", yearBuilt: 1963, listPrice:  680000, lotSqft:  8500, existingSqft: 1400, newBuildSqft: 3400, beds: 2, baths: 1.0, propertyType: "teardown",  status: "coming_soon", expectedDate: "2026-05-15", daysOnMarket: 0 },
  { id: "vie-004", address: "315 Center St S",         neighborhood: "Vienna",       zip: "22180", yearBuilt: 1948, listPrice:  890000, lotSqft: 13500, existingSqft: 2000, newBuildSqft: 4300, beds: 4, baths: 2.0, propertyType: "teardown",  status: "active",      listedDate: "2026-03-20", daysOnMarket: 53 },
  // ── Vienna lot ────────────────────────────────────────────────────────────
  { id: "vie-l01", address: "501 Glyndon St NE",       neighborhood: "Vienna",       zip: "22180", yearBuilt: 0,    listPrice:  520000, lotSqft:  9000, existingSqft: 0,    newBuildSqft: 3800, beds: 0, baths: 0,   propertyType: "lot_only",  status: "active",      listedDate: "2026-04-29", daysOnMarket: 13 },
  // ── Falls Church teardowns ────────────────────────────────────────────────
  { id: "fch-001", address: "312 S Washington St",     neighborhood: "Falls Church", zip: "22046", yearBuilt: 1957, listPrice:  780000, lotSqft:  9500, existingSqft: 1600, newBuildSqft: 3700, beds: 3, baths: 1.5, propertyType: "teardown",  status: "active",      listedDate: "2026-04-12", daysOnMarket: 30 },
  { id: "fch-002", address: "7001 Lee Hwy",            neighborhood: "Falls Church", zip: "22046", yearBuilt: 1962, listPrice:  850000, lotSqft: 11500, existingSqft: 1900, newBuildSqft: 4100, beds: 3, baths: 2.0, propertyType: "teardown",  status: "active",      listedDate: "2026-04-25", daysOnMarket: 17 },
  { id: "fch-003", address: "2103 Pimmit Dr",          neighborhood: "Falls Church", zip: "22041", yearBuilt: 1965, listPrice:  720000, lotSqft:  8000, existingSqft: 1500, newBuildSqft: 3400, beds: 3, baths: 1.5, propertyType: "teardown",  status: "active",      listedDate: "2026-03-10", daysOnMarket: 63 },
  { id: "fch-004", address: "6821 Elm St",             neighborhood: "Falls Church", zip: "22046", yearBuilt: 1953, listPrice:  950000, lotSqft: 13000, existingSqft: 2100, newBuildSqft: 4200, beds: 4, baths: 2.0, propertyType: "teardown",  status: "coming_soon", expectedDate: "2026-05-22", daysOnMarket: 0 },
  // ── Falls Church lot ──────────────────────────────────────────────────────
  { id: "fch-l01", address: "1014 Broadmont Ter",      neighborhood: "Falls Church", zip: "22046", yearBuilt: 0,    listPrice:  480000, lotSqft:  8500, existingSqft: 0,    newBuildSqft: 3600, beds: 0, baths: 0,   propertyType: "lot_only",  status: "active",      listedDate: "2026-05-01", daysOnMarket: 11 },
  // ── Tysons teardowns ──────────────────────────────────────────────────────
  { id: "tys-001", address: "8121 Watson St",          neighborhood: "Tysons",       zip: "22182", yearBuilt: 1960, listPrice:  920000, lotSqft: 13500, existingSqft: 1900, newBuildSqft: 4200, beds: 3, baths: 2.0, propertyType: "teardown",  status: "active",      listedDate: "2026-04-08", daysOnMarket: 34 },
  { id: "tys-002", address: "1930 Gallows Rd",         neighborhood: "Tysons",       zip: "22182", yearBuilt: 1967, listPrice: 1050000, lotSqft: 15500, existingSqft: 2200, newBuildSqft: 4700, beds: 4, baths: 2.5, propertyType: "teardown",  status: "active",      listedDate: "2026-04-19", daysOnMarket: 23 },
  { id: "tys-003", address: "8901 Glade Dr",           neighborhood: "Tysons",       zip: "22182", yearBuilt: 1955, listPrice:  880000, lotSqft: 12000, existingSqft: 1800, newBuildSqft: 4000, beds: 3, baths: 1.5, propertyType: "teardown",  status: "coming_soon", expectedDate: "2026-05-30", daysOnMarket: 0 },
  { id: "tys-004", address: "9234 Brookfield Rd",      neighborhood: "Tysons",       zip: "22102", yearBuilt: 1963, listPrice:  980000, lotSqft: 14000, existingSqft: 2000, newBuildSqft: 4400, beds: 4, baths: 2.0, propertyType: "teardown",  status: "active",      listedDate: "2026-04-03", daysOnMarket: 39 },
  // ── Tysons lot ────────────────────────────────────────────────────────────
  { id: "tys-l01", address: "8344 Leesburg Pike",      neighborhood: "Tysons",       zip: "22182", yearBuilt: 0,    listPrice:  720000, lotSqft: 12500, existingSqft: 0,    newBuildSqft: 4200, beds: 0, baths: 0,   propertyType: "lot_only",  status: "active",      listedDate: "2026-04-14", daysOnMarket: 28 },
];

function calcProfit(
  listing: RawListing,
  materialMultiplier: number,
  priceMap: Record<string, number>
): PropertyListing {
  const salePricePerSqft = priceMap[listing.neighborhood] ?? FALLBACK_PRICE[listing.neighborhood] ?? 450;
  const buildCost        = listing.newBuildSqft * BUILD_COST_PER_SQFT * materialMultiplier;
  const demolitionCost   = listing.propertyType === "lot_only" ? 0 : listing.existingSqft * DEMO_COST_PER_SQFT;
  const loanBase         = (listing.listPrice + buildCost + demolitionCost) * (1 - DOWN_PAYMENT);
  const holdingCosts     = loanBase * (LOAN_RATE / 12) * TIMELINE_MONTHS;
  const expectedSale     = listing.newBuildSqft * salePricePerSqft;
  const sellingCosts     = expectedSale * SELLING_COST_RATE;
  const totalInvestment  = listing.listPrice + buildCost + demolitionCost + holdingCosts + sellingCosts;
  const profit           = expectedSale - totalInvestment;
  const roi              = (profit / (totalInvestment - sellingCosts)) * 100;
  return {
    ...listing,
    demolitionCost, buildCost, holdingCosts, expectedSale,
    sellingCosts, totalInvestment, profit, roi,
    newConstructionPricePerSqft: salePricePerSqft,
  };
}

export function fetchListings(
  materialMultiplier = 1.0,
  newConstructionPrices: Record<string, number> = {}
): { listings: PropertyListing[]; dataNote: string } {
  // Merge live market prices with fallback
  const priceMap = { ...FALLBACK_PRICE, ...newConstructionPrices };
  const listings = RAW_LISTINGS.map((l) => calcProfit(l, materialMultiplier, priceMap));
  listings.sort((a, b) => b.roi - a.roi);
  return {
    listings,
    dataNote: "Representative listings — connect MLS data provider for live inventory",
  };
}
