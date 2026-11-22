import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  it("shows the code and language, and the wrap toggle reports aria-pressed", async () => {
    const user = userEvent.setup();
    render(<CodeBlock code="npm i zeroroute" language="bash" />);
    expect(screen.getByText("bash")).toBeInTheDocument();
    const pre = screen.getByText("npm i zeroroute").closest("pre")!;
    expect(pre).toHaveAttribute("tabindex", "0"); // keyboard users can scroll long lines

    const wrap = screen.getByRole("button", { name: "Wrap lines" });
    expect(wrap).toHaveAttribute("aria-pressed", "false");
    await user.click(wrap);
    expect(wrap).toHaveAttribute("aria-pressed", "true");
    expect(pre).toHaveClass("whitespace-pre-wrap");
    await user.keyboard("{Enter}");
    expect(wrap).toHaveAttribute("aria-pressed", "false");
  });

  it("copies the code", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    render(<CodeBlock code="<script src=x></script>" />);
    await user.click(screen.getByRole("button", { name: "Copy code" }));
    expect(writeText).toHaveBeenCalledWith("<script src=x></script>");
  });
});
