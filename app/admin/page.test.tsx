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

const day = (total: number, ok = total, cacheHits = 0, avgLatencyMs = 0) => ({ total, ok, cacheHits, avgLatencyMs });
const quiet = Array.from({ length: 7 }, () => day(0));
// Week before: 100 requests, 90 ok, 10 from cache, 500 ms. Last week: 120 requests, 114 ok, 30 from cache, 400 ms.
const daily = [...quiet.slice(1), day(100, 90, 10, 500), ...quiet.slice(1), day(120, 114, 30, 400)];

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

it("shows the last 7 days with changes against the week before", async () => {
  stubApi({
    "/api/admin/providers": { providers: [provider("groq", true, true)] },
    "/api/admin/logs": { logs: [log(100, 200)], metrics: { daily } },
  });
  render(<AdminOverviewPage />);

  expect(await screen.findByText("95%")).toBeInTheDocument();
  expect(tile("Requests")).toHaveTextContent("120+20% compared with the 7 days before");
  expect(tile("Success rate")).toHaveTextContent("+5 pts");
  expect(tile("Response time")).toHaveTextContent("400 ms−100 ms");
  expect(tile("Answered from cache")).toHaveTextContent("25%+15 pts");
  expect(tile("Requests").querySelector("svg path")).not.toBeNull(); // sparkline
});

it("lists recent failures and every provider with one status", async () => {
  stubApi({
    "/api/admin/providers": { providers: [provider("groq", true, true), provider("cohere", false, true)] },
    "/api/admin/logs": { logs: [log(100, 200), log(900, 502)], metrics: { daily } },
  });
  render(<AdminOverviewPage />);

  const failures = await screen.findByRole("list", { name: "Recent failures" });
  expect(failures).toHaveTextContent("502");
  expect(failures).not.toHaveTextContent("200");
  expect(screen.getByText("Ready")).toBeInTheDocument();
  expect(screen.getByText("Off")).toBeInTheDocument(); // a disabled provider is still listed
  expect(screen.getByRole("link", { name: "Manage" })).toHaveAttribute("href", "/admin/providers");
});

it("says there were no requests instead of showing empty numbers or tables", async () => {
  stubApi({
    "/api/admin/providers": { providers: [] },
    "/api/admin/logs": { logs: [], metrics: { daily: [...quiet, ...quiet] } },
  });
  render(<AdminOverviewPage />);

  expect(await screen.findByText("No requests yet")).toBeInTheDocument();
  expect(screen.queryByText("No failures")).toBeNull();
  expect(screen.queryByRole("table")).toBeNull();
  expect(tile("Requests")).toHaveTextContent("—No requests in the last 7 days");
  expect(tile("Success rate")).toHaveTextContent("—");
});

it("says the recent requests all succeeded when none failed", async () => {
  stubApi({
    "/api/admin/providers": { providers: [] },
    "/api/admin/logs": { logs: [log(100, 200), log(120, 200)], metrics: { daily } },
  });
  render(<AdminOverviewPage />);

  expect(await screen.findByText("The last 2 requests all succeeded.")).toBeInTheDocument();
});

it("shows a danger Alert when a fetch fails", async () => {
  stubApi({
    "/api/admin/providers": { providers: [] },
    "/api/admin/logs": new Error("Failed to fetch logs"),
  });
  render(<AdminOverviewPage />);

  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Couldn't load request stats");
  expect(alert).toHaveTextContent("Failed to fetch logs");
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
});
