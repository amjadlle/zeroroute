import { afterEach, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UiProviders } from "@/components/ui/UiProviders";
import AdminProvidersPage from "./page";

const groq = {
  id: "groq", name: "Groq", model: "a", models: ["a", "b"], enabled: true, order: 1, configured: true,
  consecutiveFailures: 0, cooldownUntil: 0, lastLatencyMs: 300, lastError: "old error",
};
const gemini = { ...groq, id: "gemini", name: "Gemini", model: "g", models: ["g"], order: 2, configured: false, lastError: undefined };

type Call = { url: string; method: string; body?: unknown };

function stubApi({ putFails = false } = {}) {
  const calls: Call[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? "GET";
    const body = init.body ? JSON.parse(init.body as string) : undefined;
    calls.push({ url, method, body });
    if (url === "/api/admin/providers/test") return Response.json({ ok: true, latencyMs: 120, response: "OK" });
    if (method === "PUT") {
      if (putFails) return Response.json({ error: "Disk full" }, { status: 500 });
      const changed = new Map(body.providers.map((p: { id: string }) => [p.id, p]));
      return Response.json({ providers: [groq, gemini].map((p) => ({ ...p, ...(changed.get(p.id) ?? {}) })) });
    }
    return Response.json({ providers: [groq, gemini] });
  }));
  return calls;
}

const renderPage = () => render(<UiProviders><AdminProvidersPage /></UiProviders>);
const row = (name: string) => screen.getByRole("heading", { name }).closest("li")!;

afterEach(() => vi.unstubAllGlobals());

it("shows read-only key status with the env var to set, and no API keys form", async () => {
  stubApi();
  renderPage();
  await screen.findByRole("heading", { name: "Groq" });

  expect(within(row("Groq")).getByText("Key set")).toBeInTheDocument();
  expect(within(row("Gemini")).getByText("Key missing")).toBeInTheDocument();
  expect(within(row("Gemini")).getByText("GEMINI_API_KEY")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /api keys/i })).toBeNull();
  expect(screen.queryByRole("textbox")).toBeNull();
});

it("turning a provider off sends only that provider, without runtime fields", async () => {
  const calls = stubApi();
  renderPage();
  const toggle = await screen.findByRole("switch", { name: "Use Groq" });

  await userEvent.click(toggle);

  await waitFor(() => expect(toggle).not.toBeChecked());
  const put = calls.find((c) => c.method === "PUT")!;
  expect(put.body).toEqual({ providers: [{ id: "groq", enabled: false, order: 1, models: ["a", "b"] }] });
});

it("moving a provider sends both swapped providers with their new order", async () => {
  const calls = stubApi();
  renderPage();
  await userEvent.click(await screen.findByRole("button", { name: "Move Gemini up" }));

  await waitFor(() => expect(calls.some((c) => c.method === "PUT")).toBe(true));
  expect(calls.find((c) => c.method === "PUT")!.body).toEqual({
    providers: [
      { id: "gemini", enabled: true, order: 1, models: ["g"] },
      { id: "groq", enabled: true, order: 2, models: ["a", "b"] },
    ],
  });
});

it("a failed save shows an error and keeps the server's state", async () => {
  stubApi({ putFails: true });
  renderPage();
  const toggle = await screen.findByRole("switch", { name: "Use Groq" });

  await userEvent.click(toggle);

  expect(await screen.findByText("Couldn't save: Disk full")).toBeInTheDocument();
  expect(toggle).toBeChecked();
});

it("testing a provider re-reads providers instead of writing them back", async () => {
  const calls = stubApi();
  renderPage();
  await userEvent.click(within(await screen.findByRole("heading", { name: "Groq" }).then((h) => h.closest("li")!)).getByRole("button", { name: "Test" }));

  expect(await screen.findByText("Replied in 120 ms")).toBeInTheDocument();
  await waitFor(() => expect(calls.filter((c) => c.url === "/api/admin/providers" && c.method === "GET")).toHaveLength(2));
  expect(calls.find((c) => c.url === "/api/admin/providers/test")!.body).toEqual({ providerId: "groq", model: "a" });
  expect(calls.some((c) => c.method === "PUT")).toBe(false);
});

it("model names in the fallback list are buttons that open the model list", async () => {
  stubApi();
  renderPage();
  await userEvent.click(await screen.findByRole("button", { name: "Show Groq details" }));
  await userEvent.click(within(row("Groq")).getByRole("button", { name: "b" }));

  expect(screen.getByRole("dialog", { name: "Groq models" })).toBeInTheDocument();
});
