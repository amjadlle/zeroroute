import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { UiProviders } from "@/components/ui/UiProviders";
import { fileProblem, MAX_FILE_BYTES } from "./AddKnowledgeDialog";
import { KnowledgeList, type KnowledgeSource } from "./KnowledgeList";

const SOURCE: KnowledgeSource = {
  id: "d1", title: "Pricing", type: "web_website", content: "…", char_count: 1234, source_url: "https://example.com/pricing", created_at: 0,
};

type Reply = { status?: number; body?: unknown };
function stubFetch(reply: (url: string) => Reply = () => ({})) {
  const fetch = vi.fn(async (...[url]: [string, RequestInit?]) => {
    const { status = 200, body = { success: true } } = reply(url);
    return Response.json(body, { status });
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

function setup(props: Partial<Parameters<typeof KnowledgeList>[0]> = {}) {
  const onChange = vi.fn(async () => {});
  const onRetry = vi.fn();
  render(
    <UiProviders>
      <KnowledgeList sources={[SOURCE]} onRetry={onRetry} onChange={onChange} {...props} />
    </UiProviders>,
  );
  return { onChange, onRetry };
}

const openAdd = async () => {
  await userEvent.click(screen.getAllByRole("button", { name: "Add knowledge" })[0]);
  return screen.getByRole("dialog", { name: "Add knowledge" });
};

afterEach(() => vi.unstubAllGlobals());

it("shows loading, not an empty list, while the first load runs", () => {
  setup({ sources: undefined });
  expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
  expect(screen.queryByText("No knowledge yet")).toBeNull();
});

it("shows a load error with a retry instead of an empty list", async () => {
  const { onRetry } = setup({ sources: [], error: "Failed to fetch knowledge documents." });
  expect(screen.getByRole("alert")).toHaveTextContent("Failed to fetch knowledge documents.");
  expect(screen.queryByText("No knowledge yet")).toBeNull();
  await userEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(onRetry).toHaveBeenCalled();
});

it("labels sources with glossary names", () => {
  setup();
  const row = screen.getByRole("row", { name: /Pricing/ });
  expect(within(row).getByText("Website")).toBeInTheDocument();
  expect(within(row).getByText("1,234 characters")).toBeInTheDocument();
});

it("asks before deleting, and keeps the dialog open with the error when it fails", async () => {
  let fail = true;
  const fetch = stubFetch(() => (fail ? { status: 500, body: { error: "Failed to delete knowledge document." } } : {}));
  const { onChange } = setup({ targetKey: "zr_c1" });

  await userEvent.click(screen.getByRole("button", { name: "Delete “Pricing”" }));
  expect(fetch).not.toHaveBeenCalled();
  const dialog = screen.getByRole("dialog", { name: "Delete this source?" });
  await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
  expect(await within(dialog).findByRole("alert")).toHaveTextContent("Failed to delete knowledge document.");
  expect(onChange).not.toHaveBeenCalled();

  fail = false;
  await userEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
  expect(await screen.findByText("Source deleted.")).toBeInTheDocument();
  expect(fetch).toHaveBeenLastCalledWith("/api/knowledge?id=d1&target_key=zr_c1", expect.objectContaining({ method: "DELETE" }));
  expect(onChange).toHaveBeenCalled();
});

it("keeps the add dialog open with the typed text when adding fails", async () => {
  let fail = true;
  const fetch = stubFetch(() => (fail ? { status: 500, body: { error: "Failed to add knowledge document." } } : {}));
  const { onChange } = setup({ sources: [] });

  const dialog = await openAdd();
  await userEvent.click(within(dialog).getByRole("radio", { name: "Text" }));
  await userEvent.type(within(dialog).getByRole("textbox", { name: /Name/ }), "Returns");
  await userEvent.type(within(dialog).getByRole("textbox", { name: /^Text/ }), "30 days.");
  await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));

  expect(await within(dialog).findByRole("alert")).toHaveTextContent("Failed to add knowledge document.");
  expect(dialog).toHaveAttribute("open");
  expect(within(dialog).getByRole("textbox", { name: /^Text/ })).toHaveValue("30 days.");
  expect(onChange).not.toHaveBeenCalled();

  fail = false;
  await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));
  expect(await screen.findByText("Added “Returns”.")).toBeInTheDocument();
  expect(dialog).not.toHaveAttribute("open");
  expect(JSON.parse(fetch.mock.lastCall![1]!.body as string)).toMatchObject({ title: "Returns", content: "30 days.", type: "manual_text" });
  expect(onChange).toHaveBeenCalled();
});

it("accepts a dropped file and uploads it", async () => {
  const fetch = stubFetch();
  setup({ sources: [], targetKey: "zr_c1" });
  const dialog = await openAdd();

  const file = new File(["# FAQ\nWe ship worldwide."], "faq.md", { type: "text/markdown" });
  fireEvent.drop(within(dialog).getByText("Choose a file or drop it here"), { dataTransfer: { files: [file] } });
  expect(within(dialog).getByText("faq.md")).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole("button", { name: "Add" }));

  expect(await screen.findByText("Added “faq.md”.")).toBeInTheDocument();
  expect(JSON.parse(fetch.mock.lastCall![1]!.body as string)).toEqual({
    title: "faq.md", content: "# FAQ\nWe ship worldwide.", type: "file_upload", target_key: "zr_c1",
  });
});

it("rejects files that are too big, empty or the wrong type before reading them", () => {
  const sized = (name: string, size: number) => Object.defineProperty(new File([], name), "size", { value: size });
  expect(fileProblem(sized("big.txt", MAX_FILE_BYTES + 1))).toMatch(/limit is 2 MB/);
  expect(fileProblem(sized("ok.txt", MAX_FILE_BYTES))).toBeNull();
  expect(fileProblem(sized("empty.md", 0))).toMatch(/empty/);
  expect(fileProblem(sized("report.pdf", 10))).toMatch(/\.md, \.txt or \.json/);
});
