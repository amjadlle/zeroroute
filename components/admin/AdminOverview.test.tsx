import { afterEach, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { ProviderHealth, median, providerStatus, useNow } from "./AdminOverview";
import type { ProviderItem } from "./AdminProvidersTab";

const p = (over: Partial<ProviderItem> = {}): ProviderItem => ({
  id: "groq", name: "Groq", model: "m", models: ["m"], enabled: true, order: 1, configured: true,
  consecutiveFailures: 0, cooldownUntil: 0, ...over,
});

afterEach(() => vi.useRealTimers());

it("median handles odd, even and empty lists", () => {
  expect(median([900, 100, 300])).toBe(300);
  expect(median([100, 200, 300, 400])).toBe(250);
  expect(median([])).toBeUndefined();
});

it("ranks provider problems in order", () => {
  expect(providerStatus(p({ enabled: false, configured: false }), 0)).toMatchObject({ label: "Off", ready: false });
  expect(providerStatus(p({ configured: false }), 0)).toMatchObject({ label: "No key", tone: "warning" });
  expect(providerStatus(p({ cooldownUntil: 5_000, consecutiveFailures: 3 }), 0).label).toBe("Paused, back in 5s");
  expect(providerStatus(p({ consecutiveFailures: 2 }), 0)).toMatchObject({ tone: "danger", ready: true });
  expect(providerStatus(p(), 0)).toMatchObject({ label: "Ready", tone: "success", ready: true });
});

function Health({ provider }: { provider: ProviderItem }) {
  return <ProviderHealth providers={[provider]} now={useNow(provider.cooldownUntil)} />;
}

it("counts the cooldown down live and then shows the provider as ready", () => {
  vi.useFakeTimers({ now: 0 });
  render(<Health provider={p({ cooldownUntil: 3_000 })} />);
  expect(screen.getByText("Paused, back in 3s")).toBeInTheDocument();

  act(() => vi.advanceTimersByTime(1_000));
  expect(screen.getByText("Paused, back in 2s")).toBeInTheDocument();

  act(() => vi.advanceTimersByTime(2_000));
  expect(screen.getByText("Ready")).toBeInTheDocument();
  expect(vi.getTimerCount()).toBe(0); // stopped ticking once the cooldown ended
});
