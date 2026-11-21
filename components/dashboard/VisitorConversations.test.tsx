import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { conversationsCsv, VisitorConversations, type Conversation } from "./VisitorConversations";

const ROWS: Conversation[] = [
  { id: "r1", timestamp: Date.UTC(2026, 10, 20, 9), origin: "shop.example.com", prompt_preview: "Do you ship abroad?", response_preview: "Yes, to 30 countries.", latency_ms: 420, status: 200 },
  { id: "r2", timestamp: Date.UTC(2026, 10, 20, 10), origin: "blog.example.com", prompt_preview: "Refund policy?", response_preview: null, latency_ms: 90, status: 500 },
];

const ok = (logs: Conversation[]) => () => Response.json({ stats: { logs, averageLatencyMs: 255 } });
const stubStats = (reply: () => Response) => vi.stubGlobal("fetch", vi.fn(async () => reply()));

afterEach(() => vi.unstubAllGlobals());

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
