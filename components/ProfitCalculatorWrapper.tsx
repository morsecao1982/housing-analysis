"use client";

import dynamic from "next/dynamic";

const ProfitCalculator = dynamic(() => import("./ProfitCalculator"), { ssr: false });

interface Props {
  neighborhoods: { name: string; medianHomeValue: number }[];
  materialMultiplier: number;
  defaultRate: number;
}

export default function ProfitCalculatorWrapper(props: Props) {
  return <ProfitCalculator {...props} />;
}
