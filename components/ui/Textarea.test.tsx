import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("is a multi-line textbox wired to the Field hint, error and required", async () => {
    const user = userEvent.setup();
    render(
      <Field label="System prompt" hint="Plain text" error="Too long" required>
        <Textarea />
      </Field>,
    );
    const box = screen.getByRole("textbox", { name: /System prompt/ });
    expect(box.tagName).toBe("TEXTAREA");
    expect(box).toBeRequired();
    expect(box).toBeInvalid();
    expect(box).toHaveAccessibleDescription("Plain text Too long");
    await user.type(box, "line 1{Enter}line 2");
    expect(box).toHaveValue("line 1\nline 2");
  });

  it("does not accept input when disabled", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Notes" disabled />);
    await user.type(screen.getByRole("textbox", { name: "Notes" }), "x");
    expect(screen.getByRole("textbox", { name: "Notes" })).toHaveValue("");
  });
});
