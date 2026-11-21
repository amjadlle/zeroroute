import { cn } from "@/lib/cn";

export type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const FILL: Record<Tone, string> = {
  neutral: "bg-text-subtle",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
};

type StatusDotProps = {
  tone?: Tone;
  /** Ping animation for "live" states; only runs when the user allows motion. */
  pulse?: boolean;
  /** Accessible name when the dot stands alone. Without it the dot is decorative. */
  label?: string;
  className?: string;
};

export function StatusDot({ tone = "neutral", pulse, label, className }: StatusDotProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative inline-flex size-2 shrink-0", className)}
    >
      {pulse && <span className={cn("absolute inset-0 rounded-full opacity-75 motion-safe:animate-ping", FILL[tone])} />}
      <span className={cn("relative size-2 rounded-full", FILL[tone])} />
    </span>
  );
}
