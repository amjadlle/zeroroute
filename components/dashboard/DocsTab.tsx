"use client";

import { useState, useEffect } from "react";
import {
  Code2,
  BookOpen,
  Copy,
  Check,
  Sparkles,
  Sliders,
  X,
  Bot,
  ExternalLink,
  Send,
  Eye,
  EyeOff
} from "lucide-react";

interface DocsTabProps {
  apiKey?: string;
  botId?: string;
  initialBotTitle?: string;
  initialGreeting?: string;
  initialPrompts?: string[];
}

export function DocsTab({
  apiKey,
  botId = "bot_live_demo",
  initialBotTitle = "ZeroRoute AI",
  initialGreeting = "Hi! 👋 How can I help you today?",
  initialPrompts = ["What are your services?", "Pricing details", "How to get started?"],
}: DocsTabProps) {
  const effectiveKey = apiKey || "zr_live_demo";

  // Tab selection
  const [activeSnippet, setActiveSnippet] = useState<"widget" | "ai" | "js" | "py" | "curl">("widget");

  // Customization state
  const [botTitle, setBotTitle] = useState(initialBotTitle);
  const [brandColor, setBrandColor] = useState("#ef4444");
  const [greeting, setGreeting] = useState(initialGreeting);
  const [promptChips, setPromptChips] = useState(
    initialPrompts.length > 0
      ? initialPrompts.join(",")
      : "What are your services?,Pricing details,How to get started?"
  );

  // Guide modal state
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<"agent" | "html" | "wp" | "shopify" | "next" | "sdk">("agent");

  // Copy state
  const [copied, setCopied] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // Host URL detection
  const hostUrl = typeof window !== "undefined" ? window.location.origin : "https://zeroroute.mapki.in";

  // Build snippet content
  const cleanPrompts = promptChips
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean)
    .join(",");

  const snippets = {
    widget: `<!-- 1-LINE CHATBOT WIDGET: Paste anywhere in your HTML, Webflow, WordPress, Next.js, or React app -->
<script
  src="${hostUrl}/widget.js"
  data-bot-id="${botId}"
  data-title="${botTitle || "ZeroRoute AI"}"
  data-greeting="${greeting || "Hi! 👋 How can I help you today?"}"
  data-prompts="${cleanPrompts}"
  data-color="${brandColor}"
  defer>
</script>`,

    ai: `Please embed the ZeroRoute AI customer support chatbot into this project's website / web app.

Instructions:
1. Locate the main HTML layout / index / root layout (e.g. \`index.html\`, \`app/layout.tsx\`, \`pages/_app.tsx\`, \`theme.liquid\`, or root HTML template).
2. Insert the following lightweight script tag right before the closing \`</body>\` tag:

\`\`\`html
<!-- 1-LINE CHATBOT WIDGET: Paste anywhere in your HTML, Webflow, WordPress, Next.js, or React app -->
<script
  src="${hostUrl}/widget.js"
  data-bot-id="${botId}"
  data-title="${botTitle || "ZeroRoute AI"}"
  data-greeting="${greeting || "Hi! 👋 How can I help you today?"}"
  data-prompts="${cleanPrompts}"
  data-color="${brandColor}"
  defer>
</script>
\`\`\`

3. Verify that the floating chatbot bubble appears in the bottom right corner of the page. No external npm packages or build step changes are required.`,

    js: `// React / Next.js Component Embed (using next/script)
import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}

        {/* ZeroRoute AI Floating Chatbot Widget */}
        <Script
          src="${hostUrl}/widget.js"
          data-bot-id="${botId}"
          data-title="${botTitle || "ZeroRoute AI"}"
          data-greeting="${greeting || "Hi! 👋 How can I help you today?"}"
          data-prompts="${cleanPrompts}"
          data-color="${brandColor}"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}`,

    py: `from openai import OpenAI

# ZeroRoute Multi-Cloud AI Gateway (OpenAI SDK Drop-In)
client = OpenAI(
    base_url="${hostUrl}/v1",
    api_key="${effectiveKey}"
)

response = client.chat.completions.create(
    model="default",  # Automatically fails over across 10 free AI cloud providers with <8ms circuit breaker
    messages=[{"role": "user", "content": "Hello ZeroRoute!"}]
)

print(response.choices[0].message.content)`,

    curl: `# Direct cURL Inference with Multi-Cloud Failover
curl ${hostUrl}/v1/chat/completions \\
  -H "Authorization: Bearer ${effectiveKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "default",
    "stream": true,
    "messages": [{"role": "user", "content": "Hello ZeroRoute!"}]
  }'`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeSnippet]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Main Glass Card */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-7 space-y-6 shadow-xl">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dark-border">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-slate-400" />
              <span>Connect Your Website or App</span>
            </h2>
            <p className="text-xs text-slate-400">
              Embed the floating chatbot widget or use ZeroRoute as a drop-in multi-cloud OpenAI API gateway.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setGuideModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer touch-manipulation"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Step-by-Step Guide</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer touch-manipulation"
            >
              {showLivePreview ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              <span>{showLivePreview ? "Hide Preview" : "Live Preview"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-md transition-all active:scale-95 shrink-0 cursor-pointer touch-manipulation"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* Snippet Format Selector Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "widget", label: "✨ 1-Line Website Widget" },
            { id: "ai", label: "🤖 AI Agent Prompt" },
            { id: "js", label: "JavaScript / React" },
            { id: "py", label: "Python (OpenAI SDK)" },
            { id: "curl", label: "cURL Terminal" },
          ].map((tab) => {
            const isSelected = activeSnippet === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSnippet(tab.id as any)}
                className={`px-3.5 py-2 min-h-[44px] text-xs rounded-xl font-semibold transition-all cursor-pointer touch-manipulation flex items-center shrink-0 ${
                  isSelected
                    ? "bg-red-600 text-white font-bold shadow-md shadow-red-600/25"
                    : "bg-[#080a0f] border border-dark-border text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Widget Customizer (Available for Widget, AI Agent, and React tabs) */}
        {(activeSnippet === "widget" || activeSnippet === "ai" || activeSnippet === "js") && (
          <div className="p-5 bg-[#080a10] border border-dark-border rounded-2xl space-y-4 shadow-inner">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-red-400" />
                <span>Customize Live Widget Appearance:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Live Sync</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase">Bot Title</label>
                <input
                  type="text"
                  value={botTitle}
                  onChange={(e) => setBotTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-[#050608] border border-dark-border rounded-xl text-white focus:outline-none focus:border-red-500 font-sans touch-manipulation"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase">Brand Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-10 h-10 p-0.5 bg-[#050608] border border-dark-border rounded-xl cursor-pointer shrink-0 touch-manipulation"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-base sm:text-xs bg-[#050608] border border-dark-border rounded-xl text-white focus:outline-none focus:border-red-500 font-mono touch-manipulation"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase">Welcome Greeting Message</label>
                <input
                  type="text"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-[#050608] border border-dark-border rounded-xl text-white focus:outline-none focus:border-red-500 font-sans touch-manipulation"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold text-slate-400 uppercase">
                  Quick Starter Question Chips (Comma separated)
                </label>
                <input
                  type="text"
                  value={promptChips}
                  onChange={(e) => setPromptChips(e.target.value)}
                  placeholder="What are your services?,Pricing details,How to get started?"
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-[#050608] border border-dark-border rounded-xl text-white focus:outline-none focus:border-red-500 font-sans touch-manipulation"
                />
              </div>
            </div>
          </div>
        )}

        {/* Code View & Optional Live Widget Simulator Grid */}
        <div className={`grid grid-cols-1 ${showLivePreview && (activeSnippet === "widget" || activeSnippet === "ai" || activeSnippet === "js") ? "lg:grid-cols-12 gap-5" : ""}`}>
          {/* Code Box */}
          <div className={showLivePreview && (activeSnippet === "widget" || activeSnippet === "ai" || activeSnippet === "js") ? "lg:col-span-7" : "w-full"}>
            <div className="relative">
              <pre className="p-5 bg-[#080a10] border border-dark-border rounded-2xl text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed shadow-inner max-h-[480px]">
                <code>{snippets[activeSnippet]}</code>
              </pre>
            </div>
          </div>

          {/* Interactive Live Widget Simulator */}
          {showLivePreview && (activeSnippet === "widget" || activeSnippet === "ai" || activeSnippet === "js") && (
            <div className="lg:col-span-5 bg-[#080a10] border border-dark-border rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" style={{ color: brandColor }} />
                  <span>Real-Time Widget Preview</span>
                </span>
                <span
                  className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${brandColor}20`, color: brandColor, border: `1px solid ${brandColor}40` }}
                >
                  Live Theme
                </span>
              </div>

              {/* Mock Chat Window */}
              <div className="bg-[#050608] border border-dark-border rounded-xl overflow-hidden shadow-2xl flex flex-col h-[340px]">
                {/* Header */}
                <div
                  className="p-3 text-white flex items-center justify-between shadow-md"
                  style={{ backgroundColor: brandColor }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                      {botTitle.charAt(0) || "Z"}
                    </div>
                    <div>
                      <div className="font-bold text-xs leading-tight">{botTitle || "ZeroRoute AI"}</div>
                      <div className="text-[9px] text-white/80 font-mono">Online • Active</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>

                {/* Messages Body */}
                <div className="p-3 flex-1 overflow-y-auto space-y-3 text-xs">
                  {/* Bot Greeting Bubble */}
                  <div className="flex items-start gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: brandColor }}
                    >
                      {botTitle.charAt(0) || "Z"}
                    </div>
                    <div className="bg-white/10 border border-white/10 text-slate-200 p-2.5 rounded-2xl rounded-tl-sm text-[11px] leading-relaxed max-w-[85%]">
                      {greeting || "Hi! 👋 How can I help you today?"}
                    </div>
                  </div>

                  {/* Starter Prompts */}
                  {cleanPrompts && (
                    <div className="pt-2 space-y-1.5 pl-7">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider block">Suggested Questions</span>
                      <div className="flex flex-wrap gap-1.5">
                        {cleanPrompts.split(",").map((chip, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded-lg text-[10px] font-medium transition-all"
                            style={{
                              backgroundColor: `${brandColor}15`,
                              color: brandColor,
                              border: `1px solid ${brandColor}30`,
                            }}
                          >
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Bar */}
                <div className="p-2 border-t border-white/10 bg-[#080a10] flex items-center gap-2">
                  <input
                    type="text"
                    disabled
                    placeholder="Ask anything…"
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 outline-none"
                  />
                  <button
                    type="button"
                    disabled
                    className="p-1.5 rounded-lg text-white"
                    style={{ backgroundColor: brandColor }}
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 text-center">
                Updates in real-time as you tweak colors, title, and starter prompts above.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step-by-Step Integration Guide Modal */}
      {guideModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setGuideModalOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-[#0a0d14] border border-dark-border rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 glow-effect animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Step-by-Step Integration Guide</h3>
                  <p className="text-xs text-slate-400">Choose your platform to see exact 60-second setup instructions.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setGuideModalOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer touch-manipulation shrink-0"
                aria-label="Close guide modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none touch-pan-x">
              {[
                { id: "agent", label: "🤖 AI Agent" },
                { id: "html", label: "🌐 HTML / Webflow" },
                { id: "wp", label: "📦 WordPress" },
                { id: "shopify", label: "🛍️ Shopify" },
                { id: "next", label: "⚡ Next.js / React" },
                { id: "sdk", label: "🐍 Python SDK" },
              ].map((p) => {
                const isSelected = guidePlatform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setGuidePlatform(p.id as any)}
                    className={`px-3 py-2 min-h-[44px] text-xs rounded-xl font-semibold transition-all shrink-0 cursor-pointer touch-manipulation flex items-center ${
                      isSelected
                        ? "bg-red-600 text-white font-bold shadow-md shadow-red-600/25"
                        : "bg-[#080a0f] border border-dark-border text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Guide Content Box */}
            <div className="text-xs text-slate-300 leading-relaxed min-h-[180px]">
              {guidePlatform === "agent" && (
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-3">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>🤖 Method 1: Let AI Coding Agents Do It (Easiest)</span>
                  </div>
                  <p className="text-slate-300">
                    If you use <strong>Claude Code, Cursor IDE, Codex, Copilot, or v0</strong>:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                    <li>Click the <strong>"🤖 AI Agent Prompt"</strong> button in the integration tab above.</li>
                    <li>Click <strong>"Copy Code"</strong> to copy the prompt.</li>
                    <li>Open your project in <strong>Cursor / Claude Code</strong> and paste the prompt into chat.</li>
                    <li>Your AI agent will automatically detect your project structure, place the script tag, and configure your keys in 10 seconds!</li>
                  </ol>
                </div>
              )}

              {guidePlatform === "html" && (
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                  <div className="font-bold text-white text-sm">🌐 Standard HTML / Webflow / Framer Setup</div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                    <li>Click <strong>"✨ 1-Line Website Widget"</strong> above and copy the script tag.</li>
                    <li>Open your <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">index.html</code> (or Webflow Project Settings → Custom Code → Footer Code).</li>
                    <li>Paste the script tag directly before the closing <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">&lt;/body&gt;</code> tag.</li>
                    <li>Save and publish your site. The floating chat bubble appears instantly!</li>
                  </ol>
                </div>
              )}

              {guidePlatform === "wp" && (
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                  <div className="font-bold text-white text-sm">📦 WordPress 1-Click Embed</div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                    <li>Copy the <strong>"✨ 1-Line Website Widget"</strong> script tag above.</li>
                    <li>Log into your <strong>WordPress Admin Dashboard</strong>.</li>
                    <li>Go to <strong>Plugins → Add New</strong> and search for <em>"WPCode"</em> or <em>"Insert Headers and Footers"</em> (if not installed).</li>
                    <li>Go to <strong>Code Snippets → Header &amp; Footer</strong>.</li>
                    <li>Paste the script tag into the <strong>Footer</strong> box and click <strong>Save Changes</strong>.</li>
                  </ol>
                </div>
              )}

              {guidePlatform === "shopify" && (
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                  <div className="font-bold text-white text-sm">🛍️ Shopify Store Integration</div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                    <li>Copy the <strong>"✨ 1-Line Website Widget"</strong> script tag above.</li>
                    <li>Log into your <strong>Shopify Admin</strong>.</li>
                    <li>Go to <strong>Online Store → Themes</strong>.</li>
                    <li>Click the <strong>"…"</strong> button next to your active theme and select <strong>Edit code</strong>.</li>
                    <li>Open <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">theme.liquid</code> in the Layout directory.</li>
                    <li>Scroll to the bottom and paste the script right before <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">&lt;/body&gt;</code>.</li>
                    <li>Click <strong>Save</strong>!</li>
                  </ol>
                </div>
              )}

              {guidePlatform === "next" && (
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                  <div className="font-bold text-white text-sm">⚡ Next.js / React (App Router &amp; Pages Router)</div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                    <li>Select <strong>"JavaScript / React"</strong> in the main tab to copy your snippet.</li>
                    <li>Open your root layout file (<code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">app/layout.tsx</code> or <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">pages/_app.tsx</code>).</li>
                    <li>Import <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">Script</code> from <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">'next/script'</code>.</li>
                    <li>Add the <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">&lt;Script strategy="lazyOnload" /&gt;</code> component right before the closing <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">&lt;/body&gt;</code> tag.</li>
                    <li>Deploy or run <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">npm run dev</code> — your chatbot renders seamlessly!</li>
                  </ol>
                </div>
              )}

              {guidePlatform === "sdk" && (
                <div className="p-4 rounded-xl bg-dark-card border border-dark-border space-y-3">
                  <div className="font-bold text-white text-sm">🐍 Python &amp; Backend SDK Integration</div>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300 pl-1">
                    <li>Install the official client: <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">pip install openai</code>.</li>
                    <li>Set <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">base_url="{hostUrl}/v1"</code> and your API key.</li>
                    <li>Set <code className="text-red-400 bg-red-950/40 px-1 py-0.5 rounded font-mono">model="default"</code> to automatically route across 10 multi-cloud AI failover providers.</li>
                    <li>Execute standard OpenAI API calls with zero latency overhead.</li>
                  </ol>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
              <span className="text-[11px] text-slate-400 text-center sm:text-left">
                Need help? Email{" "}
                <a href="mailto:support@mapki.com" className="text-red-400 hover:underline">
                  support@mapki.com
                </a>
              </span>

              <button
                type="button"
                onClick={() => setGuideModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white transition-all cursor-pointer touch-manipulation flex items-center justify-center"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
