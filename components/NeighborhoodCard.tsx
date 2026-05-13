"use client";

import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis } from "recharts";
import { NeighborhoodData } from "@/types/housing";

function fmt(n: number) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : `$${(n / 1_000).toFixed(0)}K`;
}

interface Props {
  data: NeighborhoodData;
  selected: boolean;
  onSelect: () => void;
}

export default function NeighborhoodCard({ data, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);
  const isUp = data.medianHomeValueChange12Mo >= 0;
  const yVals = data.priceHistory.map((h) => h.value);
  const yMin = Math.min(...yVals) * 0.985;
  const yMax = Math.max(...yVals) * 1.015;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
        selected
          ? "border-amber-400/40 bg-amber-400/5"
          : hovered
          ? "border-white/10 bg-[#162535] scale-[1.02]"
          : "border-white/5 bg-[#0D1825]"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-white font-bold text-base">{data.name}</div>
          <div className="text-slate-600 text-xs mt-0.5">ZIP {data.zipCode}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${
          isUp ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
        }`}>
          {isUp ? "▲" : "▼"} {Math.abs(data.medianHomeValueChange12Mo).toFixed(1)}% YoY
        </span>
      </div>

      <div className="text-2xl font-bold text-white tabular-nums mb-0.5">{fmt(data.medianHomeValue)}</div>
      <div className="text-slate-500 text-xs mb-3">Median Home Value</div>

      {data.priceHistory.length > 1 && (
        <div className="h-12 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.priceHistory}>
              <YAxis domain={[yMin, yMax]} hide />
              <Tooltip
                contentStyle={{ background: "#0A1520", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px", fontSize: "11px" }}
                formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Median"]}
              />
              <Line type="monotone" dataKey="value" stroke={isUp ? "#22c55e" : "#ef4444"} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="border-t border-white/5 pt-3 flex justify-between text-xs">
        <span className="text-slate-500">MoM</span>
        <span className={data.medianHomeValueChange1Mo >= 0 ? "text-green-400" : "text-red-400"}>
          {data.medianHomeValueChange1Mo >= 0 ? "+" : ""}{data.medianHomeValueChange1Mo.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
