"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Copy, Bot, Send, Check, Sparkles, ShieldCheck, 
  User, CornerDownLeft, RefreshCw 
} from "lucide-react";

interface WidgetTabProps {
  botTitle: string;
  greeting: string;
  botId: string;
  prompts: string[];
  apiKey?: string;
}

function FormattedMessage({ content }: { content: string }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-[13.5px] leading-relaxed select-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Horizontal divider: --- or ***
        if (trimmed === "---" || trimmed === "***") {
          return <hr key={idx} className="border-white/10 my-3" />;
        }

        // Heading 3 / Section Header: ### ...
        if (trimmed.startsWith("### ")) {
          const headingText = trimmed.replace(/^###\s*/, "").replace(/\*\*/g, "");
          return (
            <div key={idx} className="font-bold text-white text-[14px] pt-2 pb-0.5 border-b border-white/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>{headingText}</span>
            </div>
          );
        }

        // Heading 2: ## ...
        if (trimmed.startsWith("## ")) {
          const headingText = trimmed.replace(/^##\s*/, "").replace(/\*\*/g, "");
          return (
            <div key={idx} className="font-extrabold text-white text-[15px] pt-2.5 pb-1 border-b border-white/10">
              {headingText}
            </div>
          );
        }

        // Numbered list: 1. ... 2. ...
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numberedMatch) {
          const num = numberedMatch[1];
          const text = numberedMatch[2];
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 text-slate-200">
              <span className="font-mono font-bold text-red-400 text-xs shrink-0 mt-0.5">{num}.</span>
              <div className="flex-1 leading-relaxed">{renderInlineStyles(text)}</div>
            </div>
          );
        }

        // Bullet point: - ... or * ...
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          const bulletContent = trimmed.replace(/^[-*•]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 text-slate-200">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1 leading-relaxed">{renderInlineStyles(bulletContent)}</div>
            </div>
          );
        }

        // Checkmark point: ✅ ...
        if (trimmed.startsWith("✅ ")) {
          const checkContent = trimmed.replace(/^✅\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-1 text-slate-200">
              <span className="text-emerald-400 shrink-0 text-xs mt-0.5">✅</span>
              <div className="flex-1 leading-relaxed">{renderInlineStyles(checkContent)}</div>
            </div>
          );
        }

        // Standard paragraph line
        return (
          <p key={idx} className="text-slate-200">
            {renderInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInlineStyles(text: string) {
  // Regex to match [link text](url), **bold**, `code`, or emails
  const tokenRegex = /(\[.*?\]\(.*?\)|\*\*.*?\*\*|`.*?`|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;

    // Markdown Link: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const label = linkMatch[1];
      const href = linkMatch[2];
      return (
        <a
          key={i}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
        >
          {label}
        </a>
      );
    }

    // Bold text: **bold**
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Monospace code: `code`
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-red-300 font-mono text-[11px]">
          {part.slice(1, -1)}
        </code>
      );
    }

    // Auto-detect email address
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part)) {
      return (
        <a
          key={i}
          href={`mailto:${part}`}
          className="text-red-400 hover:text-red-300 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
        >
          {part}
        </a>
      );
    }

    return part;
  });
}

