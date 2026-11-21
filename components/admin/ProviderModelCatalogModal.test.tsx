import { afterEach, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PROVIDER_CATALOGS } from "@/lib/providers/catalog";
import { UiProviders } from "@/components/ui/UiProviders";
import { ProviderModelCatalogModal } from "./ProviderModelCatalogModal";
import { plainLimit, recommendedChain } from "./providers/helpers";

const [fast, slow] = PROVIDER_CATALOGS.groq.categories.flatMap((c) => c.models).map((m) => m.id);
const provider = {
  id: "groq", name: "Groq", model: "old", models: ["old"], enabled: true, order: 1, configured: true,
  consecutiveFailures: 0, cooldownUntil: 0,
};

function setup(onSave = vi.fn(async () => {})) {
  const view = render(
    <UiProviders>
      <ProviderModelCatalogModal provider={provider} onClose={() => {}} onSave={onSave} />
    </UiProviders>,
  );
  return { onSave, ...view };
}

const card = (id: string) => screen.getByText(id, { selector: "code" }).closest("li")!;

afterEach(() => vi.unstubAllGlobals());

it("tells you when a model is already in the list instead of doing nothing", async () => {
  const { onSave } = setup();
  await userEvent.type(screen.getByLabelText("Add any other model by its ID"), "old");
  await userEvent.click(screen.getByRole("button", { name: "Add" }));

  expect(screen.getByText("old is already in the list.")).toBeInTheDocument();
  expect(onSave).not.toHaveBeenCalled();
});

it("shows what applying the suggestion removes, and only saves after confirming", async () => {
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    const { model } = JSON.parse(init.body as string);
    return Response.json({ ok: true, latencyMs: model === fast ? 50 : 200 });
  }));
  const { onSave } = setup();
  await userEvent.click(within(card(slow)).getByRole("button", { name: "Test" }));
  await userEvent.click(within(card(fast)).getByRole("button", { name: "Test" }));

  await userEvent.click(await screen.findByRole("button", { name: "Review suggestion" }));
  const dialog = screen.getByRole("dialog", { name: "Use the suggested order?" });
  expect(dialog).toHaveAccessibleDescription(`New order: ${fast}, ${slow}. These will be removed because they were not tested or failed: old.`);
  await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
  expect(onSave).not.toHaveBeenCalled();

  await userEvent.click(screen.getByRole("button", { name: "Review suggestion" }));
  await userEvent.click(screen.getByRole("button", { name: "Use suggested order" }));
  expect(onSave).toHaveBeenCalledWith([fast, slow]);
});

it("shows a failed save instead of pretending it worked", async () => {
  setup(vi.fn(async () => { throw new Error("Disk full"); }));
  await userEvent.click(within(card(fast)).getByRole("button", { name: "Add as fallback" }));

  expect(await screen.findByText("Couldn't save: Disk full")).toBeInTheDocument();
});

it("cancels running tests when the dialog closes", async () => {
  const signals: AbortSignal[] = [];
  vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => {
    signals.push(init.signal!);
    return new Promise<Response>(() => {});
  }));
  const { rerender } = setup();
  await userEvent.click(screen.getByRole("button", { name: /^Test all/ }));
  await waitFor(() => expect(signals.length).toBeGreaterThan(0));

  rerender(
    <UiProviders>
      <ProviderModelCatalogModal provider={null} onClose={() => {}} onSave={async () => {}} />
    </UiProviders>,
  );
  expect(signals.every((s) => s.aborted)).toBe(true);
});

it("helpers: plain limits and the suggested order", () => {
  expect(plainLimit("30 RPM")).toBe("30 requests a minute");
  expect(plainLimit("14.4k RPD")).toBe("14.4k requests a day");
  expect(plainLimit("—")).toBeUndefined();
  expect(
    recommendedChain(
      { a: { ok: true, latencyMs: 300 }, b: { ok: true, latencyMs: 100 }, c: { ok: false, latencyMs: 1 }, x: { ok: true, latencyMs: 1 } },
      new Set(["a", "b", "c"]),
    ),
  ).toEqual(["b", "a"]);
});
