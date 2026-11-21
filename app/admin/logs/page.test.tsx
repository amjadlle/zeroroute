import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdminLogsTab, LOG_FILTER_KEY, type GlobalLogItem } from "@/components/admin/AdminLogsTab";
import AdminLogsPage from "./page";

const nav = vi.hoisted(() => ({ search: "", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({ replace: nav.replace, push: vi.fn() }),
  usePathname: () => "/admin/logs",
}));

const log = (id: string, over: Partial<GlobalLogItem> = {}): GlobalLogItem => ({
  id, customer_key: "zr_live_abcdef1234", timestamp: 0, origin: "shop.example", prompt_preview: `prompt ${id}`,
  response_preview: `answer ${id}`, provider: "groq", model: "llama", latency_ms: 300, status: 200, is_stream: 0,
  is_cache_hit: 0, failovers: "[]", prompt_tokens: 1, completion_tokens: 2, total_tokens: 3, ...over,
});

const LOGS = [
  log("ok1"),
  log("bad1", { status: 500, provider: "gemini", failovers: JSON.stringify(["groq/llama: 429"]) }),
];

const renderTab = (props: Partial<Parameters<typeof AdminLogsTab>[0]> = {}) =>
  render(<AdminLogsTab logs={LOGS} onRefresh={vi.fn(async () => {})} loading={false} {...props} />);

const rows = () => screen.getAllByRole("row").slice(1); // minus the header row

beforeEach(() => {
  nav.search = "";
  nav.replace.mockReset();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

it("writes the status filter to the URL and applies the one it finds there", async () => {
  const { unmount } = renderTab();
  await userEvent.click(screen.getByRole("radio", { name: "Failed" }));
  expect(nav.replace).toHaveBeenCalledWith("/admin/logs?status=error", { scroll: false });
  unmount();

  nav.search = "status=error";
  renderTab();
  expect(rows()).toHaveLength(1);
  expect(rows()[0]).toHaveTextContent("500");
  expect(rows()[0]).toHaveTextContent("1 retry");
});

it("opens a request in a drawer with the key masked", async () => {
  renderTab();
  await userEvent.click(screen.getByText("prompt bad1"));
  const drawer = screen.getByRole("dialog", { name: "Request details" });
  expect(within(drawer).getByText("groq/llama: 429")).toBeInTheDocument();
  expect(within(drawer).getByText("answer bad1")).toBeInTheDocument();
  expect(drawer).not.toHaveTextContent("zr_live_abcdef1234");
});

it("clears every filter, including the customer, in one go", async () => {
  const onClearCustomer = vi.fn();
  nav.search = "status=error&provider=gemini";
  renderTab({ customer: "zr_live_abcdef1234", onClearCustomer });
  expect(screen.getByText("Customer key ending 1234")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(onClearCustomer).toHaveBeenCalled();
  expect(nav.replace).toHaveBeenCalledWith("/admin/logs", { scroll: false });
});

it("exports through a Blob URL, not a data: URI", async () => {
  const createObjectURL = vi.fn(() => "blob:x");
  vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  renderTab();
  await userEvent.click(screen.getByRole("button", { name: "Export JSON" }));
  expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
  expect(click).toHaveBeenCalled();
  click.mockRestore();
});

it("keeps one auto-refresh timer across re-renders and uses the latest callback", () => {
  const first = vi.fn(async () => {});
  const second = vi.fn(async () => {});
  vi.useFakeTimers();
  const { rerender } = renderTab({ onRefresh: first });
  fireEvent.click(screen.getByRole("switch", { name: "Auto-refresh" }));
  act(() => vi.advanceTimersByTime(3000));
  rerender(<AdminLogsTab logs={LOGS} onRefresh={second} loading={false} />);
  act(() => vi.advanceTimersByTime(2000)); // 5s since the toggle: a restarted timer would not fire yet
  expect(second).toHaveBeenCalledTimes(1);
  expect(first).not.toHaveBeenCalled();
});

it("takes the customer from the customers page once and drops it when cleared", async () => {
  const fetch = vi.fn(async () => Response.json({ logs: LOGS }));
  vi.stubGlobal("fetch", fetch);
  sessionStorage.setItem(LOG_FILTER_KEY, "zr_live_abcdef1234");
  render(<AdminLogsPage />);

  expect(await screen.findByText("Customer key ending 1234")).toBeInTheDocument();
  expect(fetch).toHaveBeenLastCalledWith("/api/admin/logs?limit=200&customer_key=zr_live_abcdef1234", expect.anything());
  expect(sessionStorage.getItem(LOG_FILTER_KEY)).toBeNull();

  await userEvent.click(screen.getByRole("button", { name: "Remove customer filter" }));
  await screen.findByText("Showing 2 of 2");
  expect(fetch).toHaveBeenLastCalledWith("/api/admin/logs?limit=200", expect.anything());
  expect(screen.queryByText(/Customer key ending/)).not.toBeInTheDocument();
});
