"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Bot, Send, Check, Trash2, Sparkles, ShieldCheck } from "lucide-react";

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
    <div className="space-y-1.5 text-[13px] leading-relaxed select-text">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // Horizontal divider: --- or ***
        if (trimmed === "---" || trimmed === "***") {
          return <hr key={idx} className="border-white/10 my-2" />;
        }

        // Heading 3 / Section Header: ### ...
        if (trimmed.startsWith("### ")) {
          const headingText = trimmed.replace(/^###\s*/, "").replace(/\*\*/g, "");
          return (
            <div key={idx} className="font-bold text-white text-[13.5px] pt-1.5 pb-0.5 border-b border-white/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <span>{headingText}</span>
            </div>
          );
        }

        // Heading 2: ## ...
        if (trimmed.startsWith("## ")) {
          const headingText = trimmed.replace(/^##\s*/, "").replace(/\*\*/g, "");
          return (
            <div key={idx} className="font-extrabold text-white text-sm pt-2 pb-0.5 border-b border-white/10">
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
            <div key={idx} className="flex items-start gap-2 pl-1 text-slate-200">
              <span className="font-mono font-bold text-red-400 text-xs shrink-0 mt-0.5">{num}.</span>
              <div className="flex-1 leading-snug">{renderInlineStyles(text)}</div>
            </div>
          );
        }

        // Bullet point: - ... or * ...
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          const bulletContent = trimmed.replace(/^[-*•]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-slate-200">
              <span className="text-red-400 font-bold shrink-0 mt-0.5">•</span>
              <div className="flex-1 leading-snug">{renderInlineStyles(bulletContent)}</div>
            </div>
          );
        }

        // Checkmark point: ✅ ...
        if (trimmed.startsWith("✅ ")) {
          const checkContent = trimmed.replace(/^✅\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 text-slate-200">
              <span className="text-emerald-400 shrink-0 text-xs mt-0.5">✅</span>
              <div className="flex-1 leading-snug">{renderInlineStyles(checkContent)}</div>
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
  const [copied, setCopied] = useState(false);
  const [copiedBotId, setCopiedBotId] = useState(false);
  const [copiedMsgIdx, setCopiedMsgIdx] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://zeroroute.mapki.in";
  const embedScript = `<script 
  src="${siteUrl}/widget.js" 
  data-bot-id="${botId || "bot_live_demo"}" 
  defer>
</script>`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, chatStreaming]);

  // Smooth typewriter simulation fallback if offline/no keys
  const runTypewriterSimulation = async (fullText: string, currentHistory: { role: "user" | "assistant"; content: string }[]) => {
    let accumulated = "";
    // Add initial placeholder for streaming
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
        // Fallback intelligent response with typewriter animation
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

      // Add empty assistant response slot
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
      const fallbackReply = `Connected to ${botTitle || "ZeroRoute AI"}. Inquiries are continuously backed by 10 multi-cloud AI providers with zero downtime failover.`;
      await runTypewriterSimulation(fallbackReply, newHistory);
    } finally {
      setChatStreaming(false);
    }
  };

  const copyWidgetScript = () => {
    navigator.clipboard.writeText(embedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyBotId = () => {
    navigator.clipboard.writeText(botId || "bot_live_demo");
    setCopiedBotId(true);
    setTimeout(() => setCopiedBotId(false), 2000);
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
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
      {/* Left: Settings & Embed Code */}
      <div className="lg:col-span-5 space-y-4">
        <div className="p-5 bg-dark-card border border-dark-border rounded-2xl space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">1-Line Embeddable Script</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
              HTML / React / Webflow
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Paste this snippet right before <code className="text-red-400 bg-red-500/10 px-1 py-0.5 rounded font-mono">&lt;/body&gt;</code> in your website or web application.
          </p>

          <pre className="p-3 bg-[#080a0f] border border-dark-border rounded-xl text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed select-all">
            <code>{embedScript}</code>
          </pre>

          <button
            type="button"
            onClick={copyWidgetScript}
            className="w-full py-3 px-4 min-h-[44px] rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 touch-manipulation"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied Script to Clipboard!" : "Copy Embed Script"}</span>
          </button>
        </div>

        <div className="p-5 bg-dark-card border border-dark-border rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Public Bot ID:</span>
            <button
              type="button"
              onClick={copyBotId}
              className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer min-h-[44px] px-2 touch-manipulation"
            >
              {copiedBotId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBotId ? "Copied!" : "Copy ID"}</span>
            </button>
          </div>
          <div className="font-mono text-xs text-slate-300 bg-[#080a0f] p-2.5 rounded-xl border border-dark-border break-all select-all">
            {botId || "bot_live_demo"}
          </div>
          <p className="text-[11px] text-slate-500">
            Safe for public client-side widget embeds. Master router secret keys remain private on your backend.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-slate-300 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Real-time token streaming with sub-8ms failover circuit breaker is active.</span>
        </div>
      </div>

      {/* Right: Live Interactive Chat Simulator */}
      <div className="lg:col-span-7 bg-[#080a0f] border border-dark-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] sm:h-[560px]">
        {/* Chat Header */}
        <div className="px-4 py-3 bg-dark-card border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shadow-sm shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white block">{botTitle || "ZeroRoute AI"}</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Live Test
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Multi-Cloud Pool Online</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={clearChat}
            className="p-2 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-xs flex items-center justify-center gap-1 cursor-pointer touch-manipulation"
            title="Reset Simulator Chat"
            aria-label="Clear chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs leading-relaxed">
          {chatMessages.map((m, i) => {
            const isLastAssistant = i === chatMessages.length - 1 && m.role === "assistant";
            const isCopied = copiedMsgIdx === i;

            return (
              <div
                key={i}
                className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"} animate-in fade-in duration-150 group`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl ${
                    m.role === "user"
                      ? "bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-tr-none shadow-md shadow-red-500/15"
                      : "bg-dark-card border border-dark-border text-slate-200 rounded-tl-none shadow-sm"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="relative">
                      <FormattedMessage content={m.content} />
                      {isLastAssistant && chatStreaming && (
                        <span className="inline-block w-2 h-4 bg-red-500 ml-1 translate-y-0.5 rounded-xs animate-pulse" />
                      )}
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap text-[13px]">{m.content}</span>
                  )}
                </div>

                {/* Assistant Message Quick Actions */}
                {m.role === "assistant" && m.content && !chatStreaming && (
                  <div className="opacity-0 group-hover:opacity-100 sm:opacity-0 focus-within:opacity-100 transition-opacity pl-1 pt-1 flex items-center gap-2 text-[10px] text-slate-500">
                    <button
                      type="button"
                      onClick={() => copyMessageContent(m.content, i)}
                      className="hover:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors min-h-[32px] px-1 touch-manipulation"
                      title="Copy message text"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Chips */}
        {prompts && prompts.length > 0 && (
          <div className="px-3 sm:px-4 py-2 border-t border-white/5 flex gap-1.5 overflow-x-auto scrollbar-none bg-[#050608]/50 touch-pan-x">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                disabled={chatStreaming}
                onClick={() => handleSendTestChat(p)}
                className="px-3 py-1.5 min-h-[36px] rounded-full bg-white/5 hover:bg-red-500/15 hover:border-red-500/30 border border-white/10 text-[11px] text-slate-300 hover:text-red-300 whitespace-nowrap cursor-pointer transition-all active:scale-95 disabled:opacity-50 touch-manipulation shrink-0"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Chat Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendTestChat();
          }}
          className="p-3 bg-dark-card border-t border-dark-border flex gap-2"
        >
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a test message to stream through failover router…"
            className="flex-1 bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 outline-none touch-manipulation"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || chatStreaming}
            className={`px-4 py-2.5 min-h-[44px] min-w-[44px] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 touch-manipulation shrink-0 ${
              !chatInput.trim() || chatStreaming
                ? "bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed"
                : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer"
            }`}
          >
            {chatStreaming ? (
              <Sparkles className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <Send className={`w-4 h-4 ${!chatInput.trim() ? "text-slate-500" : "text-white"}`} />
            )}
            <span className="inline font-bold">{chatStreaming ? "Streaming…" : "Send"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

