import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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

  it("in controlled mode follows the checked prop and reports the requested state", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    const { rerender } = render(<Switch aria-label="Billing alerts" checked={false} onCheckedChange={onCheckedChange} />);
    const sw = screen.getByRole("switch", { name: "Billing alerts" });
    await user.click(sw);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(sw).toHaveAttribute("aria-checked", "false"); // parent did not update
    rerender(<Switch aria-label="Billing alerts" checked onCheckedChange={onCheckedChange} />);
    expect(sw).toHaveAttribute("aria-checked", "true");
  });

  it("lets onClick cancel the toggle with preventDefault", async () => {
    const user = userEvent.setup();
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Guarded" onClick={(e) => e.preventDefault()} onCheckedChange={onCheckedChange} />);
    await user.click(screen.getByRole("switch", { name: "Guarded" }));
    expect(screen.getByRole("switch")).not.toBeChecked();
    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

