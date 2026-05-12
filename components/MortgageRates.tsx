import { MortgageRate } from "@/types/housing";

interface Props {
  rates: MortgageRate[];
}

export default function MortgageRates({ rates }: Props) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-white/10 p-6">
      <div className="mb-4">
        <h2 className="text-white font-bold text-lg">Current Mortgage Rates</h2>
        <p className="text-gray-500 text-xs mt-0.5">Zillow · Refreshed hourly</p>
      </div>

      <div className="space-y-2">
        {rates.map((r) => (
          <div key={r.product} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div>
              <div className="text-gray-200 text-sm font-medium">{r.product}</div>
              <div className="text-gray-500 text-xs">{r.type} · APR {r.apr.toFixed(3)}%</div>
            </div>
            <div className="text-xl font-bold text-white tabular-nums">{r.rate.toFixed(3)}%</div>
          </div>
        ))}
      </div>

      <p className="text-gray-600 text-xs mt-3">
        Rates used in profit calculator holding cost estimates
      </p>
    </div>
  );
}
