import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { RecentConversations } from "./RecentConversations";
import { SetupChecklist, setupSteps } from "./SetupChecklist";
import { UsageCard } from "./UsageCard";

afterEach(() => vi.unstubAllGlobals());

const NEW = { bot_title: "ZeroRoute AI", knowledge_docs_count: 0, allowed_domains: [], monthly_requests: 0 };

it("works out setup progress from the profile", () => {
  expect(setupSteps(NEW).map((s) => s.done)).toEqual([false, false, false, false]);
  expect(setupSteps({ ...NEW, bot_title: "Ava" }, 2).map((s) => s.done)).toEqual([true, true, false, false]);
  expect(setupSteps({ bot_title: "Ava", knowledge_docs_count: 1, allowed_domains: ["a.com"], monthly_requests: 3 }).every((s) => s.done)).toBe(true);
});

it("points a new customer at the first pending step", () => {
  render(<SetupChecklist steps={setupSteps({ ...NEW, bot_title: "Ava" })} />);
  expect(screen.getByText("1 of 4 done")).toBeInTheDocument();
  expect(screen.getByRole("meter", { name: "Setup progress" })).toHaveAttribute("aria-valuenow", "1");
  expect(screen.getByRole("link", { name: "Add knowledge" })).toHaveAttribute("href", "/app/knowledge");
  expect(screen.queryByRole("link", { name: "Open Chatbot" })).not.toBeInTheDocument();
});

it("shows zero usage as an empty meter against the real limit", () => {
  render(<UsageCard used={0} limit={500} />);
  const meter = screen.getByRole("meter", { name: "Requests used this month" });
  expect(meter).toHaveAttribute("aria-valuenow", "0");
  expect(meter).toHaveAttribute("aria-valuemax", "500");
  expect(meter.firstElementChild).toHaveStyle({ width: "0%" });
});

it("tells a failed load apart from no questions yet", async () => {
  let fail = true;
  vi.stubGlobal("fetch", vi.fn(async () => fail
    ? new Response(JSON.stringify({ error: "Failed to fetch stats" }), { status: 500 })
    : new Response(JSON.stringify({ stats: { logs: [] } }))));
  render(<RecentConversations />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to fetch stats");
  expect(screen.queryByText("No questions yet")).not.toBeInTheDocument();

  fail = false;
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("No questions yet")).toBeInTheDocument();
});

it("lists the latest conversations with how each one went", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    stats: { logs: [
      { id: "1", timestamp: 0, origin: "https://shop.example.com", prompt_preview: "Do you ship abroad?", response_preview: "Yes.", status: 200 },
      { id: "2", timestamp: 0, prompt_preview: "Instalments?", response_preview: "I don't have specific information about that.", status: 200 },
      { id: "3", timestamp: 0, prompt_preview: "Hours?", status: 502 },
    ] },
  }))));
  render(<RecentConversations />);
  const table = await screen.findByRole("table", { name: "Recent conversations" });
  const rows = within(table).getAllByRole("row").slice(1);
  expect(rows.map((r) => within(r).getAllByRole("cell")[1].textContent)).toEqual(["ResultAnswered", "ResultNot answered", "ResultFailed"]);
  expect(rows[0]).toHaveTextContent("shop.example.com");
  expect(rows[1]).toHaveTextContent("Direct");
});
