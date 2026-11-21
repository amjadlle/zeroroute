import { cn } from "@/lib/cn";

const W = 100;
const H = 36;

type SparklineProps = {
  values: number[];
  /** Accessible description. Without it the chart is decorative (the numbers should be in the text). */
  label?: string;
  className?: string;
};

/** Tiny trend chart: an area plus a line, scaled to the min and max of `values`. */
export function Sparkline({ values, label, className }: SparklineProps) {
  if (values.length === 0) return null;
  const pts = values.length === 1 ? [values[0], values[0]] : values;
  // Spread is fine for sparkline-sized arrays; switch to a loop if this ever gets 100k+ points.
  const max = Math.max(...pts);
  const min = Math.min(...pts);
  const step = W / (pts.length - 1);
  const y = (v: number) => (max === min ? H / 2 : H - 3 - ((v - min) / (max - min)) * (H - 6));
  const line = pts.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("block h-9 w-full overflow-visible", className)}
    >
      <path d={`${line} L${W} ${H} L0 ${H}Z`} className="fill-accent/15" />
      <path d={line} className="fill-none stroke-accent" strokeWidth={1.8} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
