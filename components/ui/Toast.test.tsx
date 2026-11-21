import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useToast, type ToastOptions } from "./Toast";
import { UiProviders } from "./UiProviders";

function Harness({ message, options }: { message: string; options?: ToastOptions }) {
  const toast = useToast();
  return <button onClick={() => toast(message, options)}>Show</button>;
}

function setup(message: string, options?: ToastOptions) {
  render(<UiProviders><Harness message={message} options={options} /></UiProviders>);
  return screen.getByRole("button", { name: "Show" });
}

describe("useToast", () => {
  afterEach(() => vi.useRealTimers());

  it("uses role=status normally", async () => {
    await userEvent.click(setup("Saved"));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });

  it("uses role=alert for danger", async () => {
    await userEvent.click(setup("Couldn't save", { tone: "danger" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't save");
  });

  it("runs the action and dismisses", async () => {
    const onClick = vi.fn();
    await userEvent.click(setup("Deleted", { action: { label: "Undo", onClick } }));
    await userEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("dismisses on the dismiss button", async () => {
    await userEvent.click(setup("Saved"));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  // Timing tests use fireEvent: user-event's async wrapper waits on a real setTimeout(0),
  // which never fires under vitest fake timers (RTL only auto-advances jest's).
  it("auto-dismisses after about 4s", () => {
    vi.useFakeTimers();
    fireEvent.click(setup("Saved"));
    act(() => vi.advanceTimersByTime(3900));
    expect(screen.getByRole("status")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("pauses while hovered or focused and resumes after", () => {
    vi.useFakeTimers();
    fireEvent.click(setup("Saved"));
    act(() => vi.advanceTimersByTime(3000));
    fireEvent.mouseEnter(screen.getByRole("status"));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole("status")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByRole("status"));

    fireEvent.focus(screen.getByRole("button", { name: "Dismiss" }));
    act(() => vi.advanceTimersByTime(10_000));
    expect(screen.getByRole("status")).toBeInTheDocument();
    fireEvent.blur(screen.getByRole("button", { name: "Dismiss" }));

    act(() => vi.advanceTimersByTime(900));
    expect(screen.getByRole("status")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
