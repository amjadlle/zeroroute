import { describe, expect, it } from "vitest";
import { safeHref } from "./safeHref";

describe("safeHref", () => {
  it.each([
    ["https://zeroroute.mapki.in/docs", "https://zeroroute.mapki.in/docs"],
    ["http://example.com", "http://example.com/"],
    ["  https://example.com/a?b=1  ", "https://example.com/a?b=1"],
    ["mailto:help@example.com", "mailto:help@example.com"],
    ["HTTPS://EXAMPLE.COM", "https://example.com/"],
  ])("allows %j", (url, expected) => {
    expect(safeHref(url)).toBe(expected);
  });

  it.each([
    "javascript:alert(1)",
    "JavaScript:alert(1)",
    "  jAvAsCrIpT:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0001javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "//evil.example.com",
    "/admin",
    "docs/page",
    "#top",
    "ftp://example.com",
    "",
  ])("rejects %j", (url) => {
    expect(safeHref(url)).toBeNull();
  });
});
