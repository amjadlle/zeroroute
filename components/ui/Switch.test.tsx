import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Checkbox } from "./Checkbox";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("toggles with click, Space and Enter", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch label="Enable provider" onCheckedChange={onCheckedChange} />);
    const sw = screen.getByRole("switch", { name: "Enable provider" });
    expect(sw).not.toBeChecked();

    await user.click(sw);
    expect(sw).toBeChecked();

    sw.focus();
    await user.keyboard(" ");
    expect(sw).not.toBeChecked();

    await user.keyboard("{Enter}");
    expect(sw).toBeChecked();
    expect(onCheckedChange.mock.calls).toEqual([[true], [false], [true]]);
  });

  it("toggles when its label text is clicked", async () => {
    const user = userEvent.setup();
    render(<Switch label="Dark mode" />);
    await user.click(screen.getByText("Dark mode"));
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    render(<Switch label="Locked" disabled defaultChecked />);
    await user.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).toBeChecked();
  });
});

describe("Checkbox", () => {
  it("is a labelled native checkbox", async () => {
    const user = userEvent.setup();
    render(<Checkbox label="Accept terms" />);
    const box = screen.getByRole("checkbox", { name: "Accept terms" });
    await user.click(screen.getByText("Accept terms"));
    expect(box).toBeChecked();
  });
});
