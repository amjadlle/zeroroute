import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Field } from "./Field";
import { Select } from "./Select";

const options = (
  <>
    <option value="free">Free</option>
    <option value="pro">Pro</option>
  </>
);

describe("Select", () => {
  it("is a labelled combobox that changes value and shows Field errors", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Field label="Plan" error="Pick a paid plan"><Select onChange={onChange}>{options}</Select></Field>);
    const select = screen.getByRole("combobox", { name: "Plan" });
    expect(select).toBeInvalid();
    expect(select).toHaveAccessibleDescription("Pick a paid plan");
    await user.selectOptions(select, "Pro");
    expect(select).toHaveValue("pro");
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("is disabled when asked", () => {
    render(<Select aria-label="Region" disabled>{options}</Select>);
    expect(screen.getByRole("combobox", { name: "Region" })).toBeDisabled();
  });
});
