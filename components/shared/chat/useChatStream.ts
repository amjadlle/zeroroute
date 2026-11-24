"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ChatMeta = { provider?: string; model?: string; latencyMs: number };

type Chunk = {
  provider?: string;
  model?: string;
  error?: { message?: string };
  choices?: { delta?: { content?: string }; message?: { content?: string } }[];
};

/**
 * Reads an OpenAI-style SSE body ("data: {...}" lines, ended by "data: [DONE]"), calling onChunk for each JSON
 * chunk. Stops at [DONE] even if the server keeps the connection open. Lines that aren't JSON are skipped.
 */
export async function readSse(body: ReadableStream<Uint8Array>, onChunk: (chunk: Chunk) => void): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const handle = (line: string): boolean => {
    const t = line.trim();
    if (!t.startsWith("data:")) return false;
    const data = t.slice(5).trim();
    if (data === "[DONE]") return true;
    let chunk: Chunk;
    try {
      chunk = JSON.parse(data);
    } catch {
      return false; // a malformed line: nothing to show
    }
    onChunk(chunk); // may throw (an in-stream error), which ends the read
    return false;
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split("\n");
      buffer = done ? "" : (lines.pop() ?? "");
      for (const line of lines) if (handle(line)) return;
      if (done) return;
    }
  } finally {
    reader.cancel().catch(() => {});
  }
}

/** Errors carrying copy that is safe to show. Anything else (raw API text, parse errors) gets the generic line. */
class ChatError extends Error {}

const FAILED = "Something went wrong on our side. Try again in a moment.";
const STATUS_COPY: Record<number, string> = {
  400: "That message couldn't be sent. Try a shorter message.",
  401: "You've been signed out. Refresh the page and sign in again.",
  402: "Your plan isn't active, so the chatbot can't answer right now.",
  403: "You've been signed out. Refresh the page and sign in again.",
  413: "That message couldn't be sent. Try a shorter message.",
  429: "Too many messages at once. Wait a minute and try again.",
};

/** Plain copy for a failed response. The API's own message is written for developers, so it is never shown here. */
async function errorMessage(res: Response): Promise<string> {
  let type: unknown;
  try {
    type = (await res.json())?.error?.type;
  } catch {
    // not JSON
  }
  if (type === "quota_exceeded") return "You've used all your messages for this month.";
  return STATUS_COPY[res.status] ?? FAILED;
}

type Options = {
  /** Extra headers, e.g. X-Bot-Id. Auth is the session cookie. */
  headers?: Record<string, string>;
  model?: string;
  /** Optional system message sent before the conversation (not stored in messages). */
  system?: string;
  /** false asks for one JSON reply instead of a stream. */
  stream?: boolean;
  endpoint?: string;
};

/** Chat with /v1/chat/completions: streams the reply in, with stop, retry and a real error state. */
export function useChatStream({ headers, model = "default", system, stream = true, endpoint = "/v1/chat/completions" }: Options = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ChatMeta | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    async (history: ChatMessage[]) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setMessages([...history, { role: "assistant", content: "" }]);
      setStreaming(true);
      setError(null);
      setMeta(null);
      const started = Date.now();
      let reply = "";
      let provider: string | undefined;
      let replyModel: string | undefined;
      const setReply = () =>
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: reply }]);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify({
            model,
            stream,
            messages: system?.trim() ? [{ role: "system", content: system.trim() }, ...history] : history,
          }),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new ChatError(await errorMessage(res));
        const take = (c: Chunk) => {
          if (c.error) throw new ChatError("The reply was interrupted. Try again.");
          provider = c.provider ?? provider;
          replyModel = c.model ?? replyModel;
          const text = c.choices?.[0]?.delta?.content ?? c.choices?.[0]?.message?.content;
          if (text) {
            reply += text;
            setReply();
          }
        };
        if (res.body && (res.headers.get("content-type") ?? "").includes("text/event-stream")) await readSse(res.body, take);
        else take(await res.json());
        if (!reply.trim()) throw new ChatError("The chatbot sent back an empty reply. Try again.");
        setMeta({ provider, model: replyModel, latencyMs: Date.now() - started });
      } catch (e) {
        if (ctrl.signal.aborted) return; // stopped by the user or replaced by a newer send: keep what arrived
        setError(e instanceof ChatError ? e.message : e instanceof TypeError ? "Couldn't reach the server. Check your connection and try again." : FAILED);
        // Drop an empty reply bubble; keep a partial one so the user sees what arrived before the failure.
        if (!reply) setMessages((prev) => prev.slice(0, -1));
      } finally {
        if (abortRef.current === ctrl) {
          abortRef.current = null;
          setStreaming(false);
        }
      }
    },
    [endpoint, headers, model, stream, system],
  );

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content) return;
      // Drop a failed partial reply so the model doesn't see it as a finished answer.
      const history = error && messages.at(-1)?.role === "assistant" ? messages.slice(0, -1) : messages;
      void run([...history, { role: "user", content }]);
    },
    [error, messages, run],
  );

  /** Sends the last question again, replacing whatever reply (or partial reply) followed it. */
  const retry = useCallback(() => {
    const lastUser = messages.findLastIndex((m) => m.role === "user");
    if (lastUser >= 0) void run(messages.slice(0, lastUser + 1));
  }, [messages, run]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    setMessages((prev) => (prev.at(-1)?.role === "assistant" && !prev.at(-1)?.content ? prev.slice(0, -1) : prev));
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([]);
    setError(null);
    setMeta(null);
  }, [stop]);

  return { messages, streaming, error, meta, send, retry, stop, reset };
}

export type ChatStream = ReturnType<typeof useChatStream>;
