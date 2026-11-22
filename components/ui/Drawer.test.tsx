import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Drawer } from "./Drawer";

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Edit provider</button>
      <Drawer open={open} onClose={() => { onClose(); setOpen(false); }} title="Provider" description="Keys stay on the server.">
        <input aria-label="Base URL" />
      </Drawer>
    </>
  );
}

describe("Drawer", () => {
  it("is a named, described dialog that closes on Esc and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    const trigger = screen.getByRole("button", { name: "Edit provider" });
    await user.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Provider" });
    expect(dialog).toHaveAccessibleDescription("Keys stay on the server.");
    expect(screen.getByRole("textbox", { name: "Base URL" })).toBeVisible();

    // jsdom does not map Esc to `cancel`; dispatch what the browser sends.
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it("omits aria-describedby without a description", () => {
    render(<Drawer open onClose={() => {}} title="Logs" />);
    expect(screen.getByRole("dialog", { name: "Logs" })).not.toHaveAttribute("aria-describedby");
  });
});
