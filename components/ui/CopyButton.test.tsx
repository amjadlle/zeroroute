import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./CopyButton";

function mockClipboard(writeText: (text: string) => Promise<void>) {
  const spy = vi.fn(writeText);
  // userEvent.setup() installs its own clipboard stub, so define ours after it.
  Object.defineProperty(navigator, "clipboard", { value: { writeText: spy }, configurable: true });
  return spy;
}

afterEach(() => vi.useRealTimers());

describe("CopyButton", () => {
  it("copies the value, says Copied, then resets", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const writeText = mockClipboard(() => Promise.resolve());
    render(<CopyButton value="sk-123" label="Copy key" />);

    await user.click(screen.getByRole("button", { name: "Copy key" }));
    expect(writeText).toHaveBeenCalledWith("sk-123");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Copied");

    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByRole("button", { name: "Copy key" })).toBeInTheDocument();
  });

  it("says Copy failed and calls onError when the clipboard rejects", async () => {
    const user = userEvent.setup();
    const error = new Error("denied");
    mockClipboard(() => Promise.reject(error));
    const onError = vi.fn();
    render(<CopyButton value="x" variant="text" onError={onError} />);

    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("button", { name: "Copy failed" })).toHaveTextContent("Copy failed");
    expect(onError).toHaveBeenCalledWith(error);
  });
});
