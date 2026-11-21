import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

let ip = 0;
const checkout = (body?: string, from = `198.51.100.${++ip}`) =>
  POST(new NextRequest("http://localhost/api/checkout", { method: "POST", headers: { "x-real-ip": from }, body }));
const sentBody = (f: ReturnType<typeof vi.fn>) => JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);

beforeEach(() => {
  process.env.APP_URL = "https://app.example.com";
  process.env.DODO_API_KEY = "test_key";
  process.env.DODO_PRODUCT_ID = "pdt_test";
  delete process.env.DODO_CHECKOUT_URL;
  delete process.env.DODO_ENVIRONMENT;
});

afterEach(() => vi.unstubAllGlobals());

it("creates a test-mode checkout for the buyer and returns its URL", async () => {
  const fetchMock = vi.fn(async () => Response.json({ checkout_url: "https://checkout.test/s_1" }));
  vi.stubGlobal("fetch", fetchMock);

  const res = await checkout(JSON.stringify({ email: "buyer@example.com", name: "Buyer" }));
  expect(await res.json()).toEqual({ checkout_url: "https://checkout.test/s_1" });

  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("https://test.dodopayments.com/checkouts");
  expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test_key");
  expect(sentBody(fetchMock)).toMatchObject({
    product_cart: [{ product_id: "pdt_test", quantity: 1 }],
    customer: { email: "buyer@example.com", name: "Buyer" },
  });
});

it("omits the customer when no email is given and tolerates a bad body", async () => {
  const fetchMock = vi.fn(async () => Response.json({ checkout_url: "https://checkout.test/s_2" }));
  vi.stubGlobal("fetch", fetchMock);
  expect((await checkout("{not json")).status).toBe(200);
  expect(sentBody(fetchMock).customer).toBeUndefined();
});

it("uses the live API in live mode", async () => {
  process.env.DODO_ENVIRONMENT = "live_mode";
  const fetchMock = vi.fn(async () => Response.json({ checkout_url: "https://checkout.live/s" }));
  vi.stubGlobal("fetch", fetchMock);
  await checkout("{}");
  expect((fetchMock.mock.calls[0] as unknown as [string])[0]).toBe("https://live.dodopayments.com/checkouts");
});

it("falls back to the static buy link without an API key, on an API error, or on a network error", async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  const fallback = /^https:\/\/test\.checkout\.dodopayments\.com\/buy\/pdt_test\?redirect_url=https%3A%2F%2Fapp\.example\.com%2Fwelcome/;

  delete process.env.DODO_API_KEY;
  expect((await (await checkout("{}")).json()).checkout_url).toMatch(fallback);
  expect(fetchMock).not.toHaveBeenCalled();

  process.env.DODO_API_KEY = "test_key";
  fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
  expect((await (await checkout("{}")).json()).checkout_url).toMatch(fallback);

  fetchMock.mockRejectedValueOnce(new Error("offline"));
  expect((await (await checkout("{}")).json()).checkout_url).toMatch(fallback);
});

it("prefers DODO_CHECKOUT_URL as the fallback", async () => {
  delete process.env.DODO_API_KEY;
  process.env.DODO_CHECKOUT_URL = "https://pay.example.com/zeroroute";
  expect((await (await checkout("{}")).json()).checkout_url).toBe("https://pay.example.com/zeroroute");
});

it("redirects a browser GET to the checkout", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ checkout_url: "https://checkout.test/s_3" })));
  const res = await GET(new NextRequest("http://localhost/api/checkout"));
  expect(res.status).toBe(307);
  expect(res.headers.get("location")).toBe("https://checkout.test/s_3");
});

it("rate-limits one client to ten checkouts a minute", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ checkout_url: "https://checkout.test/s" })));
  const statuses = [];
  for (let i = 0; i < 11; i++) statuses.push((await checkout("{}", "192.0.2.1")).status);
  expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
  expect(statuses[10]).toBe(429);
});

it("rate-limits by the platform's client IP header", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ checkout_url: "https://checkout.test/s" })));
  const statuses = [];
  for (let i = 0; i < 11; i++) {
    const res = await POST(new NextRequest("http://localhost/api/checkout", {
      method: "POST",
      headers: { "x-real-ip": "192.0.2.50", "x-forwarded-for": `10.9.9.${i}` },
      body: "{}",
    }));
    statuses.push(res.status);
  }
  expect(statuses[10]).toBe(429);
});
