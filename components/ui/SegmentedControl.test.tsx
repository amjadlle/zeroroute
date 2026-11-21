import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./SegmentedControl";

const options = [
  { value: "all", label: "All" },
  { value: "ok", label: "Succeeded", icon: <svg data-testid="icon" /> },
  { value: "failed", label: "Failed" },
];

const radio = (name: string) => screen.getByRole("radio", { name });

describe("SegmentedControl", () => {
  it("exposes a labelled radiogroup with aria-checked and one tab stop", () => {
    render(<SegmentedControl label="Status" options={options} />);
    expect(screen.getByRole("radiogroup", { name: "Status" })).toBeInTheDocument();
    expect(radio("All")).toHaveAttribute("aria-checked", "true");
    expect(radio("Succeeded")).toHaveAttribute("aria-checked", "false");
    expect(screen.getAllByRole("radio").map((r) => r.tabIndex)).toEqual([0, -1, -1]);
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden");
  });

  it("moves the selection with arrow keys and wraps", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SegmentedControl label="Status" options={options} defaultValue="all" onValueChange={onValueChange} />);
    await user.click(radio("All"));
    await user.keyboard("{ArrowRight}");
    expect(radio("Succeeded")).toHaveFocus();
    expect(radio("Succeeded")).toHaveAttribute("aria-checked", "true");
    expect(radio("All")).toHaveAttribute("aria-checked", "false");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(radio("All")).toHaveFocus();
    await user.keyboard("{ArrowUp}");
    expect(radio("Failed")).toHaveAttribute("aria-checked", "true");
    expect(onValueChange.mock.calls.map(([v]) => v)).toEqual(["ok", "failed", "all", "failed"]);
  });

  it("selects on click", async () => {
    const user = userEvent.setup();
    render(<SegmentedControl label="Status" options={options} />);
    await user.click(radio("Failed"));
    expect(radio("Failed")).toHaveAttribute("aria-checked", "true");
    expect(radio("Failed").tabIndex).toBe(0);
  });
});
