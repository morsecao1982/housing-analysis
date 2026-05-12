"use client";

import { useState } from "react";
import { ProfitInputs } from "@/types/housing";
import { calculateProfit, formatCurrency, formatPercent } from "@/lib/calculations";
import { BUILD_COST_RANGES } from "@/lib/constants";

interface Props {
  neighborhoods: { name: string; medianHomeValue: number }[];
  materialMultiplier: number;
  defaultRate: number;
}

const DEFAULT_INPUTS: ProfitInputs = {
  neighborhood: "McLean",
  lotPrice: 800000,
  houseSqft: 4000,
  quality: "premium",
  timelineMonths: 18,
  downPaymentPercent: 25,
  loanInterestRate: 7.5,
};

function CostRow({ label, value, highlight = false, sub = false }: {
  label: string; value: number; highlight?: boolean; sub?: boolean;
}) {
  return (
    <div className={`flex justify-between py-1.5 ${sub ? "pl-4 text-gray-400" : ""} ${highlight ? "border-t border-white/10 mt-1 pt-2.5 text-white font-bold" : ""}`}>
      <span className={sub ? "text-xs" : "text-sm"}>{label}</span>
      <span className={`tabular-nums ${sub ? "text-xs" : "text-sm"} ${highlight ? "text-white" : "text-gray-300"}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export default function ProfitCalculator({ neighborhoods, materialMultiplier, defaultRate }: Props) {
  const [inputs, setInputs] = useState<ProfitInputs>({
    ...DEFAULT_INPUTS,
    loanInterestRate: defaultRate || 7.5,
    neighborhood: neighborhoods[0]?.name ?? "McLean",
  });

  const neighborhood = neighborhoods.find((n) => n.name === inputs.neighborhood);
  const medianPricePerSqft = neighborhood ? neighborhood.medianHomeValue / 2500 : 500;
  const result = calculateProfit(inputs, medianPricePerSqft, materialMultiplier);

  const isProfit = result.estimatedProfit > 0;

  function update<K extends keyof ProfitInputs>(key: K, value: ProfitInputs[K]) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="bg-gray-900 rounded-2xl border border-white/10 p-6">
      <h2 className="text-white font-bold text-xl mb-1">Profit Calculator</h2>
      <p className="text-gray-500 text-sm mb-6">
        Build cost auto-adjusted for current material prices and DC metro labor premium
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-1.5">
              Target Neighborhood
            </label>
            <select
              value={inputs.neighborhood}
              onChange={(e) => update("neighborhood", e.target.value)}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              {neighborhoods.map((n) => (
                <option key={n.name} value={n.name}>{n.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-1.5">
              Lot Purchase Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={inputs.lotPrice}
                onChange={(e) => update("lotPrice", Number(e.target.value))}
                className="w-full bg-gray-800 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-1.5">
              House Size (sqft)
            </label>
            <input
              type="number"
              value={inputs.houseSqft}
              onChange={(e) => update("houseSqft", Number(e.target.value))}
              className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-1.5">
              Construction Quality
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["standard", "premium", "luxury"] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => update("quality", q)}
                  className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                    inputs.quality === q
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-gray-800 border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <div>{BUILD_COST_RANGES[q].label}</div>
                  <div className="text-gray-400 font-normal text-xs mt-0.5">
                    ${BUILD_COST_RANGES[q].min}–{BUILD_COST_RANGES[q].max}/sqft
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-1.5">
                Timeline (months)
              </label>
              <input
                type="number"
                value={inputs.timelineMonths}
                onChange={(e) => update("timelineMonths", Number(e.target.value))}
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-1.5">
                Loan Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={inputs.loanInterestRate}
                onChange={(e) => update("loanInterestRate", Number(e.target.value))}
                className="w-full bg-gray-800 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-gray-400 text-xs font-medium uppercase tracking-wider block mb-1.5">
              Down Payment: {inputs.downPaymentPercent}%
            </label>
            <input
              type="range"
              min={10}
              max={100}
              value={inputs.downPaymentPercent}
              onChange={(e) => update("downPaymentPercent", Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>

        {/* Results */}
        <div>
          {/* Summary */}
          <div className={`rounded-2xl p-5 mb-4 border ${
            isProfit
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}>
            <div className="text-gray-400 text-sm mb-1">Estimated Profit</div>
            <div className={`text-4xl font-bold mb-1 ${isProfit ? "text-green-400" : "text-red-400"}`}>
              {formatCurrency(result.estimatedProfit)}
            </div>
            <div className="flex gap-4 text-sm">
              <span className={isProfit ? "text-green-400" : "text-red-400"}>
                ROI {result.roi.toFixed(1)}%
              </span>
              <span className="text-gray-400">
                Break-even: {formatCurrency(result.breakEvenPrice)}
              </span>
            </div>
            <div className="text-gray-400 text-xs mt-1">
              Expected sale: {formatCurrency(result.expectedSalePrice)} ·{" "}
              All-in cost/sqft: {formatCurrency(result.costPerSqft)}/sqft
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-gray-800/50 rounded-xl p-4">
            <div className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-2">Cost Breakdown</div>
            <CostRow label="Lot Purchase" value={result.lotCost} />
            <CostRow label="Construction (base)" value={result.baseBuildCost} sub />
            <CostRow label={`Material adjustment (×${materialMultiplier.toFixed(3)})`} value={result.adjustedBuildCost - result.baseBuildCost} sub />
            <CostRow label="DC Metro premium (×1.08)" value={result.adjustedBuildCost - result.baseBuildCost * 1.0} sub />
            <CostRow label="Architect / Design (10%)" value={result.architectFees} sub />
            <CostRow label="Permits (Fairfax County)" value={result.permitFees} sub />
            <CostRow label="Site Prep & Utilities" value={result.sitePrepCost} sub />
            <CostRow label="Landscaping" value={result.landscapingCost} sub />
            <CostRow label="Contingency (10%)" value={result.contingency} sub />
            <CostRow label="Holding Costs" value={result.holdingCosts} sub />
            <CostRow label="Selling Costs (5.5% + 1.5%)" value={result.sellingCosts} sub />
            <CostRow label="Total Investment" value={result.totalInvestment} highlight />
          </div>
        </div>
      </div>
    </div>
  );
}
