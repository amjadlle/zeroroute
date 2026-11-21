import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "./page";

let search = "";
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search),
  useRouter: () => ({ replace }),
  usePathname: () => "/login",
}));

const location = { href: "" };
beforeEach(() => {
  location.href = "";
  vi.stubGlobal("location", location);
});
afterEach(() => vi.unstubAllGlobals());

function stubFetch(body: object, status = 200) {
  const fetch = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

async function signIn() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Email/), "a@b.co");
  await user.type(screen.getByLabelText(/^Password/), "secret1");
  await user.click(screen.getByRole("button", { name: "Sign in" }));
}

it("returns to a same-origin ?redirect= after login", async () => {
  search = "redirect=/app/usage?x=1";
  const fetch = stubFetch({ role: "customer", redirect: "/app" });
  render(<LoginPage />);
  await signIn();
  await waitFor(() => expect(location.href).toBe("/app/usage?x=1"));
  expect(fetch).toHaveBeenCalledWith("/api/auth/login", expect.anything());
});

it("ignores an off-site ?redirect= and uses the role's console", async () => {
  search = "redirect=//evil.example";
  stubFetch({ role: "admin" });
  render(<LoginPage />);
  await signIn();
  await waitFor(() => expect(location.href).toBe("/admin"));
});

it("shows the server error in an alert", async () => {
  search = "";
  stubFetch({ error: "Invalid email or password." }, 401);
  render(<LoginPage />);
  await signIn();
  expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
  expect(location.href).toBe("");
});

it("?tab=signup shows the signup form with the server's password rule", () => {
  search = "tab=signup&redirect=/app";
  render(<LoginPage />);
  expect(screen.getByRole("radio", { name: "Create account" })).toBeChecked();
  expect(screen.getByLabelText("Name")).toHaveAttribute("autocomplete", "name");
  const password = screen.getByLabelText(/^Password/);
  expect(password).toHaveAttribute("minlength", "6");
  expect(password).toHaveAttribute("autocomplete", "new-password");
});

it("switching modes keeps ?redirect= in the URL", async () => {
  search = "redirect=/app/billing";
  render(<LoginPage />);
  await userEvent.click(screen.getByRole("radio", { name: "Create account" }));
  expect(replace).toHaveBeenLastCalledWith("/login?redirect=%2Fapp%2Fbilling&tab=signup", { scroll: false });
});
