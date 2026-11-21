"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useRovingSelection } from "./useRovingSelection";

export type TabItem = { value: string; label: ReactNode; content: ReactNode };

type TabsProps = {
  /** Accessible name of the tab list, e.g. "Install method". */
  label: string;
  items: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  panelClassName?: string;
};

/** WAI-ARIA tabs with automatic activation. For URL sync pass `useSearchParamValue` as value/onValueChange. */
export function Tabs({ label, items, value, defaultValue, onValueChange, className, panelClassName }: TabsProps) {
  const id = useId();
  const { selected, tabStop, select, onKeyDown } = useRovingSelection({
    values: items.map((item) => item.value),
    value,
    defaultValue,
    onValueChange,
  });

  return (
    <div className={className}>
      <div role="tablist" aria-label={label} className="flex gap-0.5 overflow-x-auto border-b border-border">
        {items.map((item, i) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            id={`${id}-tab-${i}`}
            aria-controls={`${id}-panel-${i}`}
            aria-selected={item.value === selected}
            tabIndex={item.value === tabStop ? 0 : -1}
            onClick={() => select(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative h-control-lg shrink-0 cursor-pointer whitespace-nowrap rounded-control px-3 text-body font-medium",
              "text-text-muted hover:text-text aria-selected:text-text",
              "after:absolute after:inset-x-2.5 after:bottom-0 after:h-0.5 after:rounded-full aria-selected:after:bg-accent",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div
          key={item.value}
          role="tabpanel"
          id={`${id}-panel-${i}`}
          aria-labelledby={`${id}-tab-${i}`}
          hidden={item.value !== selected}
          tabIndex={0}
          className={cn("rounded-control pt-4 focus-visible:outline-2 focus-visible:outline-focus-ring", panelClassName)}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
