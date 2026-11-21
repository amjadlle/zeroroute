// Prints the WCAG contrast table (markdown) for the colour tokens in app/globals.css.
// Run: node --experimental-strip-types --no-warnings scripts/contrast-table.mjs
import { readFileSync } from "node:fs";
import { tokenContrastReport } from "../lib/contrast.ts";

const { rows, failures } = tokenContrastReport(readFileSync(new URL("../app/globals.css", import.meta.url), "utf8"));
const cell = (r, min) => `${r.toFixed(2)}${r < min ? " **FAIL**" : ""}`;
console.log("| Foreground | Background | Min | Dark | Light |\n|---|---|---|---|---|");
for (const { fg, bg, min, dark, light } of rows) console.log(`| ${fg} | ${bg} | ${min}:1 | ${cell(dark, min)} | ${cell(light, min)} |`);
console.log(failures.length ? `\n${failures.length} pair(s) below AA` : `\nAll ${rows.length} pairs pass WCAG AA in both themes.`);
process.exitCode = failures.length ? 1 : 0;
