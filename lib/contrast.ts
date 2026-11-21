// WCAG 2.x contrast ratio. Accepts #rgb, #rrggbb or rgb()/rgba() strings (alpha ignored).
export function parseColor(input: string): [number, number, number] {
  const s = input.trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  throw new Error(`Unsupported colour: ${input}`);
}

function luminance(color: string): number {
  const [r, g, b] = parseColor(color).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi + 0.05) / (lo + 0.05);
}

// Token pairs that must pass WCAG AA: [foreground, background, minimum ratio].
// 4.5 = normal text, 3 = UI boundaries and focus indicators. "white" means #ffffff.
export const CONTRAST_PAIRS: ReadonlyArray<readonly [string, string, number]> = [
  ...(["text", "text-muted", "text-subtle"] as const).flatMap((fg) =>
    (["bg", "surface", "surface-raised", "surface-sunken"] as const).map((bg) => [fg, bg, 4.5] as const),
  ),
  ["accent-fg", "accent", 4.5],
  ["accent-fg", "accent-hover", 4.5],
  ["accent", "bg", 4.5],
  ["accent", "surface", 4.5],
  ...(["success", "warning", "danger", "info"] as const).flatMap((s) => [
    [`${s}-fg`, `${s}-soft`, 4.5] as const,
    [`${s}-fg`, "surface", 4.5] as const,
    [s, "surface", 3] as const,
  ]),
  ["white", "danger", 4.5],
  ["border-strong", "surface", 3],
  ["border-strong", "surface-sunken", 3],
  ["focus-ring", "bg", 3],
  ["focus-ring", "surface", 3],
];

type Tokens = Record<string, [light: string, dark: string]>;

function colorTokens(css: string, selector: string): Tokens {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`Block not found: ${selector}`);
  const body = css.slice(start, css.indexOf("}", start));
  const re = /--color-([\w-]+):\s*light-dark\((#[0-9a-f]+),\s*(#[0-9a-f]+)\)/gi;
  return Object.fromEntries([...body.matchAll(re)].map((m) => [m[1], [m[2], m[3]]]));
}

// Ratios for every CONTRAST_PAIRS entry in both themes and both accent options, read from globals.css.
// Columns: dark A, light A, dark B, light B (B is null when the pair has no accent token).
export function tokenContrastReport(css: string) {
  const a = colorTokens(css, "@theme static");
  const bOverrides = colorTokens(css, '[data-accent="b"]');
  const b = { ...a, ...bOverrides };
  const ratios = (t: Tokens, fg: string, bg: string) =>
    ([1, 0] as const).map((scheme) => {
      const c = (name: string) => (name === "white" ? "#ffffff" : t[name][scheme]);
      return contrastRatio(c(fg), c(bg));
    });
  const rows = CONTRAST_PAIRS.map(([fg, bg, min]) => {
    const usesAccent = fg in bOverrides || bg in bOverrides;
    return { fg, bg, min, a: ratios(a, fg, bg), b: usesAccent ? ratios(b, fg, bg) : null };
  });
  const failures = rows.filter((r) => [...r.a, ...(r.b ?? [])].some((x) => x < r.min));
  return { rows, failures };
}
