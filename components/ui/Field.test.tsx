import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { Input } from "./Input";
import { Select } from "./Select";

describe("Field", () => {
  it("labels its control", () => {
    render(<Field label="Email"><Input /></Field>);
    expect(screen.getByLabelText("Email")).toBeInstanceOf(HTMLInputElement);
  });

  it("describes the control with its hint and marks no error", () => {
    render(<Field label="Name" hint="Shown to visitors"><Input /></Field>);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveAccessibleDescription("Shown to visitors");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("an error sets aria-invalid and joins the description", () => {
    render(
      <Field label="Email" hint="Work address" error="Enter a valid email">
        <Input aria-describedby="extra" />
      </Field>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Work address Enter a valid email");
    expect(input.getAttribute("aria-describedby")).toMatch(/^extra /);
  });

  it("required renders the indicator and marks the control required", () => {
    render(<Field label="Plan" required><Select><option>Free</option></Select></Field>);
    const select = screen.getByLabelText(/Plan/);
    expect(select).toBeRequired();
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps an id the control already has", () => {
    render(<Field label="Key"><Input id="api-key" /></Field>);
    expect(screen.getByLabelText("Key")).toHaveAttribute("id", "api-key");
  });
});
