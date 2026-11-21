import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { contrastRatio, parseColor, tokenContrastReport } from "./contrast";

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#fff", "#fff")).toBe(1);
    // #767676 on white is the classic 4.54:1 AA threshold colour.
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("is symmetric and accepts computed rgb() strings", () => {
    expect(contrastRatio("rgb(118, 118, 118)", "#fff")).toBeCloseTo(contrastRatio("#fff", "#767676"), 10);
  });

  it("rejects colours it cannot parse", () => {
    expect(() => parseColor("oklch(0.5 0.1 200)")).toThrow();
  });
});

describe("design tokens in app/globals.css", () => {
  it("meet WCAG AA for every pair, in both themes and both accents", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    const { rows, failures } = tokenContrastReport(css);
    expect(rows.length).toBeGreaterThan(30);
    expect(failures).toEqual([]);
  });
});
