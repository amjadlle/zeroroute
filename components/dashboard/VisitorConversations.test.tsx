import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { conversationsCsv, VisitorConversations, type Conversation } from "./VisitorConversations";

const nav = vi.hoisted(() => ({ search: "", replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
  useRouter: () => ({ replace: nav.replace }),
  usePathname: () => "/app/usage",
}));

const ROWS: Conversation[] = [
  { id: "r1", timestamp: Date.UTC(2026, 10, 20, 9), origin: "shop.example.com", prompt_preview: "Do you ship abroad?", response_preview: "Yes, to 30 countries.", latency_ms: 420, status: 200 },
  { id: "r2", timestamp: Date.UTC(2026, 10, 20, 10), origin: "blog.example.com", prompt_preview: "Refund policy?", response_preview: null, latency_ms: 90, status: 500 },
];

const ok = (logs: Conversation[]) => () => Response.json({ stats: { logs, averageLatencyMs: 255 } });
const stubStats = (reply: () => Response) => vi.stubGlobal("fetch", vi.fn(async () => reply()));

afterEach(() => {
  vi.unstubAllGlobals();
  nav.search = "";
  nav.replace.mockClear();
});

it("lists conversations, filters them and opens the full text", async () => {
  stubStats(ok(ROWS));
  render(<VisitorConversations />);
  const table = await screen.findByRole("table", { name: "Visitor conversations" });
  expect(await within(table).findByText("Do you ship abroad?")).toBeInTheDocument();
  expect(within(table).getByText("Failed")).toBeInTheDocument();
  expect(screen.getByText(/255 ms average reply time/)).toBeInTheDocument();

  await userEvent.type(screen.getByRole("searchbox", { name: "Search conversations" }), "refund");
  expect(within(table).queryByText("Do you ship abroad?")).not.toBeInTheDocument();
  await userEvent.click(within(table).getByText("Refund policy?"));
  expect(screen.getByRole("dialog", { name: "Conversation" })).toHaveTextContent("The chatbot couldn't answer this one.");
});

it("shows a real empty state with a way forward", async () => {
  stubStats(ok([]));
  render(<VisitorConversations />);
  expect(await screen.findByText("No conversations yet")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Install your chatbot" })).toHaveAttribute("href", "/app/install");
  expect(screen.getByRole("button", { name: /Export CSV/ })).toBeDisabled();
});

it("shows load errors with a retry instead of an empty list", async () => {
  let fail = true;
  stubStats(() => (fail ? Response.json({ error: "Failed to fetch stats" }, { status: 500 }) : ok(ROWS)()));
  render(<VisitorConversations />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Failed to fetch stats");
  expect(screen.queryByText("No conversations yet")).not.toBeInTheDocument();
  fail = false;
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Do you ship abroad?")).toBeInTheDocument();
});

it("exports the shown conversations as a CSV file", async () => {
  stubStats(ok(ROWS));
  const blobs: Blob[] = [];
  vi.spyOn(URL, "createObjectURL").mockImplementation((b) => (blobs.push(b as Blob), "blob:x"));
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  render(<VisitorConversations />);
  await screen.findByText("Do you ship abroad?");
  await userEvent.click(screen.getByRole("button", { name: /Export CSV/ }));
  expect((click.mock.contexts[0] as HTMLAnchorElement).download).toMatch(/^visitor-conversations-.*\.csv$/);
  expect(blobs).toHaveLength(1);
  expect(await blobs[0].text()).toContain('"Do you ship abroad?","Yes, to 30 countries.","Answered","420"');
});

it("quotes CSV cells and stops visitor text running as a spreadsheet formula", () => {
  const csv = conversationsCsv([{ id: "x", timestamp: 0, prompt_preview: '=HYPERLINK("evil")', response_preview: 'Say "hi", then go', status: 200 }]);
  const row = csv.split("\r\n")[1];
  expect(row).toContain(`"'=HYPERLINK(""evil"")"`);
  expect(row).toContain(`"Say ""hi"", then go"`);
});

const REFUSAL: Conversation = { id: "r3", timestamp: Date.UTC(2026, 10, 20, 11), prompt_preview: "Can I pay in instalments?", response_preview: "I don't have specific information about that in my knowledge base.", latency_ms: 300, status: 200 };

it("opens pre-filtered from ?show=unanswered and asks the server for unanswered questions only", async () => {
  nav.search = "show=unanswered";
  const fetch = vi.fn(async () => Response.json({ stats: { logs: [REFUSAL], averageLatencyMs: 300 } }));
  vi.stubGlobal("fetch", fetch);
  render(<VisitorConversations />);
  const table = await screen.findByRole("table", { name: "Visitor conversations" });
  expect(await within(table).findByText("Not answered")).toBeInTheDocument();
  expect(String((fetch.mock.calls[0] as unknown[])[0])).toBe("/api/customer/stats?unanswered=1");
  expect(screen.getByText(/latest 1 questions your chatbot couldn't answer/)).toBeInTheDocument();
  const toggle = screen.getByRole("switch", { name: "Unanswered only" });
  expect(toggle).toBeChecked();
  await userEvent.click(toggle);
  expect(nav.replace).toHaveBeenLastCalledWith("/app/usage", { scroll: false });
});

it("turns the filter on from the switch and says so when nothing is unanswered", async () => {
  stubStats(ok(ROWS));
  const { rerender } = render(<VisitorConversations />);
  await screen.findByText("Do you ship abroad?");
  await userEvent.click(screen.getByRole("switch", { name: "Unanswered only" }));
  expect(nav.replace).toHaveBeenLastCalledWith("/app/usage?show=unanswered", { scroll: false });

  nav.search = "show=unanswered";
  stubStats(ok([]));
  rerender(<VisitorConversations />);
  expect(await screen.findByText("No unanswered questions")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Show all conversations" }));
  expect(nav.replace).toHaveBeenLastCalledWith("/app/usage", { scroll: false });
});

it("labels refusals as not answered in the CSV", () => {
  expect(conversationsCsv([REFUSAL]).split("\r\n")[1]).toContain('"Not answered","300"');
});
