import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { Input } from "./Input";
import { SearchInput } from "./SearchInput";

describe("Input", () => {
  it("accepts typing and takes the error wiring from Field", async () => {
    const user = userEvent.setup();
    render(<Field label="Bot name" error="Name is required"><Input /></Field>);
    const input = screen.getByRole("textbox", { name: "Bot name" });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Name is required");
    await user.type(input, "Ada");
    expect(input).toHaveValue("Ada");
  });

  it("ignores typing when disabled or read-only", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Input aria-label="Off" disabled defaultValue="a" />
        <Input aria-label="Copy me" readOnly defaultValue="b" />
      </>,
    );
    await user.type(screen.getByRole("textbox", { name: "Off" }), "x");
    await user.type(screen.getByRole("textbox", { name: "Copy me" }), "x");
    expect(screen.getByRole("textbox", { name: "Off" })).toHaveValue("a");
    expect(screen.getByRole("textbox", { name: "Copy me" })).toHaveValue("b");
  });

  it("hides a left icon from assistive tech", () => {
    render(<Input aria-label="Domain" leftIcon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("textbox", { name: "Domain" })).toBeInTheDocument();
  });
});

describe("SearchInput", () => {
  it("is a searchbox labelled by Field, with a decorative icon", async () => {
    const user = userEvent.setup();
    const { container } = render(<Field label="Search logs"><SearchInput /></Field>);
    const box = screen.getByRole("searchbox", { name: "Search logs" });
    await user.type(box, "timeout");
    expect(box).toHaveValue("timeout");
    expect(container.querySelector("svg")?.closest("[aria-hidden='true']")).not.toBeNull();
  });
});
