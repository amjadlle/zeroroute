import { beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAs, loginAsAdmin, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

// The crawler (and its SSRF guard) has its own tests; here it stands in for the network.
const crawler = vi.hoisted(() => ({
  crawlSourceUrl: vi.fn(async (url: string, title?: string) => ({
    url,
    normalizedUrl: url.replace(/\/$/, ""),
    sourceType: "website",
    title: title || "Page",
    content: "crawled text",
    charCount: 12,
  })),
}));
vi.mock("@/lib/crawler", () => crawler);

const { POST } = await import("./route");
const crawl = (body: unknown) => POST(req("/api/knowledge/crawl", { body }));
const docs = async () =>
  (await (await testDb()).execute("SELECT customer_key, source_url, title FROM knowledge_documents ORDER BY created_at")).rows.map((r) => ({ ...r }));

beforeEach(async () => {
  await seedCustomers();
  crawler.crawlSourceUrl.mockClear();
});

it("rejects a request without a session and never crawls", async () => {
  expect((await crawl({ url: "https://example.com" })).status).toBe(401);
  expect((await POST(req("/api/knowledge/crawl", { body: { url: "https://example.com" }, bearer: A.key }))).status).toBe(401);
  expect(crawler.crawlSourceUrl).not.toHaveBeenCalled();
});

it("requires a URL", async () => {
  loginAs(A);
  expect((await crawl({ url: "  " })).status).toBe(400);
  expect(crawler.crawlSourceUrl).not.toHaveBeenCalled();
});

it("returns 422 with the crawler's message when the page can't be fetched", async () => {
  loginAs(A);
  crawler.crawlSourceUrl.mockRejectedValueOnce(new Error("Access to private addresses is prohibited."));
  const res = await crawl({ url: "http://169.254.169.254/" });
  expect(res.status).toBe(422);
  expect((await res.json()).error).toMatch(/prohibited/);
  expect(await docs()).toEqual([]);
});

it("stores the page for the session owner and re-syncs the same URL in place", async () => {
  loginAs(A);
  expect((await crawl({ url: "https://example.com/" })).status).toBe(200);
  await crawl({ url: "https://example.com/", title: "Renamed" });
  expect(await docs()).toEqual([{ customer_key: A.key, source_url: "https://example.com", title: "Renamed" }]);
});

it("keeps the same URL separate per customer and ignores a customer's target_key", async () => {
  loginAs(A);
  await crawl({ url: "https://example.com", target_key: B.key, bot_id: B.bot });
  loginAs(B);
  await crawl({ url: "https://example.com" });
  expect((await docs()).map((d) => d.customer_key)).toEqual([A.key, B.key]);
});

it("lets the admin crawl into a customer's knowledge base by bot id", async () => {
  await loginAsAdmin();
  await crawl({ url: "https://example.com", bot_id: B.bot });
  expect((await docs())[0].customer_key).toBe(B.key);
});
