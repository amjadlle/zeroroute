import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Field } from "./Field";
import { PasswordInput } from "./PasswordInput";
import { SearchInput } from "./SearchInput";

describe("PasswordInput", () => {
  it("toggles the input type with the reveal button", async () => {
    const user = userEvent.setup();
    render(<Field label="Password"><PasswordInput /></Field>);
    const input = screen.getByLabelText("Password");
    const toggle = screen.getByRole("button", { name: "Show password" });

    expect(input).toHaveAttribute("type", "password");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "text");
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(input).toHaveAttribute("type", "password");
  });
});

describe("SearchInput", () => {
  it("is a labelled searchbox", () => {
    render(<SearchInput aria-label="Search logs" />);
    expect(screen.getByRole("searchbox", { name: "Search logs" })).toBeInTheDocument();
  });
});
