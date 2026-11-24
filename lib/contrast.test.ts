import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { contrastRatio, parseColor, prefersWhiteText, tokenContrastReport } from "./contrast";

describe("prefersWhiteText", () => {
  it("picks whichever of white or black contrasts more", () => {
    for (const bg of ["#4f46e5", "#000", "#dc2626", "#0d9488", "#fde047", "#fff", "#38bdf8", "#777", "#767676"]) {
      expect(prefersWhiteText(bg)).toBe(contrastRatio("#fff", bg) >= contrastRatio("#000", bg));
    }
    expect(prefersWhiteText("#4f46e5")).toBe(true);
    expect(prefersWhiteText("#fde047")).toBe(false);
  });
});

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

  it("converts oklch() to sRGB", () => {
    // Reference points from CSS Color 4: pure red and mid grey.
    parseColor("oklch(0.627955 0.257683 29.2339)").forEach((v, i) => expect(v).toBeCloseTo([255, 0, 0][i], 0));
    parseColor("oklch(59.987% 0 0)").forEach((v) => expect(v).toBeCloseTo(128, 0));
  });

  it("rejects colours it cannot parse", () => {
    expect(() => parseColor("lab(50 20 30)")).toThrow();
  });
});

describe("design tokens in app/globals.css", () => {
  it("meet WCAG AA for every pair, in both themes", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    const { rows, failures } = tokenContrastReport(css);
    expect(rows.length).toBeGreaterThan(30);
    expect(failures).toEqual([]);
  });
});
