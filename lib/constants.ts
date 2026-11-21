// Product facts used in copy. Glossary terms live in GLOSSARY.md.
import { PROVIDER_CATALOGS } from "@/lib/providers/catalog";

// Production domain per DEPLOYMENT.md / README. `zeroroute.app` (OpenRouter referer, admin snippets) is not deployed.
// NEXT_PUBLIC_APP_URL is readable in the browser; APP_URL only on the server.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_URL ||
  "https://zeroroute.mapki.in"
).replace(/\/+$/, "");

// Mirrors the values written by signup (free), checkout/webhook (pro) and admin-created bots (unlimited).
export const PLAN_LIMITS = {
  free: { monthlyRequests: 500, allowedDomains: 1, priceUsd: 0 },
  pro: { monthlyRequests: 10000, allowedDomains: 3, priceUsd: 2 },
} as const;
export const UNLIMITED_MONTHLY_REQUESTS = 999999999;

export const PROVIDER_COUNT = Object.keys(PROVIDER_CATALOGS).length;

export type SubscriptionStatus = "active" | "paused" | "canceled";

/**
 * True when the customer currently has a working paid plan.
 * Status alone is not enough: signup also writes status "active" (with the free limit),
 * so "active" plus the Pro quota is what a successful checkout/webhook produces.
 * Paused (payment failed) and canceled customers are not paid, even though they keep the Pro quota.
 * Ceiling: there is no plan column; add one if more paid tiers appear.
 */
export function isPaidPlan(
  profile: { status?: string | null; monthly_limit?: number | null } | null | undefined
): boolean {
  return (
    profile?.status === "active" &&
    Number(profile.monthly_limit ?? 0) >= PLAN_LIMITS.pro.monthlyRequests
  );
}

export const PLAN_LABELS = { free: "Free", pro: "Pro" } as const;

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "Active",
  paused: "Payment issue",
  canceled: "Canceled",
};

// Values stored in knowledge_documents.type. Crawled sources are `web_${LiveSourceType}`.
export const KNOWLEDGE_SOURCE_LABELS: Record<string, string> = {
  file_upload: "File",
  manual_text: "Text",
  web_website: "Website",
  web_raw_text: "Website",
  web_google_docs: "Google Docs",
  web_github_raw: "GitHub",
  web_notion: "Notion",
};

export function knowledgeSourceLabel(type: string | null | undefined): string {
  if (type && KNOWLEDGE_SOURCE_LABELS[type]) return KNOWLEDGE_SOURCE_LABELS[type];
  return type?.startsWith("web_") ? "Website" : "Text";
}
