import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SETUP_CALL_URL, SUPPORT_EMAIL, SupportBanner } from "./SupportBanner";

describe("SupportBanner", () => {
  it("links to setup email and the booking page in a new tab", () => {
    render(<SupportBanner />);
    expect(screen.getByRole("link", { name: /email setup help/i })).toHaveAttribute(
      "href",
      `mailto:${SUPPORT_EMAIL}?subject=ZeroRoute%20Free%20Setup%20Assistance`,
    );
    const call = screen.getByRole("link", { name: /book a free 1-on-1 call/i });
    expect(call).toHaveAttribute("href", SETUP_CALL_URL);
    expect(call).toHaveAttribute("target", "_blank");
    expect(call).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("uses a caller's prefilled mailto link", () => {
    render(<SupportBanner emailHref="mailto:x@example.com?body=bot-1" />);
    expect(screen.getByRole("link", { name: /email setup help/i })).toHaveAttribute("href", "mailto:x@example.com?body=bot-1");
  });
});
