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
    <div className="bg-[#0D1825] rounded-2xl border border-white/5 p-6 h-full">
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Material Cost Index</div>
          <div className="text-white font-bold text-lg">Construction Materials</div>
          <div className="text-slate-600 text-xs mt-0.5">BLS Producer Price Index · Monthly</div>
        </div>
        <div className={`text-right px-3 py-2 rounded-xl border ${isUp ? "bg-red-500/10 border-red-500/20" : "bg-green-500/10 border-green-500/20"}`}>
          <div className={`text-xl font-bold ${isUp ? "text-red-400" : "text-green-400"}`}>{isUp ? "+" : ""}{pct}%</div>
          <div className="text-xs text-slate-500">vs baseline</div>
        </div>
      </div>

      <div className="space-y-3">
        {materials.map((m) => {
          const up = m.changePercent >= 0;
          return (
            <div key={m.seriesId} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-slate-300 text-xs font-medium truncate">{m.name}</span>
                  <span className={`text-xs font-bold ml-2 flex-shrink-0 ${up ? "text-red-400" : "text-green-400"}`}>
                    {up ? "+" : ""}{m.changePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="h-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={m.history}>
                      <YAxis domain={["auto", "auto"]} hide />
                      <Tooltip
                        contentStyle={{ background: "#0A1520", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px", fontSize: "10px" }}
                        formatter={(v: unknown) => [Number(v).toFixed(1), "Index"]}
                      />
                      <Line type="monotone" dataKey="value" stroke={up ? "#f87171" : "#4ade80"} strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-right w-16 flex-shrink-0">
                <div className="text-slate-400 text-xs tabular-nums">{m.currentValue.toFixed(0)}</div>
                <div className="text-slate-600 text-xs">{(m.weight * 100).toFixed(0)}% wt</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-4 rounded-xl px-3 py-2.5 text-xs border ${isUp ? "bg-red-500/5 border-red-500/15 text-red-300" : "bg-green-500/5 border-green-500/15 text-green-300"}`}>
        Materials are <strong>{isUp ? `${pct}% above` : `${Math.abs(parseFloat(pct))}% below`}</strong> the 2-year baseline — applied to all profit calculations.
      </div>
    </div>
  );
}
