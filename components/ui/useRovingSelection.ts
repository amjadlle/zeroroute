import { useState, type KeyboardEvent } from "react";

type Options = {
  values: readonly string[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Radio groups also move with ArrowUp/ArrowDown; horizontal tabs only use ArrowLeft/ArrowRight. */
  vertical?: boolean;
};

/**
 * Shared state and keyboard handling for single-select groups (Tabs, SegmentedControl):
 * controlled or uncontrolled value, roving tabindex, arrows wrap, Home/End, selection follows focus.
 * The items must be sibling elements in the same order as `values`.
 */
export function useRovingSelection({ values, value, defaultValue, onValueChange, vertical }: Options) {
  const [inner, setInner] = useState(defaultValue ?? values[0]);
  const selected = value ?? inner;
  // If nothing valid is selected, the first item keeps the group reachable with Tab.
  const tabStop = values.includes(selected) ? selected : values[0];

  const select = (next: string) => {
    if (value === undefined) setInner(next);
    if (next !== selected) onValueChange?.(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>, index: number) => {
    const n = values.length;
    const keys: Record<string, number> = { ArrowLeft: index - 1, ArrowRight: index + 1, Home: 0, End: n - 1 };
    if (vertical) Object.assign(keys, { ArrowUp: index - 1, ArrowDown: index + 1 });
    const target = keys[e.key];
    if (target === undefined) return;
    e.preventDefault();
    const next = (target + n) % n;
    (e.currentTarget.parentElement?.children[next] as HTMLElement | undefined)?.focus();
    select(values[next]);
  };

  return { selected, tabStop, select, onKeyDown };
}
