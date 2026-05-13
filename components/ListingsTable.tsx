"use client";

import { useState, useMemo } from "react";
import { PropertyListing } from "@/types/housing";
import ProfitBadge, { roiColor, formatCurrencyCompact } from "./ProfitBadge";

interface Props {
  listings: PropertyListing[];
  dataNote: string;
}

type SortKey = "roi" | "listPrice" | "profit" | "yearBuilt" | "lotSqft" | "daysOnMarket";
type FilterStatus = "all" | "active" | "coming_soon";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function StatusBadge({ status, expectedDate }: { status: string; expectedDate?: string }) {
  if (status === "coming_soon") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Coming Soon
        {expectedDate && <span className="opacity-60 font-normal">· {new Date(expectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-400/10 border border-blue-400/30 text-blue-400 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-400/10 border border-green-400/30 text-green-400 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Active
    </span>
  );
}

export default function ListingsTable({ listings, dataNote }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("roi");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterNeighborhood, setFilterNeighborhood] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const neighborhoods = useMemo(() => ["all", ...Array.from(new Set(listings.map((l) => l.neighborhood)))], [listings]);

  const sorted = useMemo(() => {
    let filtered = listings.filter((l) => {
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterNeighborhood !== "all" && l.neighborhood !== filterNeighborhood) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return filtered;
  }, [listings, sortKey, sortDir, filterStatus, filterNeighborhood]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const activeCount = listings.filter((l) => l.status === "active").length;
  const comingSoonCount = listings.filter((l) => l.status === "coming_soon").length;
  const profitableCount = listings.filter((l) => l.roi > 0).length;

  function SortTh({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <th
        onClick={() => toggleSort(k)}
        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors ${
          active ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
        }`}
      >
        {label} {active ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
      </th>
    );
  }

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Active Listings", value: activeCount, color: "text-green-400" },
          { label: "Coming Soon",     value: comingSoonCount, color: "text-amber-400" },
          { label: "Profitable Deals", value: `${profitableCount} of ${listings.length}`, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="bg-[#0D1825] rounded-xl border border-white/5 px-4 py-3">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex rounded-xl border border-white/5 overflow-hidden">
          {(["all", "active", "coming_soon"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === s ? "bg-amber-400/15 text-amber-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {s === "all" ? "All" : s === "active" ? "Active" : "Coming Soon"}
            </button>
          ))}
        </div>
        <select
          value={filterNeighborhood}
          onChange={(e) => setFilterNeighborhood(e.target.value)}
          className="bg-[#0D1825] border border-white/5 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400/30"
        >
          {neighborhoods.map((n) => (
            <option key={n} value={n}>{n === "all" ? "All Neighborhoods" : n}</option>
          ))}
        </select>
        <div className="ml-auto text-xs text-slate-500 self-center">{sorted.length} properties</div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/5">
        <table className="w-full border-collapse">
          <thead className="bg-[#0A1520]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Property</th>
              <SortTh label="Year Built" k="yearBuilt" />
              <SortTh label="List Price" k="listPrice" />
              <SortTh label="Lot Size" k="lotSqft" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">New Build</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Total Cost</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Exp. Sale</th>
              <SortTh label="Profit / ROI" k="roi" />
              <SortTh label="DOM" k="daysOnMarket" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((l, i) => {
              const c = roiColor(l.roi);
              const isExpanded = expanded === l.id;
              return (
                <>
                  <tr
                    key={l.id}
                    onClick={() => setExpanded(isExpanded ? null : l.id)}
                    className={`border-t border-white/5 cursor-pointer transition-colors ${
                      isExpanded ? "bg-[#162535]" : i % 2 === 0 ? "bg-[#0D1825] hover:bg-[#121E2E]" : "bg-[#0B1521] hover:bg-[#121E2E]"
                    }`}
                    style={{ borderLeft: `3px solid ${l.roi > 20 ? "#10b981" : l.roi > 10 ? "#22c55e" : l.roi > 5 ? "#84cc16" : l.roi > 0 ? "#eab308" : l.roi > -10 ? "#f97316" : "#ef4444"}` }}
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={l.status} expectedDate={l.expectedDate} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm font-medium">{l.address}</div>
                      <div className="text-slate-500 text-xs">{l.neighborhood} · ZIP {l.zip}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-300 text-sm">{l.yearBuilt}</span>
                      <span className="text-slate-600 text-xs block">{2026 - l.yearBuilt} yrs old</span>
                    </td>
                    <td className="px-4 py-3 text-slate-200 text-sm font-medium tabular-nums">{fmt(l.listPrice)}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm tabular-nums">{l.lotSqft.toLocaleString()} sf</td>
                    <td className="px-4 py-3 text-slate-300 text-sm tabular-nums">{l.newBuildSqft.toLocaleString()} sf</td>
                    <td className="px-4 py-3 text-slate-300 text-sm tabular-nums">{fmt(l.totalInvestment)}</td>
                    <td className="px-4 py-3 text-slate-300 text-sm tabular-nums">{fmt(l.expectedSale)}</td>
                    <td className="px-4 py-3">
                      <ProfitBadge roi={l.roi} profit={l.profit} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      {l.status === "coming_soon" ? (
                        <span className="text-amber-400 text-xs">—</span>
                      ) : (
                        <span className={`text-sm tabular-nums ${l.daysOnMarket > 45 ? "text-orange-400" : "text-slate-300"}`}>
                          {l.daysOnMarket}d
                        </span>
                      )}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${l.id}-expanded`} className="bg-[#162535] border-t border-white/5">
                      <td colSpan={10} className="px-6 py-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Cost Breakdown</div>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span className="text-slate-400">Lot Purchase</span><span className="text-slate-200 tabular-nums">{fmt(l.listPrice)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Demolition</span><span className="text-slate-200 tabular-nums">{fmt(l.demolitionCost)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Build (all-in)</span><span className="text-slate-200 tabular-nums">{fmt(l.buildCost)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Holding Costs</span><span className="text-slate-200 tabular-nums">{fmt(l.holdingCosts)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Selling Costs</span><span className="text-slate-200 tabular-nums">{fmt(l.sellingCosts)}</span></div>
                              <div className="flex justify-between border-t border-white/10 pt-1 mt-1"><span className="text-white font-medium">Total</span><span className="text-white font-medium tabular-nums">{fmt(l.totalInvestment)}</span></div>
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Property Details</div>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span className="text-slate-400">Existing Home</span><span className="text-slate-200">{l.existingSqft.toLocaleString()} sqft · {l.beds}bd/{l.baths}ba</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Lot Size</span><span className="text-slate-200">{l.lotSqft.toLocaleString()} sqft</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">New Build</span><span className="text-slate-200">{l.newBuildSqft.toLocaleString()} sqft</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Build Cost/sqft</span><span className="text-slate-200">${(l.buildCost / l.newBuildSqft).toFixed(0)}/sf</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Sale Price/sqft</span><span className="text-slate-200">${l.newConstructionPricePerSqft}/sf</span></div>
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500 text-xs uppercase tracking-wider mb-2">Returns</div>
                            <div className="space-y-1">
                              <div className="flex justify-between"><span className="text-slate-400">Expected Sale</span><span className="text-slate-200 tabular-nums">{fmt(l.expectedSale)}</span></div>
                              <div className="flex justify-between"><span className="text-slate-400">Total Investment</span><span className="text-slate-200 tabular-nums">{fmt(l.totalInvestment)}</span></div>
                              <div className="flex justify-between border-t border-white/10 pt-1 mt-1">
                                <span className="text-white font-medium">Net Profit</span>
                                <span className={`font-bold tabular-nums ${l.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{formatCurrencyCompact(l.profit)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white font-medium">ROI</span>
                                <span className={`font-bold ${l.roi >= 0 ? "text-green-400" : "text-red-400"}`}>{l.roi.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className={`rounded-xl border p-3 ${roiColor(l.roi).bg} ${roiColor(l.roi).border}`}>
                              <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${roiColor(l.roi).text}`}>{roiColor(l.roi).label}</div>
                              <div className={`text-2xl font-bold ${roiColor(l.roi).text}`}>{l.roi.toFixed(1)}% ROI</div>
                              <div className="text-slate-400 text-xs mt-2">
                                Based on {l.newBuildSqft.toLocaleString()} sqft new build at ${l.newConstructionPricePerSqft}/sqft market rate. 18-month timeline, 7.5% construction loan.
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-slate-600 text-xs mt-3 text-center">
        ⚠ {dataNote} · Click any row to expand cost breakdown · Sorted by {sortKey}
      </p>
    </div>
  );
}
