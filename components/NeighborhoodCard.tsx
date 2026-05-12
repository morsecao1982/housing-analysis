"use client";

import { useState } from "react";
import { ResponsiveContainer, LineChart, Line, Tooltip, YAxis } from "recharts";
import { NeighborhoodData } from "@/types/housing";
import { formatCurrency, formatPercent } from "@/lib/calculations";

interface Props {
  data: NeighborhoodData;
  selected: boolean;
  onSelect: () => void;
}

export default function NeighborhoodCard({ data, selected, onSelect }: Props) {
  const [hovered, setHovered] = useState(false);
  const isUp = data.medianHomeValueChange12Mo >= 0;
  const color = isUp ? "#22c55e" : "#ef4444";
  const yVals = data.priceHistory.map((h) => h.value);
  const yMin = Math.min(...yVals) * 0.98;
  const yMax = Math.max(...yVals) * 1.02;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
        selected
          ? "border-blue-500 bg-blue-500/10"
          : hovered
          ? "border-white/20 bg-white/5 scale-[1.02]"
          : "border-white/10 bg-gray-900"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-white font-bold text-lg">{data.name}</div>
          <div className="text-gray-500 text-xs">ZIP {data.zipCode} · Fairfax County</div>
        </div>
        {selected && (
          <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">Selected</span>
        )}
      </div>

      <div className="text-2xl font-bold text-white tabular-nums mb-1">
        {formatCurrency(data.medianHomeValue)}
      </div>
      <div className="flex gap-3 text-xs mb-3">
        <span className={isUp ? "text-green-400" : "text-red-400"}>
          {formatPercent(data.medianHomeValueChange12Mo)} YoY
        </span>
        <span className={data.medianHomeValueChange1Mo >= 0 ? "text-green-400" : "text-red-400"}>
          {formatPercent(data.medianHomeValueChange1Mo)} MoM
        </span>
      </div>

      {data.priceHistory.length > 1 && (
        <div className="h-14">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.priceHistory}>
              <YAxis domain={[yMin, yMax]} hide />
              <Tooltip
                contentStyle={{ background: "#1f2937", border: "none", borderRadius: "8px", fontSize: "11px" }}
                labelStyle={{ color: "#9ca3af" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => [formatCurrency(Number(v)), "Median Value"]}
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-400">
        Est. price/sqft:{" "}
        <span className="text-gray-200 font-medium">
          {formatCurrency(Math.round(data.medianHomeValue / 2500))}/sqft
        </span>
      </div>
    </div>
  );
}
