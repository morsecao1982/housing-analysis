import { ProfitInputs, ProfitResult } from "@/types/housing";
import { BUILD_COST_RANGES, SOFT_COSTS, SELLING_COSTS, DC_METRO_CCI } from "./constants";

export function calculateProfit(
  inputs: ProfitInputs,
  medianPricePerSqft: number,
  materialMultiplier: number
): ProfitResult {
  const range = BUILD_COST_RANGES[inputs.quality];
  const midCostPerSqft = (range.min + range.max) / 2;

  // Build cost adjusted for material index and DC metro CCI
  const baseBuildCost = midCostPerSqft * inputs.houseSqft;
  const adjustedBuildCost = baseBuildCost * materialMultiplier * DC_METRO_CCI;

  // Soft costs
  const architectFees = adjustedBuildCost * SOFT_COSTS.architectFeePercent;
  const permitFees = SOFT_COSTS.permitFeeBase + inputs.houseSqft * 3; // $3/sqft variable
  const sitePrepCost = SOFT_COSTS.sitePrepBase;
  const landscapingCost = SOFT_COSTS.landscapingBase;
  const contingency = adjustedBuildCost * SOFT_COSTS.contingencyPercent;

  // Holding costs (interest on construction loan)
  const loanAmount = (inputs.lotPrice + adjustedBuildCost) * (1 - inputs.downPaymentPercent / 100);
  const monthlyRate = inputs.loanInterestRate / 100 / 12;
  const holdingCosts = loanAmount * monthlyRate * inputs.timelineMonths;

  // Expected sale price from market comps
  const expectedSalePrice = medianPricePerSqft * inputs.houseSqft;

  // Selling costs
  const sellingCosts =
    expectedSalePrice * SELLING_COSTS.realtorCommissionPercent +
    expectedSalePrice * SELLING_COSTS.closingCostPercent;

  const totalInvestment =
    inputs.lotPrice +
    adjustedBuildCost +
    architectFees +
    permitFees +
    sitePrepCost +
    landscapingCost +
    contingency +
    holdingCosts +
    sellingCosts;

  const estimatedProfit = expectedSalePrice - totalInvestment;
  const roi = (estimatedProfit / (totalInvestment - sellingCosts)) * 100;
  const breakEvenPrice = totalInvestment;
  const costPerSqft = (totalInvestment - sellingCosts) / inputs.houseSqft;

  return {
    lotCost: inputs.lotPrice,
    baseBuildCost,
    adjustedBuildCost,
    architectFees,
    permitFees,
    sitePrepCost,
    landscapingCost,
    contingency,
    holdingCosts,
    sellingCosts,
    totalInvestment,
    expectedSalePrice,
    estimatedProfit,
    roi,
    breakEvenPrice,
    costPerSqft,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}
