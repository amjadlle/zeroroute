import { describe, expect, it } from "vitest";
import { isBrandColor, parseAppearance } from "./brand";

describe("parseAppearance", () => {
  it("accepts and normalises a hex brand colour", () => {
    expect(parseAppearance("brand_color", " #4F46E5 ")).toEqual({ value: "#4f46e5" });
  });

  it("clears on empty or null", () => {
    expect(parseAppearance("brand_color", "")).toEqual({ value: null });
    expect(parseAppearance("logo_url", null)).toEqual({ value: null });
  });

  it.each(["red", "#fff", "#12345g", "url(x)", "#123456;background:red"])("rejects colour %s", (c) => {
    expect(parseAppearance("brand_color", c)).toHaveProperty("error");
    expect(isBrandColor(c)).toBe(false);
  });

  it("accepts http(s) logo URLs only", () => {
    expect(parseAppearance("logo_url", "https://example.com/logo.png")).toEqual({ value: "https://example.com/logo.png" });
    for (const bad of ["javascript:alert(1)", "data:image/png;base64,AA", "mailto:a@b.co", "/logo.png", `https://e.com/${"a".repeat(500)}`]) {
      expect(parseAppearance("logo_url", bad)).toHaveProperty("error");
    }
  });
});
