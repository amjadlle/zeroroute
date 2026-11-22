import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusDot } from "./StatusDot";

describe("StatusDot", () => {
  it("is decorative without a label", () => {
    const { container } = render(<StatusDot tone="success" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("is a named image with a label, and adds a ping layer when pulsing", () => {
    render(<StatusDot tone="danger" pulse label="Provider down" />);
    const dot = screen.getByRole("img", { name: "Provider down" });
    expect(dot).not.toHaveAttribute("aria-hidden");
    expect(dot.children).toHaveLength(2);
  });
});
