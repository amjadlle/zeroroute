import { SITE_URL } from "./constants";
import { safeHref } from "./safeHref";

/** Escapes a value for a double- or single-quoted HTML attribute. */
export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export type EmbedOptions = {
  botId: string;
  /** Chatbot name shown in its header. */
  title?: string;
  color?: string;
  logo?: string;
  greeting?: string;
  /** Suggested questions. The widget splits data-prompts on commas, so commas inside a question are dropped. */
  prompts?: string[];
  origin?: string;
};

/** The embed snippet a customer pastes into their site. Every value is attribute-escaped. */
export function buildEmbedSnippet({ botId, title, color, logo, greeting, prompts, origin = SITE_URL }: EmbedOptions): string {
  const logoUrl = logo ? safeHref(logo) : null;
  const questions = (prompts ?? []).map((p) => p.replace(/\s*,\s*/g, " ").trim()).filter(Boolean);
  const attrs: [string, string | null | undefined][] = [
    ["src", `${origin}/widget.js`],
    ["data-bot-id", botId],
    ["data-title", title?.trim()],
    ["data-color", color?.trim()],
    ["data-logo", logoUrl?.startsWith("http") ? logoUrl : null],
    ["data-greeting", greeting?.trim()],
    ["data-prompts", questions.join(", ")],
  ];
  const lines = attrs.filter(([, v]) => v).map(([k, v]) => `  ${k}="${escapeAttr(v!)}"`);
  return `<script\n${lines.join("\n")}\n  defer>\n</script>`;
}

/** Suggested questions are stored as a JSON array string; anything else reads as none. */
export function parsePrompts(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((p): p is string => typeof p === "string");
  if (typeof raw !== "string" || !raw) return [];
  try {
    return parsePrompts(JSON.parse(raw));
  } catch {
    return [];
  }
}
