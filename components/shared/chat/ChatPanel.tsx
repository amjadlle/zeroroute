"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { RotateCcw, Send, Square } from "lucide-react";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Input } from "@/components/ui/Input";
import { Markdown } from "@/components/ui/Markdown";
import { Spinner } from "@/components/ui/Spinner";
import type { ChatStream } from "./useChatStream";

type ChatPanelProps = {
  chat: ChatStream;
  title: ReactNode;
  description?: ReactNode;
  /** Shown as the first chatbot message; display only, never sent to the model. */
  greeting?: string;
  /** Clickable starter questions, shown until the first message. */
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  /** E.g. the brand colour as a border on the Chatbot page preview (user data, not console styling). */
  style?: CSSProperties;
};

const bubble = "max-w-[85%] rounded-card px-3 py-2 text-body";

/** Message list and composer for a useChatStream conversation. Answers render through the safe Markdown component. */
export function ChatPanel({ chat, title, description, greeting, suggestions = [], placeholder = "Type a message", className, style }: ChatPanelProps) {
  const { messages, streaming, error, send, retry, stop, reset } = chat;
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, error]);

  const submit = (text: string) => {
    if (!text.trim() || streaming) return;
    send(text);
    setInput("");
  };
  const lastIndex = messages.length - 1;

  return (
    // Fixed height so the composer stays in view; dvh keeps it inside small phone screens.
    <Card style={style} className={cn("flex h-[36rem] max-h-[85dvh] min-h-80 flex-col overflow-hidden", className)}>
      <CardHeader
        title={title}
        description={description}
        actions={
          <Button variant="ghost" size="sm" leftIcon={<RotateCcw aria-hidden className="size-3.5" />} onClick={reset} disabled={!messages.length && !error}>
            New chat
          </Button>
        }
      />
      <div ref={logRef} role="log" aria-label="Conversation" aria-busy={streaming} className="flex-1 space-y-4 overflow-y-auto p-4">
        {!greeting && !messages.length && !error && !suggestions.length && (
          <p className="py-8 text-center text-body text-text-muted">Send a message to start.</p>
        )}
        {greeting && (
          <div className={cn(bubble, "bg-surface-sunken")}>
            <Markdown>{greeting}</Markdown>
          </div>
        )}
        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className={cn(bubble, "ml-auto w-fit whitespace-pre-wrap break-words bg-accent-soft text-text")}>
              {m.content}
            </div>
          ) : (
            <div key={i} className="grid justify-items-start gap-1">
              <div className={cn(bubble, "bg-surface-sunken")}>
                {m.content ? <Markdown>{m.content}</Markdown> : <Spinner size="sm" label="Waiting for the reply" className="text-text-muted" />}
              </div>
              {/* Always visible (not hover-only) so the actions work on touch screens. */}
              {m.content && !(streaming && i === lastIndex) && (
                <div className="flex items-center gap-1">
                  <CopyButton value={m.content} label="Copy reply" />
                  {i === lastIndex && (
                    <Button variant="ghost" size="sm" leftIcon={<RotateCcw aria-hidden className="size-3.5" />} onClick={retry}>
                      Retry
                    </Button>
                  )}
                </div>
              )}
            </div>
          ),
        )}
        {error && (
          <Alert tone="danger" title="The chatbot couldn't answer">
            <p>{error}</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={retry}>
              Try again
            </Button>
          </Alert>
        )}
        {!messages.length && suggestions.length > 0 && (
          <div className="grid gap-2">
            <p className="text-meta text-text-muted">Suggested questions</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <Button key={s} variant="secondary" size="sm" className="h-auto min-h-control-sm whitespace-normal py-1 text-left" onClick={() => submit(s)}>
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex gap-2 border-t border-border p-3"
      >
        <Input aria-label="Message" value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} autoComplete="off" />
        {streaming ? (
          <Button variant="secondary" leftIcon={<Square aria-hidden className="size-3.5" />} onClick={stop}>
            Stop
          </Button>
        ) : (
          <Button type="submit" leftIcon={<Send aria-hidden className="size-3.5" />} disabled={!input.trim()}>
            Send
          </Button>
        )}
      </form>
    </Card>
  );
}
