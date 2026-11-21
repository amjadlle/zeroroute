import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { CustomerConsole, useCustomer } from "./CustomerConsole";

vi.mock("next/navigation", () => ({
  usePathname: () => "/app/billing",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

const PROFILE = {
  id: "c1", key: "zr_live_x", email: "hi@example.com", name: "Brightpath", bot_title: "Bot", bot_role: "", tone: "", greeting: "",
  prompts: [], persona: "", status: "active", days_remaining: 0, monthly_requests: 12, monthly_limit: 0, bot_id: "b1", knowledge_docs_count: 1,
};

function Probe() {
  const { profile, monthlyLimit, isPro } = useCustomer();
  return <p>{`${profile.name} ${monthlyLimit} ${isPro ? "pro" : "free"}`}</p>;
}

function stubApi(profile: () => Response) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) =>
    url === "/api/customer/profile" ? profile() : new Response(JSON.stringify({ documents: [{ id: "d1" }] }))));
}

afterEach(() => vi.unstubAllGlobals());

it("gives pages the profile, with the Free plan limit when none is stored", async () => {
  stubApi(() => new Response(JSON.stringify({ customer: PROFILE })));
  render(<CustomerConsole><Probe /></CustomerConsole>);
  expect(await screen.findByText("Brightpath 500 free")).toBeInTheDocument();
  expect(screen.getAllByText("Free plan").length).toBeGreaterThan(0);
  expect(screen.getByRole("link", { name: /Knowledge/ })).toHaveTextContent("1");
});

it("shows a load error with a retry instead of a blank page", async () => {
  let fail = true;
  stubApi(() => fail
    ? new Response(JSON.stringify({ error: "Failed to fetch customer profile." }), { status: 500 })
    : new Response(JSON.stringify({ customer: PROFILE })));
  render(<CustomerConsole><Probe /></CustomerConsole>);

  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to fetch customer profile.");
  fail = false;
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Brightpath 500 free")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
