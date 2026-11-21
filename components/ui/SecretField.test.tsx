import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SecretField } from "./SecretField";

describe("SecretField", () => {
  it("masks all but the last 4 characters until revealed", async () => {
    const secret = "zr_live_abcdef123456";
    const { container } = render(<SecretField value={secret} label="API key" />);
    const toggle = screen.getByRole("button", { name: "Show API key" });

    expect(container).not.toHaveTextContent(secret);
    expect(container.querySelector("code")).toHaveTextContent(/3456$/);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await userEvent.click(toggle);
    expect(container.querySelector("code")).toHaveTextContent(secret);
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await userEvent.click(toggle);
    expect(container).not.toHaveTextContent(secret);
  });

  it("keeps short values fully masked", () => {
    const { container } = render(<SecretField value="abc123" label="PIN" />);
    expect(container).not.toHaveTextContent("123");
  });
});
