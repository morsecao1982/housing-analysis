import { MortgageRate } from "@/types/housing";

interface Props { rates: MortgageRate[] }

export default function MortgageRates({ rates }: Props) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full">
      <div className="mb-5">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Zillow · Refreshed hourly</div>
        <div className="text-slate-800 font-bold text-lg">Mortgage Rates</div>
      </div>

      <div className="space-y-1">
        {rates.map((r) => (
          <div key={r.product} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
            <div>
              <div className="text-slate-700 text-sm font-medium">{r.product}</div>
              <div className="text-slate-400 text-xs">APR {r.apr.toFixed(3)}%</div>
            </div>
            <div className="text-2xl font-bold text-slate-800 tabular-nums">{r.rate.toFixed(3)}%</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5 text-xs text-amber-700">
        Construction loans typically run 0.5–1% above 30yr fixed. Calculator defaults to 7.5% — adjust as needed.
      </div>
    </div>
  );
}
