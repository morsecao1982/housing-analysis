import { MortgageRate, MaterialIndex, PropertyListing, NeighborhoodData } from "@/types/housing";
import MaterialCosts from "@/components/MaterialCosts";
import MortgageRates from "@/components/MortgageRates";
import ProfitCalculatorWrapper from "@/components/ProfitCalculatorWrapper";
import ListingsTable from "@/components/ListingsTable";
import MarketTabs from "@/components/MarketTabs";
import { fetchMarketData } from "@/lib/fetchMarketData";
import { fetchMaterials } from "@/lib/fetchMaterials";
import { fetchMortgageRates } from "@/lib/fetchMortgageRates";
import { fetchListings, deriveNewConstructionPrices } from "@/lib/fetchListings";
import { fetchRealListings } from "@/lib/fetchRealListings";

async function fetchAll() {
  const [neighborhoods, matsResult, rates] = await Promise.all([
    fetchMarketData().catch((): NeighborhoodData[] => []),
    fetchMaterials().catch(() => ({ materials: [] as MaterialIndex[], materialCostMultiplier: 1 })),
    fetchMortgageRates().catch((): MortgageRate[] => []),
  ]);

  // Derive sale price estimates from live Zillow top-tier ZHVI ÷ typical new build sqft
  const newConstructionPrices = deriveNewConstructionPrices(neighborhoods);

  // Fetch real Zillow listings; fall back to sample data if API fails
  let listings, dataNote;
  try {
    ({ listings, dataNote } = await fetchRealListings(newConstructionPrices, matsResult.materialCostMultiplier));
    if (listings.length === 0) throw new Error("no listings returned");
  } catch {
    ({ listings, dataNote } = fetchListings(matsResult.materialCostMultiplier, newConstructionPrices));
  }

  return {
    neighborhoods,
    materials:               matsResult.materials,
    materialCostMultiplier:  matsResult.materialCostMultiplier,
    mortgageRates:           rates,
    listings,
    dataNote,
    newConstructionPrices,
  };
}

export default async function Home() {
  const { neighborhoods, materials, materialCostMultiplier, mortgageRates, listings, dataNote, newConstructionPrices } = await fetchAll();

  const defaultRate     = mortgageRates.find((r) => r.product.includes("30 Year Fixed"))?.rate ?? 7.0;
  const profitableCount = listings.filter((l) => l.roi > 0).length;
  const topDeal         = [...listings].filter((l) => l.status === "active").sort((a, b) => b.roi - a.roi)[0];
  const comingSoon      = listings.filter((l) => l.status === "coming_soon").length;

  function fmt(n: number) {
    return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`;
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center">
              <span className="text-amber-700 text-sm font-bold">N</span>
            </div>
            <div>
              <div className="text-slate-800 font-bold text-sm leading-none">NoVA Builder Intelligence</div>
              <div className="text-slate-400 text-xs mt-0.5">Northern Virginia · Tear-down Analysis</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Live data · refreshes on load
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="mb-2 text-amber-600 text-xs font-bold uppercase tracking-widest">
            Pre-1970 Tear-down Opportunities
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            Northern Virginia
            <span className="text-slate-400 font-normal"> Housing Market Analysis</span>
          </h1>
          <p className="text-slate-500 text-sm mb-8 max-w-xl">
            Identify profitable tear-down and rebuild opportunities across McLean, Great Falls, Vienna, Falls Church, and Tysons. All data updated on every page load.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Properties Analyzed",  value: `${listings.length}`,                          sub: "pre-1970 listings",          color: "text-slate-800" },
              { label: "Profitable Deals",      value: `${profitableCount}`,                          sub: `of ${listings.length} analyzed`, color: "text-emerald-600" },
              { label: "Coming Soon",           value: `${comingSoon}`,                               sub: "watch list",                 color: "text-amber-600"  },
              { label: "Top Deal ROI",          value: topDeal ? `${topDeal.roi.toFixed(1)}%` : "—",  sub: topDeal?.address ?? "",        color: "text-green-600"  },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-2xl border border-slate-200 px-5 py-4">
                <div className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-slate-600 text-xs font-medium mt-1">{s.label}</div>
                <div className="text-slate-400 text-xs truncate mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">

        {/* Profitability legend */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider mr-1">Profitability:</span>
          {[
            { label: "High Profit >20%",  bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
            { label: "Profitable 10–20%", bg: "bg-green-50",   text: "text-green-700",   border: "border-green-200"   },
            { label: "Marginal 5–10%",    bg: "bg-lime-50",    text: "text-lime-700",    border: "border-lime-200"    },
            { label: "Break-even 0–5%",   bg: "bg-yellow-50",  text: "text-yellow-700",  border: "border-yellow-200"  },
            { label: "Risky -10–0%",      bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200"  },
            { label: "Avoid < -10%",      bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200"     },
          ].map((l) => (
            <span key={l.label} className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${l.bg} ${l.text} ${l.border}`}>{l.label}</span>
          ))}
        </div>

        {/* Listings */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-amber-500" />
            <div>
              <h2 className="text-slate-800 font-bold text-xl">Tear-down Opportunity Listings</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Properties built before 1970 · Active &amp; Coming Soon · Click row to expand · Zillow &amp; Redfin links per listing
              </p>
            </div>
          </div>
          <ListingsTable listings={listings} dataNote={dataNote} />
        </section>

        {/* Market Analysis — two tabs */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-blue-500" />
            <div>
              <h2 className="text-slate-800 font-bold text-xl">Market Analysis</h2>
              <p className="text-slate-400 text-xs mt-0.5">Overall market trends · New construction pricing · Source: Zillow Research &amp; BLS</p>
            </div>
          </div>
          <MarketTabs neighborhoods={neighborhoods} materialMultiplier={materialCostMultiplier} newConstructionPrices={newConstructionPrices} />
        </section>

        {/* Profit Calculator */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-green-500" />
            <div>
              <h2 className="text-slate-800 font-bold text-xl">Custom Profit Calculator</h2>
              <p className="text-slate-400 text-xs mt-0.5">Model any property — costs auto-adjusted for live material indexes and DC metro labor premium</p>
            </div>
          </div>
          <ProfitCalculatorWrapper
            neighborhoods={neighborhoods.map((n) => ({ name: n.name, medianHomeValue: n.medianHomeValue }))}
            materialMultiplier={materialCostMultiplier}
            defaultRate={defaultRate}
          />
        </section>

        {/* Market Indicators */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-orange-500" />
            <div>
              <h2 className="text-slate-800 font-bold text-xl">Market Indicators</h2>
              <p className="text-slate-400 text-xs mt-0.5">Live construction material costs · Current mortgage rates</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MaterialCosts materials={materials} multiplier={materialCostMultiplier} />
            <MortgageRates rates={mortgageRates} />
          </div>
        </section>

      </div>

      <footer className="bg-white border-t border-slate-200 px-6 py-6 mt-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-500">NoVA Builder Intelligence · For professional use only</span>
          <span>
            Home values: Zillow Research · Materials: BLS PPI · Rates: Zillow ·{" "}
            <a href="/" className="text-amber-600 hover:text-amber-700 font-medium">Refresh data</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
