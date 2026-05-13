"use client";

import { useState, useMemo, Fragment } from "react";
import { PropertyListing } from "@/types/housing";
import ProfitBadge, { roiColor, formatCurrencyCompact } from "./ProfitBadge";

interface Props {
  listings: PropertyListing[];
  dataNote: string;
}

type SortKey = "roi" | "listPrice" | "profit" | "yearBuilt" | "lotSqft" | "daysOnMarket";
type FilterStatus = "all" | "active" | "coming_soon";
type FilterType = "all" | "teardown" | "lot_only";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function TypeBadge({ type }: { type: string }) {
  if (type === "lot_only") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
        🏞 Lot Only
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-xs font-medium">
      🏚 Tear-down
    </span>
  );
}

function StatusBadge({ status, expectedDate }: { status: string; expectedDate?: string }) {
  if (status === "coming_soon") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Coming Soon
        {expectedDate && (
          <span className="opacity-60 font-normal">
            · {new Date(expectedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Active
    </span>
  );
}

export default function ListingsTable({ listings, dataNote }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("roi");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterNeighborhood, setFilterNeighborhood] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const neighborhoods = useMemo(
    () => ["all", ...Array.from(new Set(listings.map((l) => l.neighborhood)))],
    [listings]
  );

  const sorted = useMemo(() => {
    const filtered = listings.filter((l) => {
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (filterType !== "all" && l.propertyType !== filterType) return false;
      if (filterNeighborhood !== "all" && l.neighborhood !== filterNeighborhood) return false;
      return true;
    });
    filtered.sort((a, b) => {
      const va = a[sortKey] as number;
      const vb = b[sortKey] as number;
      return sortDir === "desc" ? vb - va : va - vb;
    });
    return filtered;
  }, [listings, sortKey, sortDir, filterStatus, filterType, filterNeighborhood]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  const activeCount     = listings.filter((l) => l.status === "active").length;
  const comingSoonCount = listings.filter((l) => l.status === "coming_soon").length;
  const profitableCount = listings.filter((l) => l.roi > 0).length;
  const lotOnlyCount    = listings.filter((l) => l.propertyType === "lot_only").length;

  function SortTh({ label, k }: { label: string; k: SortKey }) {
    const active = sortKey === k;
    return (
      <th
        onClick={() => toggleSort(k)}
        className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap transition-colors ${
          active ? "text-amber-700" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        {label} {active ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
      </th>
    );
  }

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Active Listings",   value: activeCount,                                color: "text-green-600"  },
          { label: "Coming Soon",       value: comingSoonCount,                            color: "text-amber-600"  },
          { label: "Lot Only",          value: lotOnlyCount,                               color: "text-purple-600" },
          { label: "Profitable Deals",  value: `${profitableCount} of ${listings.length}`, color: "text-emerald-600"},
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {(["all", "active", "coming_soon"] as FilterStatus[]).map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-slate-200 last:border-0 ${
                filterStatus === s ? "bg-amber-50 text-amber-700" : "text-slate-500 hover:text-slate-700 bg-white"
              }`}
            >
              {s === "all" ? "All Status" : s === "active" ? "Active" : "Coming Soon"}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {(["all", "teardown", "lot_only"] as FilterType[]).map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-r border-slate-200 last:border-0 ${
                filterType === t ? "bg-purple-50 text-purple-700" : "text-slate-500 hover:text-slate-700 bg-white"
              }`}
            >
              {t === "all" ? "All Types" : t === "teardown" ? "🏚 Tear-down" : "🏞 Lot Only"}
            </button>
          ))}
        </div>
        <select
          value={filterNeighborhood}
          onChange={(e) => setFilterNeighborhood(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-600 shadow-sm focus:outline-none focus:border-amber-400"
        >
          {neighborhoods.map((n) => (
            <option key={n} value={n}>{n === "all" ? "All Neighborhoods" : n}</option>
          ))}
        </select>
        <div className="ml-auto text-xs text-slate-400 self-center">{sorted.length} properties</div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Property</th>
              <SortTh label="Year Built" k="yearBuilt" />
              <SortTh label="List Price"  k="listPrice" />
              <SortTh label="Lot Size"    k="lotSqft" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">New Build</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Total Cost</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">Exp. Sale</th>
              <SortTh label="Profit / ROI" k="roi" />
              <SortTh label="DOM"          k="daysOnMarket" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((l, i) => {
              const c = roiColor(l.roi);
              const isExpanded = expanded === l.id;
              return (
                <Fragment key={l.id}>
                  <tr
                    onClick={() => setExpanded(isExpanded ? null : l.id)}
                    className={`border-t border-slate-100 cursor-pointer transition-colors ${
                      isExpanded
                        ? "bg-slate-50"
                        : i % 2 === 0
                        ? "bg-white hover:bg-slate-50"
                        : "bg-slate-50/60 hover:bg-slate-100"
                    }`}
                    style={{ borderLeft: `3px solid ${c.hex}` }}
                  >
                    <td className="px-4 py-3"><StatusBadge status={l.status} expectedDate={l.expectedDate} /></td>
                    <td className="px-4 py-3"><TypeBadge type={l.propertyType} /></td>
                    <td className="px-4 py-3">
                      <div className="text-slate-800 text-sm font-semibold">{l.address}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-400 text-xs">{l.neighborhood} · ZIP {l.zip}</span>
                        <a
                          href={`https://www.zillow.com/homes/${`${l.address} ${l.neighborhood} VA ${l.zip}`.replace(/\s+/g, "-")}_rb/`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 font-medium transition-colors"
                        >
                          Zillow ↗
                        </a>
                        <a
                          href={`https://www.redfin.com/stingray/do/location-search?location=${encodeURIComponent(`${l.address}, ${l.neighborhood}, VA ${l.zip}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 font-medium transition-colors"
                        >
                          Redfin ↗
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {l.propertyType === "lot_only" ? (
                        <span className="text-purple-600 text-xs font-semibold">Vacant Lot</span>
                      ) : (
                        <>
                          <span className="text-slate-700 text-sm">{l.yearBuilt}</span>
                          <span className="text-slate-400 text-xs block">{2026 - l.yearBuilt} yrs old</span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-800 text-sm font-semibold tabular-nums">{fmt(l.listPrice)}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm tabular-nums">{l.lotSqft.toLocaleString()} sf</td>
                    <td className="px-4 py-3 text-slate-600 text-sm tabular-nums">{l.newBuildSqft.toLocaleString()} sf</td>
                    <td className="px-4 py-3 text-slate-600 text-sm tabular-nums">{fmt(l.totalInvestment)}</td>
                    <td className="px-4 py-3 text-slate-600 text-sm tabular-nums">{fmt(l.expectedSale)}</td>
                    <td className="px-4 py-3"><ProfitBadge roi={l.roi} profit={l.profit} size="sm" /></td>
                    <td className="px-4 py-3">
                      {l.status === "coming_soon" ? (
                        <span className="text-amber-500 text-xs">—</span>
                      ) : (
                        <span className={`text-sm tabular-nums font-medium ${l.daysOnMarket > 45 ? "text-orange-600" : "text-slate-600"}`}>
                          {l.daysOnMarket}d
                        </span>
                      )}
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="border-t border-slate-200 bg-slate-50">
                      <td colSpan={10} className="px-6 py-5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">
                          <div>
                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Cost Breakdown</div>
                            <div className="space-y-1.5">
                              {[
                                ["Lot Purchase",    l.listPrice],
                                ["Demolition",      l.demolitionCost],
                                ["Build (all-in)",  l.buildCost],
                                ["Holding Costs",   l.holdingCosts],
                                ["Selling Costs",   l.sellingCosts],
                              ].map(([label, val]) => (
                                <div key={label as string} className="flex justify-between">
                                  <span className="text-slate-500 text-xs">{label as string}</span>
                                  <span className="text-slate-700 text-xs tabular-nums">{fmt(val as number)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                                <span className="text-slate-700 text-xs font-bold">Total</span>
                                <span className="text-slate-800 text-xs font-bold tabular-nums">{fmt(l.totalInvestment)}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Property Details</div>
                            <div className="space-y-1.5">
                              {[
                                ["Existing Home",   `${l.existingSqft.toLocaleString()} sqft · ${l.beds}bd/${l.baths}ba`],
                                ["Lot Size",        `${l.lotSqft.toLocaleString()} sqft`],
                                ["New Build",       `${l.newBuildSqft.toLocaleString()} sqft`],
                                ["Build Cost/sqft", `$${(l.buildCost / l.newBuildSqft).toFixed(0)}/sf`],
                                ["Sale Price/sqft", `$${l.newConstructionPricePerSqft}/sf`],
                              ].map(([label, val]) => (
                                <div key={label as string} className="flex justify-between">
                                  <span className="text-slate-500 text-xs">{label as string}</span>
                                  <span className="text-slate-700 text-xs">{val as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Returns</div>
                            <div className="space-y-1.5">
                              <div className="flex justify-between">
                                <span className="text-slate-500 text-xs">Expected Sale</span>
                                <span className="text-slate-700 text-xs tabular-nums">{fmt(l.expectedSale)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500 text-xs">Total Investment</span>
                                <span className="text-slate-700 text-xs tabular-nums">{fmt(l.totalInvestment)}</span>
                              </div>
                              <div className="flex justify-between border-t border-slate-200 pt-1.5 mt-1">
                                <span className="text-slate-700 text-xs font-bold">Net Profit</span>
                                <span className={`text-xs font-bold tabular-nums ${l.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                  {formatCurrencyCompact(l.profit)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-700 text-xs font-bold">ROI</span>
                                <span className={`text-xs font-bold ${l.roi >= 0 ? "text-green-600" : "text-red-600"}`}>{l.roi.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>

                          <div className={`rounded-xl border p-4 ${c.bg} ${c.border}`}>
                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.text}`}>{c.label}</div>
                            <div className={`text-2xl font-bold ${c.text}`}>{l.roi.toFixed(1)}% ROI</div>
                            <div className="text-slate-500 text-xs mt-2">
                              {l.newBuildSqft.toLocaleString()} sqft new build at ${l.newConstructionPricePerSqft}/sqft. 18-month build, 7.5% construction loan.
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-slate-400 text-xs mt-3 text-center">
        ⚠ {dataNote} · Click any row to expand cost breakdown
      </p>
    </div>
  );
}
