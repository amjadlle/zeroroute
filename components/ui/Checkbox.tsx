import type { ComponentProps, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

type CheckboxProps = Omit<ComponentProps<"input">, "type"> & { label?: ReactNode };

/** Native checkbox with a token-styled box (native disabled boxes fall below 3:1). */
export function Checkbox({ label, className, ...props }: CheckboxProps) {
  const box = (
    <span className="relative inline-flex size-4 shrink-0">
      <input
        type="checkbox"
        className={cn(
          "peer size-4 cursor-pointer appearance-none rounded-sm border border-border-strong bg-surface-sunken checked:border-accent checked:bg-accent",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring aria-invalid:border-danger disabled:cursor-not-allowed",
          className,
        )}
        {...props}
      />
      <Check
        aria-hidden="true"
        strokeWidth={3}
        className="pointer-events-none absolute inset-0 size-4 p-0.5 text-accent-fg opacity-0 peer-checked:opacity-100"
      />
    </span>
  );
  if (!label) return box;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-body text-text has-disabled:cursor-not-allowed has-disabled:text-text-muted">
      {box}
      {label}
    </label>
  );
}
