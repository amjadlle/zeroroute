import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import type { InsightDay } from "./Insights";
import { axisMax, QuestionsChart } from "./QuestionsChart";

const days: InsightDay[] = Array.from({ length: 14 }, (_, i) => ({
  date: `2026-11-${String(i + 8).padStart(2, "0")}`,
  total: i === 10 ? 30 : i,
  failed: 0,
  unanswered: 0,
  avgReplyMs: 0,
}));

it("rounds the axis up to a value with a whole-number middle line", () => {
  expect([0, 1, 2, 3, 5, 7, 11, 30, 100, 101, 999].map(axisMax)).toEqual([2, 2, 2, 4, 6, 8, 20, 40, 100, 200, 1000]);
});

it("draws one bar per day, scaled to the axis, with the last 7 days highlighted", () => {
  const { container } = render(<QuestionsChart data={{ days, topics: [] }} error={null} reload={() => {}} />);
  const chart = screen.getByRole("img");
  expect(chart).toHaveAccessibleName(/111 in total\. The busiest day was (18 Nov|Nov 18) with 30\./);
  const bars = [...container.querySelectorAll<HTMLElement>("[style*='height']")];
  expect(bars).toHaveLength(14);
  expect(bars[10].style.height).toBe("75%"); // 30 of 40
  expect(bars.filter((b) => b.classList.contains("bg-accent"))).toHaveLength(7);
  expect(bars[0]).toHaveClass("bg-accent/35");
  expect(screen.getByText(/^(21 Nov|Nov 21)$/)).toBeInTheDocument(); // today is always labelled; day/month order follows the runner's locale
});

it("says when there were no questions, and offers a retry after an error", async () => {
  const { rerender } = render(<QuestionsChart data={{ days: days.map((d) => ({ ...d, total: 0 })), topics: [] }} error={null} reload={() => {}} />);
  expect(screen.getByRole("img")).toHaveAccessibleName("No questions in the last 14 days.");

  const reload = vi.fn();
  rerender(<QuestionsChart data={null} error="Failed to load insights" reload={reload} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Failed to load insights");
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(reload).toHaveBeenCalled();
});
