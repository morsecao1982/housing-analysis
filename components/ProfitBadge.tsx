interface Props {
  roi: number;
  profit: number;
  size?: "sm" | "md" | "lg";
}

export function roiColor(roi: number) {
  if (roi > 20)  return { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30", dot: "bg-emerald-400", label: "High Profit" };
  if (roi > 10)  return { bg: "bg-green-500/15",   text: "text-green-400",   border: "border-green-500/30",   dot: "bg-green-400",   label: "Profitable" };
  if (roi > 5)   return { bg: "bg-lime-500/15",    text: "text-lime-400",    border: "border-lime-500/30",    dot: "bg-lime-400",    label: "Marginal" };
  if (roi > 0)   return { bg: "bg-yellow-500/15",  text: "text-yellow-400",  border: "border-yellow-500/30",  dot: "bg-yellow-400",  label: "Break-even" };
  if (roi > -10) return { bg: "bg-orange-500/15",  text: "text-orange-400",  border: "border-orange-500/30",  dot: "bg-orange-400",  label: "Risky" };
  return           { bg: "bg-red-500/15",     text: "text-red-400",     border: "border-red-500/30",     dot: "bg-red-400",     label: "Avoid" };
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
