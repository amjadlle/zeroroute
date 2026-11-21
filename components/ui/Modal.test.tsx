import { StrictMode, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Modal } from "./Modal";
import { Drawer } from "./Drawer";

function Harness({ onClose = () => {}, As = Modal }: { onClose?: () => void; As?: typeof Modal }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <As
        open={open}
        onClose={() => { onClose(); setOpen(false); }}
        title="Rename bot"
        description="Visitors see this name."
        footer={<button>Save</button>}
      >
        <input aria-label="Name" />
      </As>
    </>
  );
}

describe("Modal", () => {
  it("opens with an accessible name and description", async () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    const dialog = screen.getByRole("dialog", { name: "Rename bot" });
    expect(dialog).toHaveAccessibleDescription("Visitors see this name.");
    expect(screen.getByRole("button", { name: "Save" })).toBeVisible();
  });

  it("closes on Esc (cancel) and returns focus to the trigger", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(screen.getByRole("dialog"), cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("closes on the close button and on a backdrop click, not on a click inside", async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(screen.getByRole("textbox", { name: "Name" }));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });

  it("locks body scroll while open", async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(document.documentElement.style.overflow).toBe("hidden");
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("Drawer uses the same mechanics", async () => {
    const onClose = vi.fn();
    render(<Harness As={Drawer} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });
  it("stays open when mounted open under Strict Mode, and still syncs a browser-initiated close", async () => {
    // Browsers queue the `close` event as a task; the setup stub fires it synchronously, which hides the bug.
    const close = vi.spyOn(HTMLDialogElement.prototype, "close").mockImplementation(function (this: HTMLDialogElement) {
      if (!this.open) return;
      this.removeAttribute("open");
      setTimeout(() => this.dispatchEvent(new Event("close")));
    });
    const tick = () => act(() => new Promise((r) => setTimeout(r)));
    try {
      const onClose = vi.fn();
      render(<StrictMode><Modal open onClose={onClose} title="Rename bot" /></StrictMode>);
      await tick();
      expect(onClose).not.toHaveBeenCalled();
      const dialog = screen.getByRole("dialog") as HTMLDialogElement;
      expect(dialog.open).toBe(true);

      dialog.close(); // e.g. Chrome closing on repeated Esc without a cancelable cancel
      await tick();
      expect(onClose).toHaveBeenCalledOnce();
    } finally {
      close.mockRestore();
    }
  });
});
