import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatPanel } from "./ChatPanel";
import { readSse, useChatStream } from "./useChatStream";

const enc = new TextEncoder();
const sse = (...parts: string[]) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (const p of parts) c.enqueue(enc.encode(p));
      c.close();
    },
  });
const token = (t: string, extra = {}) => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }], ...extra })}\n\n`;
const streamRes = (body: ReadableStream<Uint8Array>) =>
  new Response(body, { status: 200, headers: { "Content-Type": "text/event-stream" } });
const mockFetch = (res: Response | (() => Promise<Response>)) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(typeof res === "function" ? res : async () => res);

afterEach(() => vi.restoreAllMocks());

describe("readSse", () => {
  it("joins lines split across reads and skips malformed ones", async () => {
    const seen: string[] = [];
    const t = token("Hello");
    await readSse(sse(t.slice(0, 9), t.slice(9), "data: not json\n\n", token(" world")), (c) =>
      seen.push(c.choices![0].delta!.content!),
    );
    expect(seen).toEqual(["Hello", " world"]);
  });

  it("stops at [DONE] even when the stream stays open", async () => {
    const seen: string[] = [];
    const open = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode(token("a") + "data: [DONE]\n\n" + token("after")));
        // never closed
      },
    });
    await readSse(open, (c) => seen.push(c.choices![0].delta!.content!));
    expect(seen).toEqual(["a"]);
  });
});

describe("useChatStream", () => {
  it("streams the reply in and records provider, model and latency", async () => {
    const fetchSpy = mockFetch(streamRes(sse(token("Hi", { provider: "groq", model: "llama" }), token(" there"), "data: [DONE]\n\n")));
    const { result } = renderHook(() => useChatStream({ model: "llama", system: "Be brief." }));
    act(() => result.current.send("Hello"));
    await waitFor(() => expect(result.current.streaming).toBe(false));
    expect(result.current.messages).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there" },
    ]);
    expect(result.current.error).toBeNull();
    expect(result.current.meta).toMatchObject({ provider: "groq", model: "llama" });
    const body = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({ model: "llama", stream: true });
    expect(body.messages[0]).toEqual({ role: "system", content: "Be brief." });
  });

  it("shows plain copy for a failed request, never the API's own message", async () => {
    const cases: [number, Record<string, unknown> | string, string][] = [
      [401, { error: { message: "Authentication required. Please provide your API key via 'Authorization: Bearer <key>'", type: "invalid_key" } }, "You've been signed out. Refresh the page and sign in again."],
      [429, { error: { message: "Monthly request quota of 100 requests reached (100/100 used).", type: "quota_exceeded" } }, "You've used all your messages for this month."],
      [429, { error: { message: "Too many messages.", type: "rate_limited" } }, "Too many messages at once. Wait a minute and try again."],
      [402, { error: { message: "Your ZeroRoute subscription is currently inactive (paused).", type: "subscription_inactive" } }, "Your plan isn't active, so the chatbot can't answer right now."],
      [502, { error: { message: "All configured AI cloud providers failed.", request_id: "abc" } }, "Something went wrong on our side. Try again in a moment."],
      [500, "<html>Internal Server Error</html>", "Something went wrong on our side. Try again in a moment."],
    ];
    for (const [status, body, copy] of cases) {
      mockFetch(new Response(typeof body === "string" ? body : JSON.stringify(body), { status }));
      const { result } = renderHook(() => useChatStream());
      act(() => result.current.send("Hello"));
      await waitFor(() => expect(result.current.error).toBe(copy));
      expect(result.current.messages).toEqual([{ role: "user", content: "Hello" }]);
      vi.restoreAllMocks();
    }
  });

  it("treats an in-stream error as an error and keeps the partial reply", async () => {
    mockFetch(streamRes(sse(token("Part"), `data: ${JSON.stringify({ error: { message: "The upstream provider stream was interrupted." } })}\n\n`)));
    const { result } = renderHook(() => useChatStream());
    act(() => result.current.send("Hello"));
    await waitFor(() => expect(result.current.error).toBe("The reply was interrupted. Try again."));
    expect(result.current.messages.at(-1)).toEqual({ role: "assistant", content: "Part" });
  });

  it("reports an empty reply as an error", async () => {
    mockFetch(streamRes(sse("data: [DONE]\n\n")));
    const { result } = renderHook(() => useChatStream());
    act(() => result.current.send("Hello"));
    await waitFor(() => expect(result.current.error).toMatch(/empty reply/));
    expect(result.current.messages).toHaveLength(1);
  });

  it("reads a non-streamed JSON reply", async () => {
    mockFetch(new Response(JSON.stringify({ provider: "p", model: "m", choices: [{ message: { content: "Done." } }] }), { status: 200 }));
    const { result } = renderHook(() => useChatStream({ stream: false }));
    act(() => result.current.send("Hello"));
    await waitFor(() => expect(result.current.meta).not.toBeNull());
    expect(result.current.messages.at(-1)?.content).toBe("Done.");
  });

  it("retry resends the last question without duplicating it", async () => {
    mockFetch(async () => new Response(JSON.stringify({ error: { message: "Busy." } }), { status: 503 }));
    const { result } = renderHook(() => useChatStream());
    act(() => result.current.send("Hello"));
    await waitFor(() => expect(result.current.error).toMatch(/went wrong/));
    vi.restoreAllMocks();
    const fetchSpy = mockFetch(streamRes(sse(token("OK"))));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.messages.at(-1)?.content).toBe("OK"));
    expect(JSON.parse(fetchSpy.mock.calls[0][1]!.body as string).messages).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("stop aborts the request without showing an error", async () => {
    mockFetch(
      (async (_: unknown, init?: RequestInit) =>
        new Promise<Response>((_, reject) => init!.signal!.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))))) as never,
    );
    const { result } = renderHook(() => useChatStream());
    act(() => result.current.send("Hello"));
    await waitFor(() => expect(result.current.streaming).toBe(true));
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.streaming).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.messages).toEqual([{ role: "user", content: "Hello" }]);
  });
});

function Panel({ brandColor }: { brandColor?: string }) {
  const chat = useChatStream();
  return <ChatPanel chat={chat} title="Test" description="Test mode" brandColor={brandColor} suggestions={["What do you sell?"]} />;
}

describe("ChatPanel", () => {
  it("renders model links safely: http(s) as links, javascript: as plain text", async () => {
    mockFetch(streamRes(sse(token("See [docs](https://example.com) and [bad](javascript:alert(1))"))));
    render(<Panel />);
    await userEvent.click(screen.getByRole("button", { name: "What do you sell?" }));
    const log = screen.getByRole("log");
    await waitFor(() => expect(screen.getByRole("link", { name: "docs" })).toHaveAttribute("href", "https://example.com/"));
    expect(log.querySelectorAll("a")).toHaveLength(1);
    expect(log.innerHTML).not.toMatch(/javascript:/i);
    expect(log).toHaveTextContent("bad");
  });

  it("shows a failed request as an error with a retry button", async () => {
    mockFetch(new Response(JSON.stringify({ error: { message: "Invalid key.", type: "invalid_key" } }), { status: 401 }));
    render(<Panel />);
    await userEvent.type(screen.getByRole("textbox", { name: "Message" }), "Hi{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("You've been signed out.");
    expect(screen.getByRole("alert")).not.toHaveTextContent("Invalid key.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });

  it("fills visitor bubbles with the brand colour and readable text", async () => {
    mockFetch(streamRes(sse(token("Hello back"))));
    const { rerender } = render(<Panel brandColor="#fde047" />);
    expect(screen.getByRole("heading", { name: "Test" })).toBeInTheDocument();
    expect(screen.getByText("Test mode")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "Message" }), "Hi{Enter}");
    const mine = await screen.findByText("Hi");
    expect(mine).toHaveStyle({ backgroundColor: "#fde047" });
    expect(mine).toHaveClass("text-black");
    rerender(<Panel brandColor="#4f46e5" />);
    expect(screen.getByText("Hi")).toHaveClass("text-white");
    rerender(<Panel />);
    expect(screen.getByText("Hi")).toHaveClass("bg-accent", "text-accent-fg");
  });
});
