"use client";

import { useState } from "react";
import { ProfitInputs } from "@/types/housing";
import { calculateProfit, formatCurrency } from "@/lib/calculations";
import { BUILD_COST_RANGES } from "@/lib/constants";
import { roiColor } from "./ProfitBadge";

interface Props {
  neighborhoods: { name: string; medianHomeValue: number }[];
  materialMultiplier: number;
  defaultRate: number;
}

const DEFAULT_INPUTS: ProfitInputs = {
  neighborhood: "McLean",
  lotPrice: 1100000,
  houseSqft: 4500,
  quality: "premium",
  timelineMonths: 18,
  downPaymentPercent: 25,
  loanInterestRate: 7.5,
};

function Row({ label, value, sub, total }: { label: string; value: number; sub?: boolean; total?: boolean }) {
  return (
    <div className={`flex justify-between py-1.5 ${sub ? "pl-4" : ""} ${total ? "border-t border-white/10 mt-1 pt-2" : ""}`}>
      <span className={`text-sm ${sub ? "text-slate-500 text-xs" : total ? "text-white font-semibold" : "text-slate-400"}`}>{label}</span>
      <span className={`tabular-nums ${sub ? "text-slate-400 text-xs" : total ? "text-white font-bold" : "text-slate-200 text-sm"}`}>{formatCurrency(value)}</span>
    </div>
  );
}

export default function ProfitCalculator({ neighborhoods, materialMultiplier, defaultRate }: Props) {
  const [inputs, setInputs] = useState<ProfitInputs>({
    ...DEFAULT_INPUTS,
    loanInterestRate: defaultRate || 7.5,
    neighborhood: neighborhoods[0]?.name ?? "McLean",
  });

  const hood = neighborhoods.find((n) => n.name === inputs.neighborhood);
  const medianPricePerSqft = hood ? hood.medianHomeValue / 2500 : 500;
  const result = calculateProfit(inputs, medianPricePerSqft, materialMultiplier);
  const c = roiColor(result.roi);

  function set<K extends keyof ProfitInputs>(key: K, value: ProfitInputs[K]) {
    setInputs((p) => ({ ...p, [key]: value }));
  }

  return (
    <div className="bg-[#0D1825] rounded-2xl border border-white/5 p-6">
      <div className="mb-6">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Build Analysis</div>
        <div className="text-white font-bold text-lg">Profit Calculator</div>
        <div className="text-slate-500 text-xs mt-0.5">Costs auto-adjusted for BLS material index · DC Metro CCI 1.08×</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Neighborhood</label>
            <select
              value={inputs.neighborhood}
              onChange={(e) => set("neighborhood", e.target.value)}
              className="w-full bg-[#162535] border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/40"
            >
              {neighborhoods.map((n) => <option key={n.name} value={n.name}>{n.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Lot / Property Purchase Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input type="number" value={inputs.lotPrice} onChange={(e) => set("lotPrice", Number(e.target.value))}
                className="w-full bg-[#162535] border border-white/5 rounded-xl pl-7 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/40" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">New Build Size (sqft)</label>
            <input type="number" value={inputs.houseSqft} onChange={(e) => set("houseSqft", Number(e.target.value))}
              className="w-full bg-[#162535] border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/40" />
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-2">Construction Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {(["standard", "premium", "luxury"] as const).map((q) => (
                <button key={q} onClick={() => set("quality", q)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    inputs.quality === q
                      ? "bg-amber-400/15 border-amber-400/40 text-amber-400"
                      : "bg-[#162535] border-white/5 text-slate-400 hover:border-white/10"
                  }`}
                >
                  <div>{BUILD_COST_RANGES[q].label}</div>
                  <div className="opacity-60 font-normal mt-0.5">${BUILD_COST_RANGES[q].min}–{BUILD_COST_RANGES[q].max}/sf</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Timeline (months)</label>
              <input type="number" value={inputs.timelineMonths} onChange={(e) => set("timelineMonths", Number(e.target.value))}
                className="w-full bg-[#162535] border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/40" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Loan Rate (%)</label>
              <input type="number" step="0.1" value={inputs.loanInterestRate} onChange={(e) => set("loanInterestRate", Number(e.target.value))}
                className="w-full bg-[#162535] border border-white/5 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400/40" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 uppercase tracking-wider mb-1.5">Down Payment: {inputs.downPaymentPercent}%</label>
            <input type="range" min={10} max={100} value={inputs.downPaymentPercent}
              onChange={(e) => set("downPaymentPercent", Number(e.target.value))}
              className="w-full accent-amber-400" />
          </div>
        </div>

        {/* Results */}
        <div>
          {/* Summary card */}
          <div className={`rounded-2xl border p-5 mb-4 ${c.bg} ${c.border}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">{c.label}</div>
                <div className={`text-4xl font-bold mt-1 ${c.text}`}>
                  {result.estimatedProfit >= 0 ? "+" : ""}{formatCurrency(result.estimatedProfit)}
                </div>
              </div>
              <div className={`text-right px-3 py-2 rounded-xl ${c.bg} border ${c.border}`}>
                <div className={`text-2xl font-bold ${c.text}`}>{result.roi.toFixed(1)}%</div>
                <div className="text-xs text-slate-500">ROI</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-slate-500">Expected Sale</span><div className="text-slate-200 font-medium tabular-nums">{formatCurrency(result.expectedSalePrice)}</div></div>
              <div><span className="text-slate-500">Break-even</span><div className="text-slate-200 font-medium tabular-nums">{formatCurrency(result.breakEvenPrice)}</div></div>
              <div><span className="text-slate-500">All-in/sqft</span><div className="text-slate-200 font-medium tabular-nums">{formatCurrency(result.costPerSqft)}/sf</div></div>
              <div><span className="text-slate-500">Sale/sqft</span><div className="text-slate-200 font-medium tabular-nums">{formatCurrency(result.expectedSalePrice / inputs.houseSqft)}/sf</div></div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-[#121E2E] rounded-xl border border-white/5 px-4 py-3">
            <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">Cost Breakdown</div>
            <Row label="Lot Purchase" value={result.lotCost} />
            <Row label="Construction (base)" value={result.baseBuildCost} sub />
            <Row label={`Material adj. (×${materialMultiplier.toFixed(3)})`} value={result.adjustedBuildCost - result.baseBuildCost} sub />
            <Row label="Architect / Design" value={result.architectFees} sub />
            <Row label="Permits (Fairfax Co.)" value={result.permitFees} sub />
            <Row label="Site Prep & Utilities" value={result.sitePrepCost} sub />
            <Row label="Landscaping" value={result.landscapingCost} sub />
            <Row label="Contingency (10%)" value={result.contingency} sub />
            <Row label="Holding Costs" value={result.holdingCosts} sub />
            <Row label="Selling (5.5% + 1.5%)" value={result.sellingCosts} sub />
            <Row label="Total Investment" value={result.totalInvestment} total />
          </div>
        </div>
      </div>
    </div>
  );
}
