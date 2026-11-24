// WCAG 2.x contrast ratio.
// parseColor accepts #rgb, #rrggbb, rgb()/rgba() and oklch() (alpha ignored) and returns sRGB 0-255.
export function parseColor(input: string): [number, number, number] {
  const s = input.trim().toLowerCase();
  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
  }
  const rgb = s.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  const ok = s.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/);
  if (ok) return oklchToSrgb(Number(ok[1]) / (ok[2] ? 100 : 1), Number(ok[3]), Number(ok[4]));
  throw new Error(`Unsupported colour: ${input}`);
}

// OKLCH -> sRGB (Björn Ottosson's OKLab matrices), clipped to the sRGB gamut like browsers do for display.
function oklchToSrgb(L: number, C: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return linear.map((v) => {
    const c = Math.min(1, Math.max(0, v));
    return 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  }) as [number, number, number];
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

/** True when white text reads better than black on this fill (the two contrasts cross at luminance ≈ 0.179). */
export function prefersWhiteText(bg: string): boolean {
  return luminance(bg) <= 0.179;
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
  ["accent", "surface-raised", 4.5],
  ["accent", "accent-soft", 4.5],
  ["text", "accent-soft", 4.5],
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

const COLOR = String.raw`(#[0-9a-f]+|oklch\([^)]*\))`;

// Ratios for every CONTRAST_PAIRS entry in both themes, read from the `@theme static` block of globals.css.
export function tokenContrastReport(css: string) {
  const start = css.indexOf("@theme static");
  if (start < 0) throw new Error("@theme static block not found");
  const body = css.slice(start, css.indexOf("}", start));
  const re = new RegExp(String.raw`--color-([\w-]+):\s*light-dark\(\s*${COLOR}\s*,\s*${COLOR}\s*\)`, "gi");
  const tokens: Record<string, [light: string, dark: string]> = Object.fromEntries(
    [...body.matchAll(re)].map((m) => [m[1], [m[2], m[3]]]),
  );
  const color = (name: string, scheme: 0 | 1) => {
    if (name === "white") return "#ffffff";
    if (!tokens[name]) throw new Error(`Token not found in globals.css: --color-${name}`);
    return tokens[name][scheme];
  };
  const rows = CONTRAST_PAIRS.map(([fg, bg, min]) => ({
    fg,
    bg,
    min,
    dark: contrastRatio(color(fg, 1), color(bg, 1)),
    light: contrastRatio(color(fg, 0), color(bg, 0)),
  }));
  const failures = rows.filter((r) => r.dark < r.min || r.light < r.min);
  return { rows, failures };
}
