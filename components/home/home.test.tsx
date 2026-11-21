import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { RecentQuestions } from "./RecentQuestions";
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
  render(<RecentQuestions />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to fetch stats");
  expect(screen.queryByText("No questions yet")).not.toBeInTheDocument();

  fail = false;
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("No questions yet")).toBeInTheDocument();
});

it("lists the latest visitor questions", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
    stats: { logs: [{ id: "1", timestamp: 0, origin: "https://shop.example.com", prompt_preview: "Do you ship abroad?", status: 200 }] },
  }))));
  render(<RecentQuestions />);
  expect(await screen.findByText("Do you ship abroad?")).toBeInTheDocument();
  expect(screen.getByText(/shop\.example\.com/)).toBeInTheDocument();
});
