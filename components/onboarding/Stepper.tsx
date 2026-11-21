import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type StepperProps = {
  steps: readonly string[];
  /** Index of the current step. */
  current: number;
  className?: string;
};

/** Numbered progress for a wizard. Steps before `current` show as done. */
export function Stepper({ steps, current, className }: StepperProps) {
  return (
    <ol aria-label="Setup progress" className={cn("grid auto-cols-fr grid-flow-col gap-2", className)}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className="grid min-w-0 justify-items-center gap-1.5 text-center">
            <span
              aria-hidden
              className={cn(
                "grid size-8 place-items-center rounded-full border text-body font-semibold",
                done && "border-success bg-success-soft text-success-fg",
                active && "border-accent bg-accent text-accent-fg",
                !done && !active && "border-border-strong bg-surface text-text-muted",
              )}
            >
              {done ? <Check className="size-4" /> : i + 1}
            </span>
            <span className={cn("truncate text-meta sm:text-body", active ? "font-semibold text-text" : "text-text-muted")}>
              {label}
              {done && <span className="sr-only"> (done)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
