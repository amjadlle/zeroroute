import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatWidgetSection } from "@/components/ChatWidgetSection";
import { Pricing } from "@/components/Pricing";
import { PLAN_LIMITS, PROVIDER_COUNT, SITE_URL } from "@/lib/constants";

function mockClipboard(writeText: (text: string) => Promise<void>) {
  const spy = vi.fn(writeText);
  // userEvent.setup() installs its own clipboard stub, so define ours after it.
  Object.defineProperty(navigator, "clipboard", { value: { writeText: spy }, configurable: true });
  return spy;
}

describe("landing copy follows lib/constants", () => {
  it("pricing prints plan limits, price and provider count", () => {
    render(<Pricing onOpenCheckout={() => {}} />);
    expect(screen.getByText(`${PLAN_LIMITS.free.monthlyRequests} Monthly AI Requests`)).toBeInTheDocument();
    expect(screen.getByText(`${PLAN_LIMITS.pro.monthlyRequests.toLocaleString("en-US")} Monthly AI Requests`)).toBeInTheDocument();
    expect(screen.getByText(`Up to ${PLAN_LIMITS.pro.allowedDomains} Whitelisted Domains`)).toBeInTheDocument();
    expect(screen.getByText(`${PROVIDER_COUNT} Clouds Pooled & Managed`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Get ZeroRoute Pro ($${PLAN_LIMITS.pro.priceUsd.toFixed(2)} / month) →` })).toBeInTheDocument();
  });
});

describe("ChatWidgetSection copy button", () => {
  it("copies the embed snippet for SITE_URL", async () => {
    const user = userEvent.setup();
    const writeText = mockClipboard(() => Promise.resolve());
    render(<ChatWidgetSection />);
    await user.click(screen.getByRole("button", { name: /copy script/i }));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(`src="${SITE_URL}/widget.js"`));
    expect(screen.getByRole("button", { name: /copied!/i })).toBeInTheDocument();
  });

  it("says so when the clipboard is unavailable", async () => {
    const user = userEvent.setup();
    mockClipboard(() => Promise.reject(new Error("denied")));
    render(<ChatWidgetSection />);
    await user.click(screen.getByRole("button", { name: /copy script/i }));
    expect(screen.getByRole("button", { name: /copy failed/i })).toBeInTheDocument();
  });
});
