import { cn } from "@/lib/cn";

const FILL = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
} as const;

type MeterProps = {
  value: number;
  max?: number;
  tone?: keyof typeof FILL;
  /** Accessible name, e.g. "Questions used this month". */
  label: string;
  /** Spoken value, e.g. "6,420 of 10,000". Defaults to the number. */
  valueText?: string;
  className?: string;
};

/** Honest usage bar: 0 renders as an empty track, values are clamped to 0..max. */
export function Meter({ value, max = 100, tone = "accent", label, valueText, className }: MeterProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={valueText}
      className={cn("h-2 overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-border", className)}
    >
      <div className={cn("h-full rounded-full", FILL[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
