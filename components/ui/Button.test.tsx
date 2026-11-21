import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("fires onClick and defaults to type=button", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute("type", "button");
  });

  it("while loading is disabled, busy, keeps its name and blocks clicks", async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders a link when href is given", () => {
    render(
      <>
        <Button href="/console/billing">Billing</Button>
        <Button href="https://example.com" target="_blank" rel="noreferrer">Docs</Button>
      </>,
    );
    expect(screen.getByRole("link", { name: "Billing" })).toHaveAttribute("href", "/console/billing");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "https://example.com");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("forwards its ref to the button", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBe(screen.getByRole("button", { name: "Save" }));
  });
});
