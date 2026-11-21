import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { UiProviders } from "@/components/ui/UiProviders";
import { PlanDetails } from "./PlanDetails";
import { UNLIMITED_MONTHLY_REQUESTS } from "@/lib/constants";

const BASE = { email: "hi@example.com", name: "Brightpath", status: "active", monthlyLimit: 500, isPro: false };
const setup = (props: Partial<Parameters<typeof PlanDetails>[0]> = {}) =>
  render(<UiProviders><PlanDetails {...BASE} {...props} /></UiProviders>);

function stubCheckout(url: string) {
  const fetch = vi.fn(async (...[]: [string, RequestInit?]) => Response.json({ checkout_url: url }));
  const assign = vi.fn();
  vi.stubGlobal("fetch", fetch);
  vi.stubGlobal("location", { ...window.location, assign });
  return { fetch, assign };
}

afterEach(() => vi.unstubAllGlobals());

it("sends a Free customer to checkout with their email, without changing the plan itself", async () => {
  const { fetch, assign } = stubCheckout("https://checkout.example.com/s/1");
  setup();
  expect(screen.getByText("Free")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /Upgrade to Pro/ }));
  const [url, init] = fetch.mock.calls[0];
  expect(url).toBe("/api/checkout");
  expect(init?.method).toBe("POST");
  expect(JSON.parse(String(init?.body))).toEqual({ email: "hi@example.com", name: "Brightpath" });
  expect(assign).toHaveBeenCalledWith("https://checkout.example.com/s/1");
  expect(screen.getByText("Free")).toBeInTheDocument();
});

it("refuses a non-https checkout link and says so", async () => {
  const { assign } = stubCheckout("javascript:alert(1)");
  setup();
  await userEvent.click(screen.getByRole("button", { name: /Upgrade to Pro/ }));
  expect(await screen.findByText(/Couldn't open checkout/)).toBeInTheDocument();
  expect(assign).not.toHaveBeenCalled();
});

it("shows Pro as active with change/cancel by email and no upgrade", () => {
  setup({ isPro: true, monthlyLimit: 10000, subscriptionExpires: Date.UTC(2026, 11, 20) });
  expect(screen.getByText("Pro")).toBeInTheDocument();
  expect(screen.getByText("Active")).toBeInTheDocument();
  expect(screen.getByText(/Paid through/)).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Change or cancel plan/ })).toHaveAttribute("href", expect.stringMatching(/^mailto:/));
  expect(screen.queryByRole("button", { name: /Upgrade/ })).not.toBeInTheDocument();
});

it("flags a payment issue instead of offering a second subscription", () => {
  setup({ status: "paused", monthlyLimit: 10000 });
  expect(screen.getByText("Payment issue")).toBeInTheDocument();
  expect(screen.getByText("Your last payment didn't go through")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Fix payment/ })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Upgrade|Restart/ })).not.toBeInTheDocument();
});

it("lets a canceled customer restart Pro", () => {
  setup({ status: "canceled", monthlyLimit: 10000 });
  expect(screen.getByText("Canceled")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Restart Pro/ })).toBeInTheDocument();
});

it("does not claim a 10,000 limit for an unlimited account", () => {
  setup({ isPro: true, monthlyLimit: UNLIMITED_MONTHLY_REQUESTS });
  expect(screen.getByText("No monthly request limit")).toBeInTheDocument();
});
