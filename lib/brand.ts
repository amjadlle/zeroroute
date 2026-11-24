import { safeHref } from "./safeHref";

const HEX = /^#[0-9a-f]{6}$/i;

/** The widget's colour when none is saved. public/widget.js repeats it (it can't import); a test keeps them equal. */
export const DEFAULT_BRAND_COLOR = "#ef4444";

/** One-click colours offered in the chatbot settings, after the default. All keep white text readable (AA). */
export const BRAND_COLOR_PRESETS = [
  { name: "Blue", value: "#007abe" },
  { name: "Purple", value: "#8557c8" },
  { name: "Green", value: "#008856" },
  { name: "Orange", value: "#c55123" },
  { name: "Graphite", value: "#282e38" },
] as const;

/** True for a #rrggbb colour, the only form the widget's colour maths understands. */
export const isBrandColor = (v: unknown): v is string => typeof v === "string" && HEX.test(v.trim());

/**
 * Validates chatbot appearance input from the persona API. Empty clears the value (null); anything else
 * must be a #rrggbb colour or an absolute http(s) image URL of at most 500 characters.
 */
export function parseAppearance(field: "brand_color" | "logo_url", raw: unknown): { value: string | null } | { error: string } {
  const v = raw == null ? "" : String(raw).trim();
  if (!v) return { value: null };
  if (field === "brand_color") {
    return isBrandColor(v) ? { value: v.toLowerCase() } : { error: `Brand colour must be a hex colour like ${DEFAULT_BRAND_COLOR}.` };
  }
  const href = v.length <= 500 ? safeHref(v) : null;
  return href?.startsWith("http") ? { value: href } : { error: "Logo must be a web address starting with https://." };
}
