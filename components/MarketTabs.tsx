"use client";

import { useState } from "react";
import { NeighborhoodData } from "@/types/housing";
import NeighborhoodGrid from "./NeighborhoodGrid";
import NewConstructionTab from "./NewConstructionTab";

interface Props {
  neighborhoods: NeighborhoodData[];
  materialMultiplier: number;
  newConstructionPrices: Record<string, number>;
}

const TABS = [
  { id: "overall",  label: "Overall Market",    desc: "Median home values · All property types · Source: Zillow Research" },
  { id: "new_construction", label: "New Construction", desc: "Custom build pricing · Cost vs. sale analysis · DC Metro adjusted" },
];

export default function MarketTabs({ neighborhoods, materialMultiplier, newConstructionPrices }: Props) {
  const [active, setActive] = useState("overall");
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-end gap-0 border-b border-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`relative px-5 py-3 text-sm font-semibold transition-colors focus:outline-none ${
              active === t.id
                ? "text-amber-700 border-b-2 border-amber-500 -mb-px bg-white"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.id === "new_construction" && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-600 font-medium">New</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab description */}
      <p className="text-slate-400 text-xs mb-5">{tab.desc}</p>

      {/* Tab content */}
      {active === "overall" && <NeighborhoodGrid neighborhoods={neighborhoods} />}
      {active === "new_construction" && (
        <NewConstructionTab neighborhoods={neighborhoods} materialMultiplier={materialMultiplier} newConstructionPrices={newConstructionPrices} />
      )}
    </div>
  );
}
