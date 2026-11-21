import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { UsageCard } from "./UsageCard";

it("shows honest usage and warns only near or at the limit", () => {
  const { rerender } = render(<UsageCard used={0} limit={500} />);
  expect(screen.getByRole("meter", { name: "Requests used this month" })).toHaveAttribute("aria-valuetext", "0 of 500");
  expect(screen.queryByText(/most of this month/)).not.toBeInTheDocument();
  rerender(<UsageCard used={420} limit={500} />);
  expect(screen.getByText(/most of this month/)).toBeInTheDocument();
  rerender(<UsageCard used={500} limit={500} />);
  expect(screen.getByText(/reached your monthly limit/)).toBeInTheDocument();
});