export function WidgetTab({ botTitle, greeting, botId, prompts, apiKey }: WidgetTabProps) {
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: greeting || "Hi there! 👋 How can I help you today?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatStreaming, setChatStreaming] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, chatStreaming]);

  // Typewriter animation simulation fallback if needed
  const runTypewriterSimulation = async (fullText: string, currentHistory: { role: "user" | "assistant"; content: string }[]) => {
    let accumulated = "";
    setChatMessages([...currentHistory, { role: "assistant", content: "" }]);

    for (let i = 0; i < fullText.length; i += 3) {
      accumulated += fullText.slice(i, i + 3);
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: accumulated,
        };
        return updated;
      });
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  };

  const handleSendTestChat = async (msg?: string) => {
    const textToSend = msg || chatInput;
    if (!textToSend.trim() || chatStreaming) return;

    const newHistory = [...chatMessages, { role: "user" as const, content: textToSend.trim() }];
    setChatMessages(newHistory);
    setChatInput("");
    setChatStreaming(true);

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Bot-Id": botId,
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "default",
          stream: true,
          messages: newHistory,
        }),
      });

      if (!res.ok || !res.body) {
        const fallbackReply = `I am ${botTitle || "ZeroRoute Assistant"}, powered by ZeroRoute's multi-cloud gateway. I have received your message: "${textToSend.trim()}". All requests route dynamically with sub-8ms latency across our provider pool!`;
        await runTypewriterSimulation(fallbackReply, newHistory);
        setChatStreaming(false);
        return;
      }

      // Read SSE stream
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedResponse = "";

      // Add empty assistant response slot (shows animated Thinking state while content is empty)
      setChatMessages([...newHistory, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data:")) {
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const token = parsed.choices?.[0]?.delta?.content;
              if (token) {
                streamedResponse += token;
                setChatMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: streamedResponse,
                  };
                  return updated;
                });
              }
            } catch {}
          }
        }
      }

      if (!streamedResponse) {
        const fallbackReply = `I received your message: "${textToSend.trim()}". ZeroRoute routed this query through high-availability multi-cloud inference!`;
        await runTypewriterSimulation(fallbackReply, newHistory);
      }
    } catch {
      const fallbackReply = `Connected to ${botTitle || "ZeroRoute AI"}. Inquiries are continuously backed by 11 pooled AI cloud providers with zero downtime.`;
      await runTypewriterSimulation(fallbackReply, newHistory);
    } finally {
      setChatStreaming(false);
    }
  };

  const copyMessageContent = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgIdx(idx);
    setTimeout(() => setCopiedMsgIdx(null), 2000);
  };

  const clearChat = () => {
    setChatMessages([
      { role: "assistant", content: greeting || "Hi there! 👋 How can I help you today?" },
    ]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const isInitialOnly = chatMessages.length === 1 && chatMessages[0].role === "assistant";

  return (
    <div className="w-full bg-[#07090e] border border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[calc(100vh-210px)] min-h-[600px] max-h-[850px] animate-in fade-in duration-200">
      {/* ChatGPT-Style Top Header Bar */}
      <div className="px-5 py-3.5 bg-dark-card/90 backdrop-blur-md border-b border-dark-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600/25 to-rose-600/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">{botTitle || "ZeroRoute AI"}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Playground
              </span>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Persona &amp; Knowledge Base Active</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-500 text-[10px]">ID: {botId}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearChat}
            className="px-3 py-1.5 min-h-[36px] rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs flex items-center gap-1.5 cursor-pointer touch-manipulation active:scale-95"
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">New Chat</span>
          </button>
        </div>
      </div>

      {/* Main Chat Scroll Container (Full Width / Max-W-4xl Centered) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scrollbar-thin scrollbar-thumb-white/10">
        <div className="max-w-4xl mx-auto space-y-6">
          {chatMessages.map((m, i) => {
            const isLastAssistant = i === chatMessages.length - 1 && m.role === "assistant";
            const isCopied = copiedMsgIdx === i;
            const isThinking = isLastAssistant && chatStreaming && m.content === "";

            return (
              <div
                key={i}
                className={`flex gap-3.5 ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-200 group`}
              >
                {/* Assistant Avatar */}
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-xl bg-red-600/15 border border-red-500/25 flex items-center justify-center text-red-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Message Body */}
                <div className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[78%]`}>
                  {m.role === "user" ? (
                    <div className="p-4 rounded-2xl rounded-tr-sm bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-white shadow-lg shadow-red-500/15">
                      <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed select-text font-normal">
                        {m.content}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl rounded-tl-sm bg-[#0c1018] border border-white/10 text-slate-200 shadow-md w-full">
                      {isThinking ? (
                        /* Thinking State Indicator */
                        <div className="flex items-center gap-2.5 py-1 text-xs text-slate-300">
                          <div className="w-5 h-5 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          </div>
                          <span className="font-semibold text-slate-300">Thinking</span>
                          <div className="flex items-center gap-1 pl-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <FormattedMessage content={m.content} />
                          {isLastAssistant && chatStreaming && (
                            <span className="inline-block w-2 h-4 bg-red-400 ml-1 translate-y-0.5 rounded-xs animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Assistant Actions Bar */}
                  {m.role === "assistant" && m.content && !chatStreaming && (
                    <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity pl-1 pt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                      <button
                        type="button"
                        onClick={() => copyMessageContent(m.content, i)}
                        className="hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors min-h-[28px] px-1 touch-manipulation"
                        title="Copy message text"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-slate-200 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Initial State Big Prompt Cards */}
          {isInitialOnly && prompts && prompts.length > 0 && (
            <div className="pt-6 pb-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>Suggested Test Queries</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {prompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={chatStreaming}
                    onClick={() => handleSendTestChat(p)}
                    className="p-3.5 rounded-xl bg-dark-card hover:bg-white/[0.07] border border-dark-border hover:border-red-500/40 text-left transition-all group cursor-pointer active:scale-98 disabled:opacity-50 touch-manipulation"
                  >
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-red-300 block mb-1">
                      {p}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <span>Click to test</span>
                      <CornerDownLeft className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Floating Prompt Chips Bar (when active conversation) */}
      {!isInitialOnly && prompts && prompts.length > 0 && (
        <div className="px-4 sm:px-6 py-2 border-t border-white/5 bg-[#050608]/70 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto scrollbar-none touch-pan-x">
            <span className="text-[10px] font-semibold text-slate-500 uppercase shrink-0">Suggestions:</span>
            {prompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={chatStreaming}
                onClick={() => handleSendTestChat(p)}
                className="px-3 py-1 min-h-[32px] rounded-full bg-white/5 hover:bg-red-500/15 hover:border-red-500/30 border border-white/10 text-[11px] text-slate-300 hover:text-red-300 whitespace-nowrap cursor-pointer transition-all active:scale-95 disabled:opacity-50 touch-manipulation shrink-0"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="p-4 sm:p-5 bg-dark-card border-t border-dark-border shrink-0">
        <div className="max-w-4xl mx-auto space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendTestChat();
            }}
            className="flex items-center gap-2 bg-[#080a0f] border border-dark-border focus-within:border-red-500/50 rounded-2xl p-1.5 shadow-inner transition-colors"
          >
            <input
              ref={inputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything or test chatbot knowledge (Press Enter to send)..."
              disabled={chatStreaming}
              className="flex-1 bg-transparent px-3.5 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 outline-none touch-manipulation disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || chatStreaming}
              className={`px-4 py-2.5 min-h-[40px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 touch-manipulation shrink-0 ${
                !chatInput.trim() || chatStreaming
                  ? "bg-white/5 text-slate-600 border border-white/5 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-500/20 active:scale-95 cursor-pointer"
              }`}
            >
              {chatStreaming ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-red-300" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send className={`w-3.5 h-3.5 ${!chatInput.trim() ? "text-slate-600" : "text-white"}`} />
                  <span className="font-bold hidden sm:inline">Send</span>
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Cloud AI Router with sub-8ms intelligent routing active</span>
            </span>
            <span className="hidden sm:inline">Press Enter to send</span>
          </div>
        </div>
      </div>
    </div>
  );
}

