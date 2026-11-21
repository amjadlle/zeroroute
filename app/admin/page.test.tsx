import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AdminOverviewPage from "./page";

const provider = (id: string, enabled: boolean, configured: boolean) => ({
  id, name: id, model: "m", models: ["m"], enabled, order: 0, configured, consecutiveFailures: 0, cooldownUntil: 0,
});

let n = 0;
const log = (latency_ms: number, status: number) => ({
  id: `l${++n}`, customer_key: "k", timestamp: 0, provider: "groq", model: "llama", latency_ms, status,
  is_stream: 0, is_cache_hit: 0, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0,
});

const metrics = { totalRequests: 1200, avgLatencyMs: 812, successRate: 97, cacheHits: 36, cacheSavings: "$0.0072", cacheHitRatio: 3 };

function stubApi(routes: Record<string, unknown | Error>) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const path = Object.keys(routes).find((p) => url.startsWith(p))!;
    const body = routes[path];
    return body instanceof Error ? Response.json({ error: body.message }, { status: 500 }) : Response.json(body);
  }));
}

afterEach(() => vi.unstubAllGlobals());

// The label span sits directly in the StatTile card.
const tile = (label: string) => screen.getByText(label).parentElement!;

it("shows the real KPIs from the API", async () => {
  stubApi({
    "/api/admin/providers": { providers: [provider("groq", true, true), provider("gemini", true, false), provider("cohere", false, true)] },
    "/api/admin/logs": { logs: [log(100, 200), log(300, 200), log(900, 502)], metrics },
    "/api/admin/customers": { customers: [{ id: "c1" }, { id: "c2" }, { id: "c3" }] },
  });
  render(<AdminOverviewPage />);

  expect(await screen.findByText("97%")).toBeInTheDocument();
  expect(tile("Requests")).toHaveTextContent("1,200");
  expect(tile("Response time")).toHaveTextContent("300 ms");
  expect(tile("Response time")).toHaveTextContent("last 3 requests");
  expect(tile("Cache hit rate")).toHaveTextContent("3%");
  expect(tile("Cache hit rate")).toHaveTextContent("36 answered from cache");
  expect(tile("Providers ready")).toHaveTextContent("1 / 3");
  expect(await screen.findByText("Accounts and admin bots")).toBeInTheDocument();
  expect(tile("Customers")).toHaveTextContent("3");
});

it("lists recent errors and provider health", async () => {
  stubApi({
    "/api/admin/providers": { providers: [provider("groq", true, true), provider("cohere", false, true)] },
    "/api/admin/logs": { logs: [log(100, 200), log(900, 502)], metrics },
    "/api/admin/customers": { customers: [] },
  });
  render(<AdminOverviewPage />);

  const errors = await screen.findByRole("table", { name: "Recent errors" });
  expect(errors).toHaveTextContent("502");
  expect(errors).not.toHaveTextContent("200");
  expect(screen.getByText("Ready")).toBeInTheDocument();
  expect(screen.getByText("Off")).toBeInTheDocument(); // a disabled provider is still listed
});

it("shows no latency or success rate before the first request", async () => {
  stubApi({
    "/api/admin/providers": { providers: [] },
    "/api/admin/logs": { logs: [], metrics: { ...metrics, totalRequests: 0, avgLatencyMs: 0, successRate: 100, cacheHits: 0 } },
    "/api/admin/customers": { customers: [] },
  });
  render(<AdminOverviewPage />);

  expect(await screen.findByText("Every recent request succeeded.")).toBeInTheDocument();
  expect(tile("Requests")).toHaveTextContent("No requests yet");
  expect(tile("Response time")).toHaveTextContent("—");
  expect(tile("Success rate")).toHaveTextContent("—");
});

it("shows a danger Alert when a fetch fails", async () => {
  stubApi({
    "/api/admin/providers": { providers: [] },
    "/api/admin/logs": new Error("Failed to fetch logs"),
    "/api/admin/customers": { customers: [] },
  });
  render(<AdminOverviewPage />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Couldn't load request stats");
  expect(alert).toHaveTextContent("Failed to fetch logs");
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
});
