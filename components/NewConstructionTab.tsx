"use client";

import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid,
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

  // Build combined trend dataset: all neighborhoods on one timeline
  const allDates = neighborhoods[0]?.newConstructionHistory.map((h) => h.date) ?? [];
  const combinedTrend = allDates.map((date) => {
    const point: Record<string, string | number> = { date: date.slice(0, 7) }; // YYYY-MM
    neighborhoods.forEach((n) => {
      const match = n.newConstructionHistory.find((h) => h.date === date);
      if (match) point[n.name] = Math.round(match.value / 1000) / 1000; // $M
    });
    return point;
  });

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];

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

      {/* New Construction Price Trends */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-slate-800 font-bold text-base">New Construction Price Trend</div>
            <div className="text-slate-400 text-xs mt-0.5">
              Top-tier home values (upper 33%) · 24-month history · Source: Zillow Research
            </div>
          </div>
          <span className="text-xs px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 font-medium">
            All Neighborhoods
          </span>
        </div>

        <div className="mt-4 mb-6">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={combinedTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickFormatter={(v) => {
                  const [y, m] = (v as string).split("-");
                  return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]} '${y.slice(2)}`;
                }}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                tickFormatter={(v) => `$${v.toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any, name: any) => [`$${Number(v).toFixed(2)}M`, name]}
                labelFormatter={(l) => `Month: ${l}`}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
              {neighborhoods.map((n, i) => (
                <Line
                  key={n.name}
                  type="monotone"
                  dataKey={n.name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Per-neighborhood 12mo change chips */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-slate-100">
          {neighborhoods.map((n, i) => {
            const isUp = n.newConstructionChange12Mo >= 0;
            return (
              <div key={n.name} className="text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="text-slate-700 text-xs font-semibold">{n.name}</div>
                <div className="text-slate-400 text-xs">{fmt(n.newConstructionValue)}</div>
                <div className={`text-xs font-bold mt-0.5 ${isUp ? "text-green-600" : "text-red-600"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(n.newConstructionChange12Mo).toFixed(1)}% YoY
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Individual neighborhood trend cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {neighborhoods.map((n, i) => {
          const history = n.newConstructionHistory;
          const isUp = n.newConstructionChange12Mo >= 0;
          const yVals = history.map((h) => h.value);
          const yMin = Math.min(...yVals) * 0.985;
          const yMax = Math.max(...yVals) * 1.015;
          return (
            <div key={n.name} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className={`text-xs font-bold ${isUp ? "text-green-600" : "text-red-600"}`}>
                  {isUp ? "▲" : "▼"} {Math.abs(n.newConstructionChange12Mo).toFixed(1)}%
                </span>
              </div>
              <div className="text-slate-800 font-bold text-sm mb-0.5">{n.name}</div>
              <div className="text-slate-800 font-bold text-xl tabular-nums">{fmt(n.newConstructionValue)}</div>
              <div className="text-slate-400 text-xs mb-3">Top-tier value</div>
              {history.length > 1 && (
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history}>
                      <YAxis domain={[yMin, yMax]} hide />
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "10px" }}
                        formatter={(v: unknown) => [fmt(Number(v)), "Value"]}
                        labelFormatter={(l) => String(l).slice(0, 7)}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
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
