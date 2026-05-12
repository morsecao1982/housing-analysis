import { NeighborhoodData, MortgageRate, MaterialIndex } from "@/types/housing";
import NeighborhoodCard from "@/components/NeighborhoodCard";
import MaterialCosts from "@/components/MaterialCosts";
import MortgageRates from "@/components/MortgageRates";
import ProfitCalculatorWrapper from "@/components/ProfitCalculatorWrapper";
import { formatCurrency, formatPercent } from "@/lib/calculations";

async function fetchAll() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const [marketRes, materialsRes, ratesRes] = await Promise.allSettled([
    fetch(`${base}/api/market-data`, { cache: "no-store" }),
    fetch(`${base}/api/materials`, { cache: "no-store" }),
    fetch(`${base}/api/mortgage-rates`, { cache: "no-store" }),
  ]);

  const neighborhoods: NeighborhoodData[] =
    marketRes.status === "fulfilled" && marketRes.value.ok
      ? await marketRes.value.json()
      : [];

  const materialsData =
    materialsRes.status === "fulfilled" && materialsRes.value.ok
      ? await materialsRes.value.json()
      : { materials: [], materialCostMultiplier: 1 };

  const ratesData =
    ratesRes.status === "fulfilled" && ratesRes.value.ok
      ? await ratesRes.value.json()
      : { rates: [] };

  return {
    neighborhoods,
    materials: materialsData.materials as MaterialIndex[],
    materialCostMultiplier: materialsData.materialCostMultiplier as number,
    mortgageRates: ratesData.rates as MortgageRate[],
  };
}

export default async function Home() {
  const { neighborhoods, materials, materialCostMultiplier, mortgageRates } = await fetchAll();

  const avgChange = neighborhoods.length
    ? neighborhoods.reduce((s, n) => s + n.medianHomeValueChange12Mo, 0) / neighborhoods.length
    : 0;

  const topNeighborhood = [...neighborhoods].sort(
    (a, b) => b.medianHomeValueChange12Mo - a.medianHomeValueChange12Mo
  )[0];

  const defaultRate = mortgageRates.find((r) => r.product.includes("30 Year Fixed"))?.rate ?? 7.0;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Northern Virginia Housing Analysis</h1>
          <p className="text-gray-400 mt-1 text-sm">
            McLean · Great Falls · Vienna · Falls Church · Tysons — lot &amp; build profit analysis
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl border border-white/10 p-4">
            <div className="text-gray-500 text-xs mb-1">Avg YoY Price Change</div>
            <div className={`text-2xl font-bold ${avgChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatPercent(avgChange)}
            </div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-white/10 p-4">
            <div className="text-gray-500 text-xs mb-1">Hottest Market</div>
            <div className="text-xl font-bold text-white">{topNeighborhood?.name ?? "—"}</div>
            <div className="text-green-400 text-xs">{topNeighborhood ? formatPercent(topNeighborhood.medianHomeValueChange12Mo) : ""} YoY</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-white/10 p-4">
            <div className="text-gray-500 text-xs mb-1">Material Cost Shift</div>
            <div className={`text-2xl font-bold ${materialCostMultiplier >= 1 ? "text-red-400" : "text-green-400"}`}>
              {materialCostMultiplier >= 1 ? "+" : ""}{((materialCostMultiplier - 1) * 100).toFixed(1)}%
            </div>
            <div className="text-gray-500 text-xs">vs 2-yr baseline</div>
          </div>
          <div className="bg-gray-900 rounded-xl border border-white/10 p-4">
            <div className="text-gray-500 text-xs mb-1">30yr Fixed Rate</div>
            <div className="text-2xl font-bold text-white">{defaultRate.toFixed(3)}%</div>
            <div className="text-gray-500 text-xs">Current market rate</div>
          </div>
        </div>

        {/* Neighborhood Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-blue-500 inline-block" />
            Neighborhood Market Data
          </h2>
          {neighborhoods.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center">Failed to load market data — refresh to retry</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {neighborhoods.map((n) => (
                <NeighborhoodCard key={n.name} data={n} selected={false} onSelect={() => {}} />
              ))}
            </div>
          )}
        </section>

        {/* Profit Calculator */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-green-500 inline-block" />
            Profit Calculator
          </h2>
          <ProfitCalculatorWrapper
            neighborhoods={neighborhoods.map((n) => ({
              name: n.name,
              medianHomeValue: n.medianHomeValue,
            }))}
            materialMultiplier={materialCostMultiplier}
            defaultRate={defaultRate}
          />
        </section>

        {/* Material Costs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-orange-500 inline-block" />
            Construction Material Costs
          </h2>
          <MaterialCosts materials={materials} multiplier={materialCostMultiplier} />
        </section>

        {/* Mortgage Rates */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-purple-500 inline-block" />
            Mortgage Rates
          </h2>
          <div className="max-w-md">
            <MortgageRates rates={mortgageRates} />
          </div>
        </section>

        <footer className="mt-12 text-center text-xs text-gray-600 border-t border-white/5 pt-6">
          Home values: Zillow Research · Material costs: BLS PPI · Mortgage rates: Zillow ·{" "}
          <a href="/" className="underline hover:text-gray-400">Refresh</a> for latest data
        </footer>
      </div>
    </main>
  );
}
