"use client";

import { useState } from "react";
import NeighborhoodCard from "./NeighborhoodCard";
import { NeighborhoodData } from "@/types/housing";

interface Props {
  neighborhoods: NeighborhoodData[];
}

export default function NeighborhoodGrid({ neighborhoods }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {neighborhoods.map((n) => (
        <NeighborhoodCard
          key={n.name}
          data={n}
          selected={selected === n.name}
          onSelect={() => setSelected(selected === n.name ? null : n.name)}
        />
      ))}
    </div>
  );
}
