"use client";

import { useEffect, useRef, useState } from "react";
import { CONTRAST_PAIRS, contrastRatio } from "@/lib/contrast";
import { SECTIONS } from "./sections";

type Theme = "system" | "dark" | "light";

const SWATCHES = [
  ["Neutrals", ["bg", "surface", "surface-raised", "surface-sunken", "border", "border-strong", "text", "text-muted", "text-subtle"]],
  ["Accent", ["accent", "accent-hover", "accent-fg", "focus-ring"]],
  ["Status", ["success", "success-soft", "success-fg", "warning", "warning-soft", "warning-fg", "danger", "danger-soft", "danger-fg", "info", "info-soft", "info-fg"]],
] as const;

const TYPE_SCALE = [
  ["text-display", "Display 28/34", "text-display font-semibold tracking-tight"],
  ["text-heading", "Heading 22/28", "text-heading font-semibold tracking-tight"],
  ["text-title", "Title 17/24", "text-title font-semibold"],
  ["text-body-lg", "Body large 15/22", "text-body-lg"],
  ["text-body", "Body 13.5/20 (default console text)", "text-body"],
  ["text-meta", "Meta 12/16 (minimum size)", "text-meta text-text-muted"],
] as const;

const cssVar = (name: string) => (name === "white" ? "white" : `var(--color-${name})`);

