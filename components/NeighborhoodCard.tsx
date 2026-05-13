"use client";

import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis } from "recharts";
import { NeighborhoodData } from "@/types/housing";

function fmt(n: number) {
  return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`;
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
      className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 shadow-sm ${
        selected
          ? "border-amber-400 bg-amber-50 shadow-md"
          : hovered
          ? "border-slate-300 bg-white shadow-md scale-[1.02]"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-slate-800 font-bold text-base">{data.name}</div>
          <div className="text-slate-400 text-xs mt-0.5">ZIP {data.zipCode}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
          isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>
          {isUp ? "▲" : "▼"} {Math.abs(data.medianHomeValueChange12Mo).toFixed(1)}% YoY
        </span>
      </div>

      <div className="text-2xl font-bold text-slate-900 tabular-nums mb-0.5">{fmt(data.medianHomeValue)}</div>
      <div className="text-slate-400 text-xs mb-3">Median Home Value</div>

      {data.priceHistory.length > 1 && (
        <div className="h-12 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.priceHistory}>
              <YAxis domain={[yMin, yMax]} hide />
              <Tooltip
                contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }}
                formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, "Median"]}
              />
              <Line type="monotone" dataKey="value" stroke={isUp ? "#16a34a" : "#dc2626"} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="border-t border-slate-100 pt-3 flex justify-between text-xs">
        <span className="text-slate-400">MoM change</span>
        <span className={`font-semibold ${data.medianHomeValueChange1Mo >= 0 ? "text-green-600" : "text-red-600"}`}>
          {data.medianHomeValueChange1Mo >= 0 ? "+" : ""}{data.medianHomeValueChange1Mo.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
