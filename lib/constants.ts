import { Neighborhood } from "@/types/housing";

export const NEIGHBORHOODS: Neighborhood[] = [
  { name: "McLean", zipCodes: ["22101", "22102"], county: "Fairfax" },
  { name: "Great Falls", zipCodes: ["22066"], county: "Fairfax" },
  { name: "Vienna", zipCodes: ["22180", "22181", "22182"], county: "Fairfax" },
  { name: "Falls Church", zipCodes: ["22041", "22042", "22046"], county: "Fairfax/Falls Church City" },
  { name: "Tysons", zipCodes: ["22102", "22182"], county: "Fairfax" },
];

// Primary zip per neighborhood for data lookup
export const PRIMARY_ZIPS: Record<string, string> = {
  McLean: "22101",
  "Great Falls": "22066",
  Vienna: "22180",
  "Falls Church": "22046",
  Tysons: "22182",
};

// NoVA construction costs per sqft (2026, RSMeans DC metro adjusted)
export const BUILD_COST_RANGES = {
  standard: { min: 220, max: 265, label: "Standard", desc: "Builder-grade finishes, typical subdivision home" },
  premium: { min: 290, max: 360, label: "Premium", desc: "Hardwood floors, custom kitchen, upgraded fixtures" },
  luxury: { min: 400, max: 550, label: "Luxury", desc: "High-end custom design, premium everything" },
};

// NoVA-specific soft costs
export const SOFT_COSTS = {
  architectFeePercent: 0.10,        // 10% of build cost
  permitFeeBase: 22000,             // Fairfax County avg permit fee
  sitePrepBase: 30000,              // Site clearing, grading, utility hookups
  landscapingBase: 20000,           // Basic landscaping
  contingencyPercent: 0.10,         // 10% contingency buffer
};

// Selling costs
export const SELLING_COSTS = {
  realtorCommissionPercent: 0.055,  // 5.5% total commission
  closingCostPercent: 0.015,        // 1.5% seller closing costs
};

// RSMeans City Cost Index for DC metro (vs national average = 1.0)
export const DC_METRO_CCI = 1.08;

// BLS PPI series for construction materials
export const PPI_SERIES = [
  { id: "WPU081",   name: "Lumber & Wood",    weight: 0.18 },
  { id: "WPU1321",  name: "Concrete",         weight: 0.12 },
  { id: "WPU101",   name: "Steel & Iron",     weight: 0.10 },
  { id: "WPU102202",name: "Copper / Wiring",  weight: 0.08 },
  { id: "WPU1322A", name: "Drywall",          weight: 0.07 },
  { id: "WPU1311",  name: "Roofing",          weight: 0.08 },
];

// Lot price as % of finished home value (NoVA market estimate)
export const LOT_VALUE_RATIO = { min: 0.20, max: 0.35 };

// Zillow Research CSV URLs
export const ZILLOW_ZHVI_URL =
  "https://files.zillowstatic.com/research/public_csvs/zhvi/Zip_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";

// New construction sale price per sqft by neighborhood (NoVA 2026, custom builds)
export const NEW_CONSTRUCTION_PRICE_SQFT: Record<string, number> = {
  McLean: 920,
  "Great Falls": 820,
  Vienna: 700,
  "Falls Church": 710,
  Tysons: 780,
};

// Typical new build sqft for teardown projects by neighborhood
export const TYPICAL_NEW_BUILD_SQFT: Record<string, number> = {
  McLean: 5000,
  "Great Falls": 5500,
  Vienna: 4000,
  "Falls Church": 4000,
  Tysons: 4500,
};

// Typical existing home sqft (for demo cost estimate) by neighborhood
export const TYPICAL_EXISTING_SQFT: Record<string, number> = {
  McLean: 2200,
  "Great Falls": 2400,
  Vienna: 1700,
  "Falls Church": 1800,
  Tysons: 2000,
};
