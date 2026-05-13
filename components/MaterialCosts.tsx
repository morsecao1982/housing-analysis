"use client";

import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis } from "recharts";
import { MaterialIndex } from "@/types/housing";

interface Props {
  materials: MaterialIndex[];
  multiplier: number;
}

export default function MaterialCosts({ materials, multiplier }: Props) {
  const pct = ((multiplier - 1) * 100).toFixed(1);
  const isUp = multiplier >= 1;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">BLS Producer Price Index</div>
          <div className="text-slate-800 font-bold text-lg">Construction Materials</div>
          <div className="text-slate-400 text-xs mt-0.5">Updated monthly</div>
        </div>
        <div className={`text-right px-3 py-2 rounded-xl border ${isUp ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <div className={`text-xl font-bold ${isUp ? "text-red-600" : "text-green-600"}`}>{isUp ? "+" : ""}{pct}%</div>
          <div className="text-xs text-slate-400">vs 2yr baseline</div>
        </div>
      </div>

      <div className="space-y-3">
        {materials.map((m) => {
          const up = m.changePercent >= 0;
          return (
            <div key={m.seriesId} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-slate-600 text-xs font-medium truncate">{m.name}</span>
                  <span className={`text-xs font-bold ml-2 flex-shrink-0 ${up ? "text-red-600" : "text-green-600"}`}>
                    {up ? "+" : ""}{m.changePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={m.history}>
                      <YAxis domain={["auto", "auto"]} hide />
                      <Tooltip
                        contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px", fontSize: "10px" }}
                        formatter={(v: unknown) => [Number(v).toFixed(1), "Index"]}
                      />
                      <Line type="monotone" dataKey="value" stroke={up ? "#dc2626" : "#16a34a"} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-right w-16 flex-shrink-0">
                <div className="text-slate-500 text-xs tabular-nums">{m.currentValue.toFixed(0)}</div>
                <div className="text-slate-300 text-xs">{(m.weight * 100).toFixed(0)}% wt</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-4 rounded-xl px-3 py-2.5 text-xs border ${isUp ? "bg-red-50 border-red-100 text-red-700" : "bg-green-50 border-green-100 text-green-700"}`}>
        Materials are <strong>{isUp ? `${pct}% above` : `${Math.abs(parseFloat(pct))}% below`}</strong> the 2-year baseline — automatically applied to all profit calculations.
      </div>
    </div>
  );
}
