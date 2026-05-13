"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { NeighborhoodData } from "@/types/housing";
import {
  NEW_CONSTRUCTION_PRICE_SQFT,
  TYPICAL_NEW_BUILD_SQFT,
  TYPICAL_EXISTING_SQFT,
  DC_METRO_CCI,
} from "@/lib/constants";

interface Props {
  neighborhoods: NeighborhoodData[];
  materialMultiplier: number;
}

const ALL_IN_BUILD_COST_SQFT = 420; // premium all-in per sqft

function fmt(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`;
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export default function NewConstructionTab({ neighborhoods, materialMultiplier }: Props) {
  const rows = neighborhoods.map((n) => {
    const newSalePriceSqft = NEW_CONSTRUCTION_PRICE_SQFT[n.name] ?? 700;
    const newBuildSqft     = TYPICAL_NEW_BUILD_SQFT[n.name] ?? 4000;
    const existingSqft     = TYPICAL_EXISTING_SQFT[n.name] ?? 2000;
    const buildCost        = newBuildSqft * ALL_IN_BUILD_COST_SQFT * materialMultiplier * DC_METRO_CCI;
    const demolitionCost   = existingSqft * 10;
    const expectedSale     = newBuildSqft * newSalePriceSqft;
    const grossMargin      = expectedSale - buildCost - demolitionCost;
    const grossMarginPct   = (grossMargin / (buildCost + demolitionCost)) * 100;
    const medianSqftPrice  = n.medianHomeValue / 2500;
    const newConstrPremium = ((newSalePriceSqft - medianSqftPrice) / medianSqftPrice) * 100;

    return {
      name: n.name,
      medianValue: n.medianHomeValue,
      medianSqftPrice: Math.round(medianSqftPrice),
      newSalePriceSqft,
      newBuildSqft,
      buildCost,
      demolitionCost,
      expectedSale,
      grossMargin,
      grossMarginPct,
      newConstrPremium,
      yoy: n.medianHomeValueChange12Mo,
    };
  });

  const chartData = rows.map((r) => ({
    name: r.name.replace("Falls Church", "Falls Ch."),
    "Median $/sqft": r.medianSqftPrice,
    "New Build $/sqft": r.newSalePriceSqft,
    "Build Cost $/sqft": Math.round(ALL_IN_BUILD_COST_SQFT * materialMultiplier * DC_METRO_CCI),
  }));

  const salesData = rows.map((r) => ({
    name: r.name.replace("Falls Church", "Falls Ch."),
    "Expected Sale": Math.round(r.expectedSale / 1000),
    "Total Build Cost": Math.round((r.buildCost + r.demolitionCost) / 1000),
  }));

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Avg New Build Sale/sqft", value: `$${Math.round(Object.values(NEW_CONSTRUCTION_PRICE_SQFT).reduce((a, b) => a + b, 0) / 5)}/sf`, color: "text-blue-600" },
          { label: "DC Metro CCI Premium", value: `${((DC_METRO_CCI - 1) * 100).toFixed(0)}% above national`, color: "text-amber-600" },
          { label: "Material Cost Shift", value: `${materialMultiplier >= 1 ? "+" : ""}${((materialMultiplier - 1) * 100).toFixed(1)}%`, color: materialMultiplier >= 1 ? "text-red-600" : "text-green-600" },
          { label: "All-in Build Cost/sqft", value: `$${Math.round(ALL_IN_BUILD_COST_SQFT * materialMultiplier * DC_METRO_CCI)}/sf`, color: "text-slate-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price per sqft comparison */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-slate-800 font-bold mb-1">Price Per Sqft Comparison</div>
          <div className="text-slate-400 text-xs mb-4">Median resale vs. new construction vs. build cost</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [`$${v}/sqft`]}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Median $/sqft"     fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="New Build $/sqft"  fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Build Cost $/sqft" fill="#fca5a5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expected sale vs build cost */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="text-slate-800 font-bold mb-1">Expected Sale vs. Total Build Cost</div>
          <div className="text-slate-400 text-xs mb-4">Values in $000s · gap = gross margin before land</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={(v) => `$${v}K`} />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [`$${v}K`]}
              />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar dataKey="Expected Sale"    fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Total Build Cost" fill="#fca5a5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-neighborhood breakdown table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="text-slate-800 font-bold">New Construction Analysis by Neighborhood</div>
          <div className="text-slate-400 text-xs mt-0.5">Assumes typical teardown lot · Premium build quality · 18-month timeline</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                {["Neighborhood", "Median Home Value", "New Build $/sqft", "New Constr. Premium", "Typical Build Size", "Est. Build Cost", "Est. Sale Price", "Gross Margin"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isPositive = r.grossMarginPct > 0;
                return (
                  <tr key={r.name} className={`border-t border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-semibold text-sm">{r.name}</div>
                      <div className="text-slate-400 text-xs">{pct(r.yoy)} YoY market</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-sm font-medium tabular-nums">{fmt(r.medianValue)}</td>
                    <td className="px-4 py-3 text-slate-700 text-sm tabular-nums">${r.newSalePriceSqft}/sf</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${r.newConstrPremium > 0 ? "text-green-600" : "text-red-600"}`}>
                        {pct(r.newConstrPremium)}
                      </span>
                      <div className="text-slate-400 text-xs">vs median $/sqft</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-sm tabular-nums">{r.newBuildSqft.toLocaleString()} sqft</td>
                    <td className="px-4 py-3 text-slate-700 text-sm tabular-nums">{fmt(r.buildCost + r.demolitionCost)}</td>
                    <td className="px-4 py-3 text-slate-700 text-sm font-medium tabular-nums">{fmt(r.expectedSale)}</td>
                    <td className="px-4 py-3">
                      <div className={`text-sm font-bold tabular-nums ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                        {fmt(r.grossMargin)}
                      </div>
                      <div className={`text-xs ${isPositive ? "text-emerald-500" : "text-red-400"}`}>
                        {pct(r.grossMarginPct)} margin
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-700">
          Gross margin excludes land/lot cost, holding costs, and selling costs. See profit calculator for full analysis including those factors.
        </div>
      </div>
    </div>
  );
}
