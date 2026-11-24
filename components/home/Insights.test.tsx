import { render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { InsightTiles, NeedsAttention, NextStep, useInsights, type InsightDay } from "./Insights";

afterEach(() => vi.unstubAllGlobals());

const day = (total: number, failed = 0, unanswered = 0, avgReplyMs = 0): InsightDay =>
  ({ date: "2026-11-22", total, failed, unanswered, avgReplyMs });
// 12 quiet days, then 10 questions (1 failed, 2 unanswered, 800 ms) and 10 more (0 failed, 0 unanswered, 1500 ms).
const DAYS = [...Array.from({ length: 12 }, () => day(0)), day(10, 1, 2, 800), day(10, 0, 0, 1500)];
const TOPICS = [
  { topic: "instalments", count: 11, example: "Can I pay in instalments?" },
  { topic: "travel", count: 2, example: "Do you travel to Leeds?" },
];
const noop = () => {};

it("suggests adding an answer for the most-asked unanswered topic", () => {
  render(<NextStep topics={TOPICS} />);
  const bar = screen.getByRole("region", { name: "Add an answer about “instalments”" });
  expect(bar).toHaveTextContent("asked about this 11 times in the last 14 days");
  expect(bar).toHaveTextContent("“Can I pay in instalments?”");
  expect(within(bar).getByRole("link", { name: "Add answer" })).toHaveAttribute("href", "/app/knowledge");
  expect(within(bar).getByRole("link", { name: "See questions" })).toHaveAttribute("href", "/app/usage?show=unanswered");
});

it("hides the next step when every question was answered", () => {
  const { container } = render(<NextStep topics={[]} />);
  expect(container).toBeEmptyDOMElement();
});

it("shows 7-day totals, answer rate, weighted reply time and monthly requests", () => {
  render(<InsightTiles data={{ days: DAYS, topics: [] }} error={null} reload={noop} used={6420} limit={10000} />);
  const tiles = screen.getByRole("region", { name: "Last 7 days" });
  expect(tiles).toHaveTextContent("Questions20");
  expect(tiles).toHaveTextContent("Answered85%17 of 20");
  // (800 × 9 + 1500 × 10) / 19 ≈ 1168 ms
  expect(tiles).toHaveTextContent("Average reply1.2 s");
  expect(tiles).toHaveTextContent("Requests this month6,420of 10,000 on your plan");
  expect(tiles.querySelectorAll("svg path.stroke-accent")).toHaveLength(4);
  // The week before had no questions, so there is nothing to compare with.
  expect(tiles).not.toHaveTextContent("compared with");
});

it("compares the last 7 days with the 7 before, with lower reply time as good news", () => {
  // Week 1: 10 questions/day for 2 days, all answered, 1 s. Week 2: 25 questions, 20 answered, 0.5 s.
  const days = [...Array.from({ length: 5 }, () => day(0)), day(10, 0, 0, 1000), day(10, 0, 0, 1000),
    ...Array.from({ length: 6 }, () => day(0)), day(25, 0, 5, 500)];
  render(<InsightTiles data={{ days, topics: [] }} error={null} reload={noop} used={45} limit={500} />);
  const [questions, answered, reply, requests] = within(screen.getByRole("region", { name: "Last 7 days" }))
    .getAllByText(/compared with the 7 days before/).map((n) => n.parentElement!);
  expect(questions).toHaveTextContent("+25%");
  expect(questions).toHaveClass("text-success-fg");
  expect(answered).toHaveTextContent("−20 pts");
  expect(answered).toHaveClass("text-danger-fg");
  expect(reply).toHaveTextContent("−500 ms");
  expect(reply).toHaveClass("text-success-fg");
  expect(requests).toBeUndefined();
});

it("leaves out a change that rounds to nothing", () => {
  const days = [...Array.from({ length: 6 }, () => day(0)), day(1000, 0, 0, 800), ...Array.from({ length: 6 }, () => day(0)), day(1002, 0, 0, 800)];
  render(<InsightTiles data={{ days, topics: [] }} error={null} reload={noop} used={0} limit={500} />);
  expect(screen.queryByText(/compared with/)).not.toBeInTheDocument();
});

it("shows dashes rather than 0% before the first question", () => {
  render(<InsightTiles data={{ days: [day(0)], topics: [] }} error={null} reload={noop} used={0} limit={500} />);
  expect(screen.getByText("No questions in the last 7 days")).toBeInTheDocument();
  expect(screen.getAllByText("—")).toHaveLength(2);
});

it("lists knowledge gaps, failures and a nearly used-up plan", () => {
  render(<NeedsAttention data={{ days: DAYS, topics: TOPICS }} used={450} limit={500} />);
  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(3);
  expect(items[0]).toHaveTextContent("2Questions your chatbot couldn't answerinstalments, travel");
  expect(items[1]).toHaveTextContent("1Request that failed");
  expect(items[2]).toHaveTextContent("90%You've used most of this month's requests");
  expect(within(items[1]).getByRole("link", { name: "View" })).toHaveAttribute("href", "/app/usage?show=failed");
  expect(within(items[2]).getByRole("link", { name: "Compare plans" })).toHaveAttribute("href", "/app/billing");
});

it("says so when nothing needs attention", () => {
  render(<NeedsAttention data={{ days: [day(5, 0, 0, 300)], topics: [] }} used={5} limit={500} />);
  expect(screen.getByText("Nothing needs your attention")).toBeInTheDocument();
});

it("loads insights only once enabled, and retries after a failure", async () => {
  let fail = true;
  const fetch = vi.fn(async () => fail
    ? new Response(JSON.stringify({ error: "Failed to load insights" }), { status: 500 })
    : new Response(JSON.stringify({ days: DAYS, topics: TOPICS })));
  vi.stubGlobal("fetch", fetch);

  const { result, rerender } = renderHook(({ on }) => useInsights(on), { initialProps: { on: false } });
  expect(fetch).not.toHaveBeenCalled();
  rerender({ on: true });
  await waitFor(() => expect(result.current.error).toBe("Failed to load insights"));

  render(<InsightTiles {...result.current} used={0} limit={500} />);
  fail = false;
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  await waitFor(() => expect(result.current.data?.topics).toEqual(TOPICS));
  const tz = encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone);
  expect(fetch).toHaveBeenCalledWith(`/api/customer/insights?tz=${tz}`, expect.anything());
});
