# components/ui

Shared console primitives (M1, spec #47, design direction in docs/adr/0001-console-design-direction.md).

- Style only with the semantic tokens in `app/globals.css` (no hex, no `text-[Npx]`).
- One component per file, named export, props typed, `className` passthrough merged with `cn()` from `@/lib/cn`.
- Accessibility is part of the API: labels, roles, focus-visible ring, keyboard support.
- Each component gets a behaviour test next to it (`*.test.tsx`) and live examples in `app/design/sections/<group>.tsx`.
- Visual reference: the Graphite+ direction in `prototypes/console-design/index.html` on branch `prototype/console-design-directions`.
