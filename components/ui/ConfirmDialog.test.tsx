import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useConfirm, type ConfirmOptions } from "./ConfirmDialog";
import { UiProviders } from "./UiProviders";

function Harness({ options, onResult }: { options: ConfirmOptions; onResult: (ok: boolean) => void }) {
  const confirm = useConfirm();
  return <button onClick={async () => onResult(await confirm(options))}>Delete doc</button>;
}

function setup(options: Partial<ConfirmOptions> = {}) {
  const results: boolean[] = [];
  render(
    <UiProviders>
      <Harness options={{ title: "Delete doc?", body: "This cannot be undone.", confirmLabel: "Delete", tone: "danger", ...options }} onResult={(ok) => results.push(ok)} />
    </UiProviders>,
  );
  return results;
}

const open = () => userEvent.click(screen.getByRole("button", { name: "Delete doc" }));

describe("ConfirmDialog / useConfirm", () => {
  it("resolves true on confirm", async () => {
    const results = setup();
    await open();
    expect(screen.getByRole("dialog", { name: "Delete doc?" })).toHaveAccessibleDescription("This cannot be undone.");
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(results).toEqual([true]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("resolves false on cancel", async () => {
    const results = setup();
    await open();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(results).toEqual([false]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows loading while onConfirm is pending", async () => {
    let finish!: () => void;
    const results = setup({ onConfirm: () => new Promise<void>((r) => { finish = r; }) });
    await open();
    const ok = screen.getByRole("button", { name: "Delete" });
    await userEvent.click(ok);
    expect(ok).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(results).toEqual([]);
    await act(async () => finish());
    expect(results).toEqual([true]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("stays open with the error when onConfirm rejects", async () => {
    const results = setup({ onConfirm: () => Promise.reject(new Error("Server said no")) });
    await open();
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server said no");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
    expect(results).toEqual([]);
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(results).toEqual([false]);
  });

  it("resolves false on Esc", async () => {
    const results = setup();
    await open();
    await act(async () => { fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true })); });
    expect(results).toEqual([false]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses default labels and a generic message for a non-Error rejection", async () => {
    setup({ confirmLabel: undefined, tone: undefined, onConfirm: () => Promise.reject("nope") });
    await open();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Something went wrong. Try again.");
  });

  it("useConfirm throws without a provider", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect(() => render(<Harness options={{ title: "x" }} onResult={() => {}} />)).toThrow(/needs <UiProviders>/);
    } finally {
      error.mockRestore();
    }
  });
});
