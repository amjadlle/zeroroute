import { describe, expect, it } from "vitest";
import { PROVIDER_CATALOGS } from "@/lib/providers/catalog";
import { providers } from "@/lib/providers/providers";
import { isPaidPlan, knowledgeSourceLabel, PLAN_LIMITS, PROVIDER_COUNT, SITE_URL } from "./constants";

describe("isPaidPlan", () => {
  it("is true for an active customer on the Pro quota", () => {
    expect(isPaidPlan({ status: "active", monthly_limit: PLAN_LIMITS.pro.monthlyRequests })).toBe(true);
    expect(isPaidPlan({ status: "active", monthly_limit: 999999999 })).toBe(true);
  });

  it("is false for a free signup, which is also active", () => {
    expect(isPaidPlan({ status: "active", monthly_limit: PLAN_LIMITS.free.monthlyRequests })).toBe(false);
  });

  it("is false for canceled or paused Pro customers", () => {
    expect(isPaidPlan({ status: "canceled", monthly_limit: 10000 })).toBe(false);
    expect(isPaidPlan({ status: "paused", monthly_limit: 10000 })).toBe(false);
  });

  it("is false for missing data", () => {
    expect(isPaidPlan(null)).toBe(false);
    expect(isPaidPlan(undefined)).toBe(false);
    expect(isPaidPlan({ status: "active" })).toBe(false);
  });
});

describe("knowledgeSourceLabel", () => {
  it.each([
    ["file_upload", "File"],
    ["manual_text", "Text"],
    ["web_website", "Website"],
    ["web_raw_text", "Website"],
    ["web_google_docs", "Google Docs"],
    ["web_github_raw", "GitHub"],
    ["web_notion", "Notion"],
    ["web_crawl", "Website"],
    ["something_new", "Text"],
    [null, "Text"],
  ])("%s -> %s", (type, label) => {
    expect(knowledgeSourceLabel(type)).toBe(label);
  });
});

describe("product facts", () => {
  it("counts every provider the gateway can route to", () => {
    expect(Object.keys(PROVIDER_CATALOGS).length).toBe(PROVIDER_COUNT);
    expect(providers.length).toBe(PROVIDER_COUNT);
  });

  it("has a site URL without a trailing slash", () => {
    expect(SITE_URL).toMatch(/^https?:\/\/[^/]+(\/.*[^/])?$/);
  });
});
