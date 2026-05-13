import { NeighborhoodData, MortgageRate, MaterialIndex, PropertyListing } from "@/types/housing";
import NeighborhoodGrid from "@/components/NeighborhoodGrid";
import MaterialCosts from "@/components/MaterialCosts";
import MortgageRates from "@/components/MortgageRates";
import ProfitCalculatorWrapper from "@/components/ProfitCalculatorWrapper";
import ListingsTable from "@/components/ListingsTable";

async function fetchAll() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const [marketRes, materialsRes, ratesRes] = await Promise.allSettled([
    fetch(`${base}/api/market-data`,    { cache: "no-store" }),
    fetch(`${base}/api/materials`,      { cache: "no-store" }),
    fetch(`${base}/api/mortgage-rates`, { cache: "no-store" }),
  ]);

  const neighborhoods: NeighborhoodData[] =
    marketRes.status === "fulfilled" && marketRes.value.ok ? await marketRes.value.json() : [];
  const mats =
    materialsRes.status === "fulfilled" && materialsRes.value.ok ? await materialsRes.value.json() : { materials: [], materialCostMultiplier: 1 };
  const ratesData =
    ratesRes.status === "fulfilled" && ratesRes.value.ok ? await ratesRes.value.json() : { rates: [] };

  const listingsRes = await fetch(`${base}/api/listings?materialMultiplier=${mats.materialCostMultiplier}`, { cache: "no-store" });
  const listingsData = listingsRes.ok ? await listingsRes.json() : { listings: [], dataNote: "" };

  return {
    neighborhoods,
    materials: mats.materials as MaterialIndex[],
    materialCostMultiplier: mats.materialCostMultiplier as number,
    mortgageRates: ratesData.rates as MortgageRate[],
    listings: listingsData.listings as PropertyListing[],
    dataNote: listingsData.dataNote as string,
  };
}

export default async function Home() {
  const { neighborhoods, materials, materialCostMultiplier, mortgageRates, listings, dataNote } = await fetchAll();

  const defaultRate = mortgageRates.find((r) => r.product.includes("30 Year Fixed"))?.rate ?? 7.0;
  const profitableCount = listings.filter((l) => l.roi > 0).length;
  const topDeal = [...listings].filter(l => l.status === "active").sort((a, b) => b.roi - a.roi)[0];
  const comingSoon = listings.filter((l) => l.status === "coming_soon").length;

  function fmt(n: number) {
    return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`;
  }

  return (
    <div className="min-h-screen" style={{ background: "#080F1A" }}>

      {/* Top nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between" style={{ background: "#0B1623" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
            <span className="text-amber-400 text-sm font-bold">N</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-none">NoVA Builder Intelligence</div>
            <div className="text-slate-600 text-xs mt-0.5">Northern Virginia · Tear-down Analysis</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#0D1825] border border-white/5 rounded-lg px-3 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Live data · refreshes on load
        </div>
      </nav>

      {/* Hero */}
      <div className="border-b border-white/5 px-6 py-10" style={{ background: "linear-gradient(180deg, #0D1825 0%, #080F1A 100%)" }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-2 text-amber-400 text-xs font-semibold uppercase tracking-widest">
            Pre-1970 Tear-down Opportunities
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Northern Virginia<br />
            <span className="text-slate-400 font-normal">Housing Market Analysis</span>
          </h1>
          <p className="text-slate-500 text-sm mb-8 max-w-xl">
            Identify profitable tear-down and rebuild opportunities across McLean, Great Falls, Vienna, Falls Church, and Tysons. Updated on every page load.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Properties Analyzed",   value: `${listings.length}`,                   sub: "pre-1970 listings",         color: "text-white" },
              { label: "Profitable Deals",       value: `${profitableCount}`,                   sub: `of ${listings.length} analyzed`, color: "text-green-400" },
              { label: "Coming Soon",            value: `${comingSoon}`,                        sub: "watch list",                color: "text-amber-400" },
              { label: "Top Deal ROI",           value: topDeal ? `${topDeal.roi.toFixed(1)}%` : "—", sub: topDeal?.address ?? "",  color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="bg-[#0D1825] rounded-2xl border border-white/5 px-5 py-4">
                <div className={`text-3xl font-bold ${s.color} tabular-nums`}>{s.value}</div>
                <div className="text-slate-400 text-xs mt-1">{s.label}</div>
                <div className="text-slate-600 text-xs truncate">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">

        {/* Profitability Legend */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-500 text-xs uppercase tracking-wider">Profitability Scale:</span>
          {[
            { label: "High Profit >20%", bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
            { label: "Profitable 10–20%", bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/30" },
            { label: "Marginal 5–10%", bg: "bg-lime-500/15", text: "text-lime-400", border: "border-lime-500/30" },
            { label: "Break-even 0–5%", bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/30" },
            { label: "Risky -10–0%", bg: "bg-orange-500/15", text: "text-orange-400", border: "border-orange-500/30" },
            { label: "Avoid <-10%", bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
          ].map((l) => (
            <span key={l.label} className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${l.bg} ${l.text} ${l.border}`}>{l.label}</span>
          ))}
        </div>

        {/* Listings */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-amber-400" />
            <div>
              <h2 className="text-white font-bold text-xl">Tear-down Opportunity Listings</h2>
              <p className="text-slate-500 text-xs mt-0.5">Properties built before 1970 · Active &amp; Coming Soon · Click row to expand cost breakdown</p>
            </div>
          </div>
          <ListingsTable listings={listings} dataNote={dataNote} />
        </section>

        {/* Neighborhood Market Data */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-blue-400" />
            <div>
              <h2 className="text-white font-bold text-xl">Neighborhood Market Data</h2>
              <p className="text-slate-500 text-xs mt-0.5">Median home values · 24-month trend · Source: Zillow Research</p>
            </div>
          </div>
          <NeighborhoodGrid neighborhoods={neighborhoods} />
        </section>

        {/* Profit Calculator */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-green-400" />
            <div>
              <h2 className="text-white font-bold text-xl">Custom Profit Calculator</h2>
              <p className="text-slate-500 text-xs mt-0.5">Model any property — costs auto-adjusted for live material indexes and DC metro labor premium</p>
            </div>
          </div>
          <ProfitCalculatorWrapper
            neighborhoods={neighborhoods.map((n) => ({ name: n.name, medianHomeValue: n.medianHomeValue }))}
            materialMultiplier={materialCostMultiplier}
            defaultRate={defaultRate}
          />
        </section>

        {/* Material Costs + Mortgage Rates */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 rounded-full bg-orange-400" />
            <div>
              <h2 className="text-white font-bold text-xl">Market Indicators</h2>
              <p className="text-slate-500 text-xs mt-0.5">Live construction material costs · Current mortgage rates</p>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MaterialCosts materials={materials} multiplier={materialCostMultiplier} />
            <MortgageRates rates={mortgageRates} />
          </div>
        </section>

      </div>

      <footer className="border-t border-white/5 px-6 py-6 mt-4" style={{ background: "#0B1623" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <span>NoVA Builder Intelligence · For professional use only</span>
          <span>Home values: Zillow Research · Materials: BLS PPI · Rates: Zillow · <a href="/" className="text-amber-400/60 hover:text-amber-400">Refresh data</a></span>
        </div>
      </footer>
    </div>
  );
}
