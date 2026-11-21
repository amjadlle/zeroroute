import { afterEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResetPasswordPage from "./page";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("email=a%40b.co"),
}));

afterEach(() => vi.unstubAllGlobals());

async function fill(confirm: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/^Code/), "12ab3456");
  await user.type(screen.getByLabelText(/^New password/), "secret1");
  await user.type(screen.getByLabelText(/^Confirm new password/), confirm);
  await user.click(screen.getByRole("button", { name: "Set password and sign in" }));
}

it("prefills the email and keeps only digits in the code", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ success: true })));
  render(<ResetPasswordPage />);
  expect(screen.getByLabelText(/^Email/)).toHaveValue("a@b.co");
  await fill("secret1");
  expect(await screen.findByText("Password updated")).toBeInTheDocument();
  expect(fetch).toHaveBeenCalledWith("/api/auth/reset-password", expect.objectContaining({
    body: JSON.stringify({ email: "a@b.co", code: "123456", newPassword: "secret1" }),
  }));
});

it("flags a mismatched confirmation on the field and does not submit", async () => {
  const fetch = vi.fn();
  vi.stubGlobal("fetch", fetch);
  render(<ResetPasswordPage />);
  await fill("secret2");
  const confirm = screen.getByLabelText(/^Confirm new password/);
  expect(confirm).toHaveAttribute("aria-invalid", "true");
  expect(confirm).toHaveAccessibleDescription("Passwords do not match.");
  expect(confirm).toHaveFocus();
  expect(fetch).not.toHaveBeenCalled();
});
