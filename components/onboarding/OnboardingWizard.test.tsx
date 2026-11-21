import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OnboardingWizard } from "./OnboardingWizard";

const PROFILE = {
  id: "c1", key: "zr_live_secret_1234", email: "hi@example.com", name: "Sub", company: "", website: "", bot_title: "Helper",
  bot_role: "", tone: "", greeting: "Hi!", prompts: ["What do you sell?"], persona: "", status: "active", days_remaining: 0,
  monthly_requests: 0, monthly_limit: 500, bot_id: "bot_abc", knowledge_docs_count: 0,
};

type Call = { url: string; method: string; body?: Record<string, unknown> };
let calls: Call[];
let failNext: string | null;

beforeEach(() => {
  calls = [];
  failNext = null;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? "GET";
    calls.push({ url, method, body: init.body ? JSON.parse(String(init.body)) : undefined });
    if (failNext === url && method === "POST") {
      failNext = null;
      return new Response(JSON.stringify({ error: "Database is busy." }), { status: 500 });
    }
    if (url === "/api/customer/profile") return new Response(JSON.stringify({ customer: PROFILE }));
    if (url === "/api/knowledge") return new Response(JSON.stringify({ documents: [] }));
    return new Response(JSON.stringify({ success: true }));
  }));
});

afterEach(() => vi.unstubAllGlobals());

const posts = (url: string) => calls.filter((c) => c.url === url && c.method === "POST");

it("blocks the account step until the company is set and the password is long enough", async () => {
  const user = userEvent.setup();
  render(<OnboardingWizard />);
  await user.click(await screen.findByRole("button", { name: "Save and continue" }));
  expect(screen.getByText("Enter your company or project name.")).toBeInTheDocument();

  await user.type(screen.getByLabelText(/Company or project name/), "Acme");
  await user.type(screen.getByLabelText("Password"), "abc");
  await user.click(screen.getByRole("button", { name: "Save and continue" }));
  expect(screen.getByText("Use at least 6 characters.")).toBeInTheDocument();
  expect(posts("/api/onboarding/setup")).toHaveLength(0);
});

it("keeps input and shows the error when a save fails, then advances on retry", async () => {
  const user = userEvent.setup();
  render(<OnboardingWizard />);
  await user.type(await screen.findByLabelText(/Company or project name/), "Acme");
  await user.type(screen.getByLabelText("Password"), "longenough");

  failNext = "/api/onboarding/setup";
  await user.click(screen.getByRole("button", { name: "Save and continue" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Database is busy.");
  expect(screen.getByLabelText(/Company or project name/)).toHaveValue("Acme");
  expect(screen.getByLabelText("Password")).toHaveValue("longenough");

  await user.click(screen.getByRole("button", { name: "Save and continue" }));
  expect(await screen.findByRole("heading", { name: "Your chatbot" })).toBeInTheDocument();
  expect(posts("/api/onboarding/setup").at(-1)?.body).toEqual({ name: "Acme", company: "Acme", website: "", password: "longenough" });
});

it("saves the chatbot, skips knowledge and finishes without saving knowledge again", async () => {
  const user = userEvent.setup();
  render(<OnboardingWizard />);
  await user.type(await screen.findByLabelText(/Company or project name/), "Acme");
  await user.click(screen.getByRole("button", { name: "Save and continue" }));

  await user.click(await screen.findByRole("button", { name: "Add question" }));
  await user.type(screen.getByLabelText("Suggested question 2"), "  Shipping?  ");
  await user.click(screen.getByRole("button", { name: "Save and continue" }));
  expect(await screen.findByRole("heading", { name: "Knowledge" })).toBeInTheDocument();
  expect(posts("/api/customer/persona")[0].body).toMatchObject({ bot_title: "Helper", greeting: "Hi!", prompts: ["What do you sell?", "Shipping?"] });

  await user.click(screen.getByRole("button", { name: "Skip for now" }));
  expect(await screen.findByRole("heading", { name: "You're all set" })).toBeInTheDocument();
  expect(screen.getByText(/data-bot-id="bot_abc"/)).toBeInTheDocument();
  expect(screen.queryByText(PROFILE.key)).not.toBeInTheDocument(); // masked until revealed

  // Only the two step saves wrote anything; no request carries the key or email in its URL.
  expect(calls.filter((c) => c.method === "POST").map((c) => c.url)).toEqual(["/api/onboarding/setup", "/api/customer/persona"]);
  expect(calls.every((c) => !c.url.includes("?"))).toBe(true);
});
