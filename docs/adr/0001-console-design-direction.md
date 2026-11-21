# 0001. Console design direction: Graphite+

- Status: accepted (owner pick, 2026-11-21)
- Issues: #1 (design tokens), parent spec #47
- Prototype: branch `prototype/console-design-directions`, `prototypes/console-design/index.html` (throwaway, never merged to main)

## Context

The admin and user consoles were near-black screens with low-contrast grey text, and red stood for "primary", "enabled", "error" and "success" all at once. Before building the shared UI library (M1), we prototyped four directions (Graphite, Daylight, Monolith, Harbor), each with three accents in light and dark, across every console section. The owner had to pick one before the token PR (#56) could settle the palette.

## Decision

We go with **Graphite+**: a calm, compact, neutral console.

- **Colour:** OKLCH tokens. Accent **Iris** (hue 277): light `oklch(.52 .17 277)`, dark `oklch(.76 .17 277)`, hover ∓.05 L, accent text `oklch(.99 .005 277)` / `oklch(.19 .04 277)`. Neutrals carry a faint Iris tint (chroma ≈ .009). Red is used only for danger. The teal alternative is dropped.
- **Accent use:** primary actions, the active nav item, focus rings, switches and charts. Nothing else.
- **Themes:** dark is the default; light is fully supported (OS preference or `data-theme` on `<html>`).
- **Type:** Geist and Geist Mono for the consoles (`font-ui`, `font-ui-mono`). Body text is 13.5px, with 12px as the minimum. The landing page keeps Plus Jakarta Sans.
- **Density:** control radius 6px, card radius 10px. Control heights are 26 / 32 / 36px (sm / md / lg), with 32px as the default.

Tokens live in `app/globals.css`; `/design` (dev-only) previews them.

## Consequences

- Every token text/background pair must stay WCAG AA in both themes. `lib/contrast.test.ts` enforces this, so a token edit that breaks contrast fails `npm test`.
- Status colours (success, warning, info) must stay visually distinct from Iris. Only danger may be red.
- The landing page keeps its own fonts and the legacy `dark-*` / `brand-*` aliases until M5 moves it onto these tokens.
- The console shell (#9) applies `font-ui`; components (#3–#9) use the compact control heights and radii instead of picking their own.
- To change the accent later, edit the four accent tokens and re-run the contrast test.
