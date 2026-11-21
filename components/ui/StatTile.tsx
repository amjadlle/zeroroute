import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";
import { Sparkline } from "./Sparkline";

type StatTileProps = {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  /** Change text, e.g. "+6%" or "−48 ms". */
  delta?: ReactNode;
  /** Whether the change is good news; drives colour and arrow. Lower latency is "positive". */
  deltaTone?: "positive" | "negative";
  /** Recent values for the inline sparkline. */
  trend?: number[];
  icon?: LucideIcon;
  className?: string;
};

/** KPI tile: label, big tabular value, optional delta, hint and sparkline. */
export function StatTile({ label, value, hint, delta, deltaTone = "positive", trend, icon: Icon, className }: StatTileProps) {
  const Arrow = deltaTone === "positive" ? TrendingUp : TrendingDown;
  return (
    <Card className={cn("grid gap-1 px-4 py-3.5", className)}>
      <span className="flex items-center gap-1.5 text-meta font-medium text-text-muted">
        {Icon && <Icon aria-hidden className="size-3.5" />}
        {label}
      </span>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-heading font-semibold tracking-tight tabular-nums">{value}</span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-meta font-semibold tabular-nums",
              deltaTone === "positive" ? "text-success-fg" : "text-danger-fg",
            )}
          >
            <Arrow aria-hidden className="size-3.5" />
            {delta}
          </span>
        )}
      </div>
      {hint && <span className="text-meta text-text-subtle">{hint}</span>}
      {trend && <Sparkline values={trend} className="mt-1" />}
    </Card>
  );
}
