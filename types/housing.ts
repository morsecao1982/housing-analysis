export interface Neighborhood {
  name: string;
  zipCodes: string[];
  county: string;
}

export interface NeighborhoodData {
  name: string;
  zipCode: string;
  medianHomeValue: number;
  medianHomeValueChange1Mo: number;
  medianHomeValueChange12Mo: number;
  priceHistory: { date: string; value: number }[];
}

export interface MaterialIndex {
  name: string;
  seriesId: string;
  currentValue: number;
  baselineValue: number;
  changePercent: number;
  history: { date: string; value: number }[];
  weight: number; // % of total build cost
}

export interface MortgageRate {
  product: string;
  rate: number;
  apr: number;
  type: string;
}

export interface MarketData {
  neighborhoods: NeighborhoodData[];
  materials: MaterialIndex[];
  mortgageRates: MortgageRate[];
  materialCostMultiplier: number;
  updatedAt: string;
}

export interface ProfitInputs {
  neighborhood: string;
  lotPrice: number;
  houseSqft: number;
  quality: "standard" | "premium" | "luxury";
  timelineMonths: number;
  downPaymentPercent: number;
  loanInterestRate: number;
}

export interface ProfitResult {
  lotCost: number;
  baseBuildCost: number;
  adjustedBuildCost: number;
  architectFees: number;
  permitFees: number;
  sitePrepCost: number;
  landscapingCost: number;
  contingency: number;
  holdingCosts: number;
  sellingCosts: number;
  totalInvestment: number;
  expectedSalePrice: number;
  estimatedProfit: number;
  roi: number;
  breakEvenPrice: number;
  costPerSqft: number;
}
