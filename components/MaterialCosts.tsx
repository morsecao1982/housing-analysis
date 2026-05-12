"use client";

import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis, XAxis } from "recharts";
import { MaterialIndex } from "@/types/housing";

interface Props {
  materials: MaterialIndex[];
  multiplier: number;
}

export default function MaterialCosts({ materials, multiplier }: Props) {
  const multiplierPercent = ((multiplier - 1) * 100).toFixed(1);
  const isUp = multiplier >= 1;

  return (
    <div className="bg-gray-900 rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-bold text-lg">Construction Material Costs</h2>
          <p className="text-gray-500 text-xs mt-0.5">BLS Producer Price Index · Updated monthly</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${isUp ? "text-red-400" : "text-green-400"}`}>
            {isUp ? "+" : ""}{multiplierPercent}%
          </div>
          <div className="text-xs text-gray-500">vs 2-year baseline</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {materials.map((m) => {
          const isMatUp = m.changePercent >= 0;
          return (
            <div key={m.seriesId} className="bg-gray-800/60 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-300 text-xs font-medium">{m.name}</span>
                <span className={`text-xs font-bold ${isMatUp ? "text-red-400" : "text-green-400"}`}>
                  {isMatUp ? "+" : ""}{m.changePercent.toFixed(1)}%
                </span>
              </div>
              <div className="text-gray-500 text-xs mb-2">
                Index: {m.currentValue.toFixed(1)} · Weight: {(m.weight * 100).toFixed(0)}%
              </div>
              {m.history.length > 1 && (
                <div className="h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={m.history}>
                      <YAxis domain={["auto", "auto"]} hide />
                      <XAxis dataKey="date" hide />
                      <Tooltip
                        contentStyle={{ background: "#111827", border: "none", borderRadius: "6px", fontSize: "10px" }}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(v: any) => [Number(v).toFixed(1), "Index"]}
                        labelFormatter={(l) => l}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={isMatUp ? "#f87171" : "#4ade80"}
                        strokeWidth={1.5}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${isUp ? "bg-red-500/10 border border-red-500/20 text-red-300" : "bg-green-500/10 border border-green-500/20 text-green-300"}`}>
        <strong>Impact on your build cost:</strong> Materials are{" "}
        {isUp ? `${multiplierPercent}% more expensive` : `${Math.abs(parseFloat(multiplierPercent))}% cheaper`} than the 2-year baseline.
        The profit calculator automatically applies this adjustment.
      </div>
    </div>
  );
}
