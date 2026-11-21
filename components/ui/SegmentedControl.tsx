"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useRovingSelection } from "./useRovingSelection";

export type SegmentedOption = { value: string; label: ReactNode; icon?: ReactNode };

type SegmentedControlProps = {
  /** Accessible name of the group, e.g. "Status". */
  label: string;
  options: readonly SegmentedOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  size?: "sm" | "md";
  className?: string;
};

/** Single-choice filter with radiogroup semantics. Arrow keys (and Home/End) move the selection. */
export function SegmentedControl({ label, options, value, defaultValue, onValueChange, size = "md", className }: SegmentedControlProps) {
  const { selected, tabStop, select, onKeyDown } = useRovingSelection({
    values: options.map((option) => option.value),
    value,
    defaultValue,
    onValueChange,
    vertical: true,
  });

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex gap-0.5 rounded-card border border-border bg-surface-sunken p-0.5", className)}
    >
      {options.map((option, i) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === selected}
          tabIndex={option.value === tabStop ? 0 : -1}
          onClick={() => select(option.value)}
          onKeyDown={(e) => onKeyDown(e, i)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-control font-medium",
            size === "sm" ? "h-5 px-2 text-meta" : "h-control-sm px-3 text-body",
            "text-text-muted hover:text-text",
            "aria-checked:bg-surface aria-checked:text-text aria-checked:shadow-sm aria-checked:ring-1 aria-checked:ring-border",
            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring",
          )}
        >
          {option.icon && <span aria-hidden className="inline-flex shrink-0">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
}
