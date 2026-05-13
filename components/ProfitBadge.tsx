interface Props {
  roi: number;
  profit: number;
  size?: "sm" | "md" | "lg";
}

export function roiColor(roi: number) {
  if (roi > 20)  return { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "High Profit",  hex: "#059669" };
  if (roi > 10)  return { bg: "bg-green-50",    text: "text-green-700",   border: "border-green-200",   dot: "bg-green-500",   label: "Profitable",  hex: "#16a34a" };
  if (roi > 5)   return { bg: "bg-lime-50",     text: "text-lime-700",    border: "border-lime-200",    dot: "bg-lime-500",    label: "Marginal",    hex: "#65a30d" };
  if (roi > 0)   return { bg: "bg-yellow-50",   text: "text-yellow-700",  border: "border-yellow-200",  dot: "bg-yellow-500",  label: "Break-even",  hex: "#ca8a04" };
  if (roi > -10) return { bg: "bg-orange-50",   text: "text-orange-700",  border: "border-orange-200",  dot: "bg-orange-500",  label: "Risky",       hex: "#ea580c" };
  return           { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500",     label: "Avoid",       hex: "#dc2626" };
}

export function formatCurrencyCompact(v: number): string {
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "+";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export default function ProfitBadge({ roi, profit, size = "md" }: Props) {
  const c = roiColor(roi);
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : size === "lg" ? "px-4 py-2 text-base" : "px-3 py-1 text-sm";

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border ${c.bg} ${c.border} ${sizeClass} font-medium`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} flex-shrink-0`} />
      <span className={c.text}>{formatCurrencyCompact(profit)}</span>
      <span className={`${c.text} opacity-70`}>{roi.toFixed(1)}%</span>
    </div>
  );
}
