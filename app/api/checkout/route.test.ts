import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

beforeEach(() => {
  process.env.APP_URL = "https://app.example.com";
  process.env.DODO_API_KEY = "test_key";
  delete process.env.DODO_CHECKOUT_URL;
});

afterEach(() => vi.unstubAllGlobals());

it("builds the return URL from APP_URL, ignoring a spoofed Host", async () => {
  const fetchMock = vi.fn(async () => Response.json({ checkout_url: "https://checkout.test/x" }));
  vi.stubGlobal("fetch", fetchMock);

  await GET(new NextRequest("http://localhost/api/checkout?format=json", {
    headers: { host: "evil.example", origin: "https://evil.example" },
  }));

  const body = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
  expect(body.return_url).toBe("https://app.example.com/welcome");
  expect(body.cancel_url).toBe("https://app.example.com/#pricing");
});
