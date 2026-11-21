import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { PENDING_BACKOFF_MS, Welcome } from "./Welcome";

const nav = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(nav.query) }));
const confetti = vi.hoisted(() => vi.fn());
vi.mock("canvas-confetti", () => ({ default: confetti }));

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const unauthorized = () => json({ error: "Unauthorized. Please log in." }, 401);

function stubApi(routes: { checkout?: () => Response; profile?: () => Response }) {
  const fetchMock = vi.fn(async (url: string) =>
    url.startsWith("/api/checkout/session") ? (routes.checkout ?? unauthorized)() : (routes.profile ?? unauthorized)());
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  confetti.mockClear();
  nav.query = "";
});

it("confirms a paid checkout with confetti and plain links (no key in any URL)", async () => {
  nav.query = "subscription_id=sub_1";
  stubApi({ checkout: () => json({ success: true, key: "zr_secret_key", botId: "b1" }) });
  render(<Welcome />);
  expect(await screen.findByText("Payment confirmed")).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Welcome to ZeroRoute Pro" })).toBeInTheDocument();
  await waitFor(() => expect(confetti).toHaveBeenCalledOnce());
  expect(screen.getByRole("link", { name: /Set up your chatbot/ })).toHaveAttribute("href", "/onboarding");
  expect(screen.getByRole("link", { name: "Go to the console" })).toHaveAttribute("href", "/app");
  for (const a of screen.getAllByRole("link")) expect(a.getAttribute("href")).not.toContain("zr_secret_key");
  expect(document.body).not.toHaveTextContent("zr_secret_key");
});

it("polls with backoff while the webhook is pending, then shows the paid state", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  nav.query = "session_id=cs_1";
  let calls = 0;
  const fetchMock = stubApi({ checkout: () => (++calls < 3 ? json({ success: false, paid: true, pending: true }, 202) : json({ success: true })) });
  render(<Welcome />);
  await act(() => vi.advanceTimersByTimeAsync(PENDING_BACKOFF_MS[0] + PENDING_BACKOFF_MS[1]));
  expect(await screen.findByText("Payment confirmed")).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(3);
});

it("shows a calm processing state when the webhook never arrives, and can check again", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  nav.query = "session_id=cs_1";
  const fetchMock = stubApi({ checkout: () => json({ success: false, paid: true, pending: true }, 202) });
  render(<Welcome />);
  await act(() => vi.advanceTimersByTimeAsync(PENDING_BACKOFF_MS.reduce((a, b) => a + b)));
  expect(await screen.findByRole("heading", { name: "We are setting up your account" })).toBeInTheDocument();
  expect(fetchMock).toHaveBeenCalledTimes(PENDING_BACKOFF_MS.length + 1);
  expect(screen.queryByText("Payment confirmed")).not.toBeInTheDocument();
  expect(confetti).not.toHaveBeenCalled();

  await userEvent.setup({ advanceTimers: vi.advanceTimersByTime }).click(screen.getByRole("button", { name: "Check again" }));
  expect(fetchMock).toHaveBeenCalledTimes(PENDING_BACKOFF_MS.length + 2);
});

it("shows the failed state when the payment is not confirmed, without confetti", async () => {
  nav.query = "payment_id=pay_1";
  stubApi({ checkout: () => json({ error: "Payment verification failed or payment is incomplete." }, 400) });
  render(<Welcome />);
  expect(await screen.findByRole("heading", { name: "We could not confirm your payment" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  expect(confetti).not.toHaveBeenCalled();
});

it("on a repeat visit to a claimed checkout without a session, asks to log in", async () => {
  nav.query = "subscription_id=sub_1";
  stubApi({ checkout: () => json({ success: false, paid: true, claimed: true }) });
  render(<Welcome />);
  expect(await screen.findByText("Payment confirmed")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  expect(screen.queryByRole("link", { name: /Set up your chatbot/ })).not.toBeInTheDocument();
});

it("gives a signed-in Free customer a neutral welcome with an upgrade link", async () => {
  // Signup writes status "active" too; only the Pro limit makes it paid.
  stubApi({ profile: () => json({ customer: { status: "active", monthly_limit: 500 } }) });
  render(<Welcome />);
  expect(await screen.findByRole("heading", { name: "Welcome to ZeroRoute" })).toBeInTheDocument();
  expect(screen.getByText("Free plan")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Upgrade to Pro" })).toHaveAttribute("href", "/app/billing");
  expect(screen.queryByText("Payment confirmed")).not.toBeInTheDocument();
  expect(confetti).not.toHaveBeenCalled();
});

it("gives a signed-in Pro customer a welcome without claiming a new payment", async () => {
  stubApi({ profile: () => json({ customer: { status: "active", monthly_limit: 10000 } }) });
  render(<Welcome />);
  expect(await screen.findByText("Pro plan")).toBeInTheDocument();
  expect(screen.queryByText("Payment confirmed")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Upgrade to Pro" })).not.toBeInTheDocument();
});

it("asks a signed-out visitor with no checkout to log in", async () => {
  const fetchMock = stubApi({});
  render(<Welcome />);
  expect(await screen.findByRole("heading", { name: "Nothing to show here yet" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining("/api/checkout/session"), expect.anything());
});
