"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type SwitchProps = Omit<ComponentProps<"button">, "onChange" | "value" | "children"> & {
  /** Controlled state; omit and use defaultChecked for uncontrolled. */
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: ReactNode;
};

/** On/off toggle. A native button, so Space and Enter already fire click. */
export function Switch({ checked, defaultChecked = false, onCheckedChange, label, className, onClick, ...props }: SwitchProps) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;

  const button = (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        setInner(!on);
        onCheckedChange?.(!on);
      }}
      className={cn(
        "group relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full bg-border-strong p-0.5 transition-colors aria-checked:bg-accent",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="size-4 rounded-full bg-surface shadow-raised transition-transform motion-reduce:transition-none group-aria-checked:translate-x-4 group-aria-checked:bg-accent-fg"
      />
    </button>
  );
  if (!label) return button;
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-body text-text has-disabled:cursor-not-allowed has-disabled:text-text-muted">
      {button}
      {label}
    </label>
  );
}
