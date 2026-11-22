import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("is a labelled native checkbox toggled by clicking its label", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Accept terms" />);
    const box = screen.getByRole("checkbox", { name: "Accept terms" });
    await user.click(screen.getByText("Accept terms"));
    expect(box).toBeChecked();
  });

  it("toggles with Space and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox label="Email me" onChange={onChange} />);
    const box = screen.getByRole("checkbox", { name: "Email me" });
    await user.tab();
    expect(box).toHaveFocus();
    await user.keyboard(" ");
    expect(box).toBeChecked();
    await user.keyboard(" ");
    expect(box).not.toBeChecked();
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Locked" disabled />);
    const box = screen.getByRole("checkbox", { name: "Locked" });
    await user.click(screen.getByText("Locked"));
    expect(box).toBeDisabled();
    expect(box).not.toBeChecked();
  });

  it("without a label renders just the box, named and marked invalid by aria attributes", () => {
    render(<Checkbox aria-label="Select row" aria-invalid />);
    const box = screen.getByRole("checkbox", { name: "Select row" });
    expect(box).toBeInvalid();
    expect(box.closest("label")).toBeNull();
  });
});
