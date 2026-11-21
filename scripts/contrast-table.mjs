// Prints the WCAG contrast table (markdown) for the colour tokens in app/globals.css.
// Run: node --experimental-strip-types --no-warnings scripts/contrast-table.mjs
import { readFileSync } from "node:fs";
import { tokenContrastReport } from "../lib/contrast.ts";

const { rows, failures } = tokenContrastReport(readFileSync(new URL("../app/globals.css", import.meta.url), "utf8"));
const cell = (r, min) => `${r.toFixed(2)}${r < min ? " **FAIL**" : ""}`;
console.log("| Foreground | Background | Min | Dark A | Light A | Dark B | Light B |\n|---|---|---|---|---|---|---|");
for (const { fg, bg, min, a, b } of rows) {
  const bCells = b ? b.map((r) => cell(r, min)) : ["= A", "= A"];
  console.log(`| ${fg} | ${bg} | ${min}:1 | ${[...a.map((r) => cell(r, min)), ...bCells].join(" | ")} |`);
}
console.log(failures.length ? `\n${failures.length} pair(s) below AA` : `\nAll ${rows.length} pairs pass WCAG AA in both themes and both accents.`);
process.exitCode = failures.length ? 1 : 0;