function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: ReadonlyArray<readonly [T, string]>;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex items-center gap-2">
      <legend className="sr-only">{label}</legend>
      <span className="text-meta text-text-muted" aria-hidden>{label}</span>
      <div className="flex rounded-control border border-border-strong p-0.5 bg-surface-sunken">
        {options.map(([v, text]) => (
          <label
            key={v}
            className={`h-control-sm px-3 inline-flex items-center rounded-[calc(var(--radius-control)-2px)] text-body cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring ${
              value === v ? "bg-accent text-accent-fg" : "text-text-muted hover:text-text"
            }`}
          >
            <input type="radio" name={label} value={v} checked={value === v} onChange={() => onChange(v)} className="sr-only" />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DesignPreview() {
  const [theme, setTheme] = useState<Theme>("system");
  const pairsRef = useRef<HTMLTableSectionElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);

    // Measure the colours the browser actually resolved, so the ratios always match the live theme.
    const measure = () =>
      pairsRef.current?.querySelectorAll<HTMLElement>("[data-sample]").forEach((el) => {
        const { color, backgroundColor } = getComputedStyle(el);
        const min = Number(el.dataset.min);
        const out = el.closest("tr")!.querySelector("output")!;
        let ratio: number;
        try {
          ratio = contrastRatio(color, backgroundColor);
        } catch {
          out.textContent = `n/a (${color})`;
          return;
        }
        out.textContent = `${ratio.toFixed(2)} ${ratio >= min ? "pass" : "FAIL"}`;
        out.className = ratio >= min ? "text-success-fg" : "text-danger-fg font-bold";
      });
    measure();
    const media = matchMedia("(prefers-color-scheme: light)");
    media.addEventListener("change", measure);
    return () => {
      media.removeEventListener("change", measure);
      root.removeAttribute("data-theme");
    };
  }, [theme]);

  return (
    <main className="min-h-screen bg-bg text-text text-body font-ui">
      <header className="border-b border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-title font-semibold">Design tokens</h1>
            <p className="text-meta text-text-subtle">Graphite+ · Ember accent · Geist. Dev-only preview, 404 in production.</p>
          </div>
          <Segmented label="Theme" value={theme} onChange={setTheme} options={[["system", "System"], ["dark", "Dark"], ["light", "Light"]]} />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
        <section aria-labelledby="colours" className="space-y-6">
          <h2 id="colours" className="text-heading font-semibold">Colour</h2>
          {SWATCHES.map(([group, names]) => (
            <div key={group} className="space-y-3">
              <h3 className="text-meta font-semibold uppercase tracking-wide text-text-muted">{group}</h3>
              <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {names.map((name) => (
                  <li key={name} className="rounded-card border border-border bg-surface overflow-hidden">
                    <div className="h-14 border-b border-border" style={{ background: cssVar(name) }} />
                    <code className="block px-3 py-2 text-meta text-text-muted">{name}</code>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section aria-labelledby="contrast" className="space-y-3">
          <h2 id="contrast" className="text-heading font-semibold">Contrast (live, WCAG AA)</h2>
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="w-full text-left">
              <thead className="text-meta text-text-muted border-b border-border">
                <tr>
                  <th className="px-3 py-2 font-semibold">Sample</th>
                  <th className="px-3 py-2 font-semibold">Foreground on background</th>
                  <th className="px-3 py-2 font-semibold">Min</th>
                  <th className="px-3 py-2 font-semibold">Ratio</th>
                </tr>
              </thead>
              <tbody ref={pairsRef} className="divide-y divide-border">
                {CONTRAST_PAIRS.map(([fg, bg, min]) => (
                  <tr key={`${fg}/${bg}`}>
                    <td className="px-3 py-2">
                      <span
                        data-sample
                        data-min={min}
                        className="inline-block rounded-control px-2 py-1 font-semibold border border-border"
                        style={{ color: cssVar(fg), background: cssVar(bg) }}
                      >
                        Aa
                      </span>
                    </td>
                    <td className="px-3 py-2"><code className="text-meta">{fg}</code> <span className="text-text-subtle">on</span> <code className="text-meta">{bg}</code></td>
                    <td className="px-3 py-2 text-text-muted">{min}:1</td>
                    <td className="px-3 py-2 font-ui-mono text-meta"><output /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="type" className="space-y-3">
          <h2 id="type" className="text-heading font-semibold">Type scale</h2>
          <ul className="rounded-card border border-border bg-surface divide-y divide-border">
            {TYPE_SCALE.map(([token, label, cls]) => (
              <li key={token} className="px-4 py-3 flex flex-wrap items-baseline justify-between gap-2">
                <span className={cls}>{label}</span>
                <code className="text-meta text-text-subtle">{token}</code>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="shape" className="grid gap-6 md:grid-cols-3">
          <h2 id="shape" className="sr-only">Shape and size</h2>
          <div className="space-y-3">
            <h3 className="text-title font-semibold">Control heights</h3>
            {(["sm", "md", "lg"] as const).map((s) => (
              <div key={s} className={`${{ sm: "h-control-sm", md: "h-control-md", lg: "h-control-lg" }[s]} rounded-control bg-surface-sunken border border-border-strong flex items-center px-3 text-text-muted`}>
                h-control-{s} · {{ sm: 26, md: 32, lg: 36 }[s]}px
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <h3 className="text-title font-semibold">Radius &amp; shadow</h3>
            <div className="h-control-lg rounded-control bg-surface-raised border border-border shadow-raised flex items-center px-3">rounded-control · shadow-raised</div>
            <div className="p-4 rounded-card bg-surface-raised border border-border shadow-overlay">rounded-card · shadow-overlay</div>
            <div className="inline-flex px-3 py-1 rounded-full bg-accent text-accent-fg text-meta font-semibold">rounded-full</div>
          </div>
          <div className="space-y-2">
            <h3 className="text-title font-semibold">Spacing (4px base)</h3>
            {[1, 2, 3, 4, 6, 8, 12, 16].map((n) => (
              <div key={n} className="flex items-center gap-3 text-meta text-text-muted">
                <code className="w-10">{n}</code>
                <span className="h-3 rounded-sm bg-accent" style={{ width: `calc(var(--spacing) * ${n})` }} />
                <span>{n * 4}px</span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="status" className="space-y-3">
          <h2 id="status" className="text-heading font-semibold">Status and focus</h2>
          <div className="flex flex-wrap gap-3">
            {(["success", "warning", "danger", "info"] as const).map((s) => (
              <span key={s} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-meta font-semibold ${{ success: "bg-success-soft text-success-fg", warning: "bg-warning-soft text-warning-fg", danger: "bg-danger-soft text-danger-fg", info: "bg-info-soft text-info-fg" }[s]}`}>
                <span className={`size-2 rounded-full ${{ success: "bg-success", warning: "bg-warning", danger: "bg-danger", info: "bg-info" }[s]}`} />
                {s}
              </span>
            ))}
            <a href="#colours" className="text-accent underline underline-offset-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
              Accent link (Tab to see the focus ring)
            </a>
          </div>
        </section>

        {SECTIONS.map(({ id, title, Component }) => (
          <section key={id} aria-labelledby={id} className="space-y-3">
            <h2 id={id} className="text-heading font-semibold">{title}</h2>
            <Component />
          </section>
        ))}
      </div>
    </main>
  );
}
