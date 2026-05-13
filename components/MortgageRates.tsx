import { MortgageRate } from "@/types/housing";

interface Props { rates: MortgageRate[] }

export default function MortgageRates({ rates }: Props) {
  return (
    <div className="bg-[#0D1825] rounded-2xl border border-white/5 p-6 h-full">
      <div className="mb-5">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Live Rates</div>
        <div className="text-white font-bold text-lg">Mortgage Rates</div>
        <div className="text-slate-600 text-xs mt-0.5">Zillow · Refreshed hourly</div>
      </div>

      <div className="space-y-1">
        {rates.map((r) => (
          <div key={r.product} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
            <div>
              <div className="text-slate-300 text-sm">{r.product}</div>
              <div className="text-slate-600 text-xs">APR {r.apr.toFixed(3)}%</div>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{r.rate.toFixed(3)}%</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-amber-400/5 border border-amber-400/15 px-3 py-2.5 text-xs text-amber-300/70">
        Construction loan rates typically 0.5–1% above 30yr fixed. Calculator uses 7.5% default — adjust as needed.
      </div>
    </div>
  );
}
