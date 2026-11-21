import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { StatusDot, type Tone } from "./StatusDot";

// No accent-soft token yet, so the accent badge tints with bg-accent/15.
const TONE: Record<Tone, string> = {
  neutral: "bg-surface-sunken text-text-muted",
  accent: "bg-accent/15 text-accent",
  success: "bg-success-soft text-success-fg",
  warning: "bg-warning-soft text-warning-fg",
  danger: "bg-danger-soft text-danger-fg",
  info: "bg-info-soft text-info-fg",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  dot?: boolean;
  /** Pulses the dot (implies `dot`). */
  pulse?: boolean;
};

export function Badge({ tone = "neutral", dot, pulse, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 items-center gap-1.5 whitespace-nowrap rounded-full px-2 text-meta font-medium",
        TONE[tone],
        className,
      )}
      {...props}
    >
      {(dot || pulse) && <StatusDot tone={tone} pulse={pulse} />}
      {children}
    </span>
  );
}
