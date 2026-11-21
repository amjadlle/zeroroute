import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("exposes its label as the accessible name and tooltip, and fires onClick", async () => {
    const onClick = vi.fn();
    render(<IconButton label="Copy API key" icon={<svg aria-hidden />} onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Copy API key" });
    expect(button).toHaveAttribute("title", "Copy API key");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
