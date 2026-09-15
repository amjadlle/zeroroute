"use client";

import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  BookOpen,
  Sliders,
  X
} from "lucide-react";

export function AdminIntegrationTab() {
  const [activeFormat, setActiveFormat] = useState<"widget" | "ai" | "js" | "py" | "curl">("widget");
  const [copied, setCopied] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Widget customizer state
  const [botTitle, setBotTitle] = useState("ZeroRoute AI");
  const [accentColor, setAccentColor] = useState("#ef4444");
  const [greeting, setGreeting] = useState("Hi! 👋 How can I help you today?");
  const [starterPrompts, setStarterPrompts] = useState("What are your services?,Pricing details,How to get started?");

  const getSnippetCode = () => {
    switch (activeFormat) {
      case "widget":
        return `<!-- ZeroRoute Floating AI Assistant Widget -->
<script
  src="https://zeroroute.mapki.in/widget.js"
  data-bot-id="bot_YOUR_BOT_ID"
  data-title="${botTitle}"
  data-color="${accentColor}"
  data-greeting="${greeting}"
  data-prompts="${starterPrompts}"
  defer
></script>`;

      case "ai":
        return `// Add to your Cursor rules, Claude Code instructions, or system prompt:
You are an AI assistant powered by ZeroRoute Multi-Cloud Gateway.
When calling language model APIs, use the ZeroRoute OpenAI-compatible endpoint:
- Base URL: https://zeroroute.app/v1
- Auth: Bearer zr_live_YOUR_API_KEY
- Model: "auto" (routes dynamically with zero downtime across 10 global clouds).`;

      case "js":
        return `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://zeroroute.app/v1",
  apiKey: process.env.ZEROROUTE_API_KEY || "zr_live_YOUR_API_KEY",
});

async function main() {
  const completion = await client.chat.completions.create({
    model: "auto", // Automatically falls over across Mistral, Groq, Cohere, Cerebras, etc.
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "Hello ZeroRoute Gateway!" }
    ],
  });

  console.log(completion.choices[0].message.content);
}

main();`;

      case "py":
        return `import os
from openai import OpenAI

client = OpenAI(
    base_url="https://zeroroute.app/v1",
    api_key=os.environ.get("ZEROROUTE_API_KEY", "zr_live_YOUR_API_KEY")
)

response = client.chat.completions.create(
    model="auto",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain zero-downtime AI routing."}
    ]
)

print(response.choices[0].message.content)`;

      case "curl":
        return `curl -X POST https://zeroroute.app/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer zr_live_YOUR_API_KEY" \\
  -d '{
    "model": "auto",
    "messages": [
      {"role": "user", "content": "Ping test via cURL"}
    ]
  }'`;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getSnippetCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#090d16] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-red-500" />
              <span>Connect Your Website or App</span>
            </h2>
            <p className="text-xs text-slate-400">
              Embed the floating chatbot widget or use ZeroRoute as a drop-in multi-cloud OpenAI API gateway.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all active:scale-95 cursor-pointer touch-manipulation flex-1 sm:flex-initial"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Step-by-Step Guide</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-md shadow-red-500/20 transition-all active:scale-95 cursor-pointer touch-manipulation flex-1 sm:flex-initial"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied Code!" : "Copy Code"}</span>
            </button>
          </div>
        </div>

        {/* Format Selector Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFormat("widget")}
            className={`px-3.5 py-2 min-h-[44px] text-xs rounded-xl font-bold transition-all cursor-pointer touch-manipulation flex items-center ${
              activeFormat === "widget"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "bg-black/50 text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            ✨ 1-Line Website Widget
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat("ai")}
            className={`px-3.5 py-2 min-h-[44px] text-xs rounded-xl font-bold transition-all cursor-pointer touch-manipulation flex items-center ${
              activeFormat === "ai"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "bg-black/50 text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            🤖 AI Agent Prompt (Claude / Cursor)
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat("js")}
            className={`px-3.5 py-2 min-h-[44px] text-xs rounded-xl font-bold transition-all cursor-pointer touch-manipulation flex items-center ${
              activeFormat === "js"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "bg-black/50 text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            JavaScript / React
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat("py")}
            className={`px-3.5 py-2 min-h-[44px] text-xs rounded-xl font-bold transition-all cursor-pointer touch-manipulation flex items-center ${
              activeFormat === "py"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "bg-black/50 text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            Python (OpenAI SDK)
          </button>
          <button
            type="button"
            onClick={() => setActiveFormat("curl")}
            className={`px-3.5 py-2 min-h-[44px] text-xs rounded-xl font-bold transition-all cursor-pointer touch-manipulation flex items-center ${
              activeFormat === "curl"
                ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                : "bg-black/50 text-slate-300 hover:text-white border border-white/10"
            }`}
          >
            cURL Terminal
          </button>
        </div>

        {/* Live Widget Customizer Controls (shown when widget is selected) */}
        {activeFormat === "widget" && (
          <div className="p-5 bg-black/40 border border-white/10 rounded-2xl space-y-4">
            <div className="text-xs font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-red-400" />
                <span>Customize Live Widget Appearance:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Updates code below automatically</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Bot Title</label>
                <input
                  type="text"
                  value={botTitle}
                  onChange={(e) => setBotTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Brand Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-11 h-11 p-0.5 bg-black/50 border border-white/10 rounded-xl cursor-pointer shrink-0 touch-manipulation min-w-[44px] min-h-[44px]"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 text-base sm:text-xs bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 font-mono min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Welcome Greeting Message</label>
                <input
                  type="text"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
                  Starter Question Chips (Comma separated)
                </label>
                <input
                  type="text"
                  value={starterPrompts}
                  onChange={(e) => setStarterPrompts(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Code Snippet Box */}
        <pre className="p-5 bg-black/60 border border-white/10 rounded-2xl text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed select-all">
          {getSnippetCode()}
        </pre>
      </div>

      {/* Step-by-Step Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-5 sm:p-8 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-red-500" />
                <span>ZeroRoute Integration Guide</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-2 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center touch-manipulation cursor-pointer"
                aria-label="Close guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <span className="font-bold text-white">Step 1: Get Your API Key</span>
                <p className="text-slate-400">Copy your live API Key (`zr_live_...`) from the Subscribers Directory or welcome page.</p>
              </div>

              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <span className="font-bold text-white">Step 2: Add Script / SDK Client</span>
                <p className="text-slate-400">Paste the 1-line script tag before `&lt;/body&gt;` on your HTML site, or initialize the OpenAI SDK with Base URL `https://zeroroute.app/v1`.</p>
              </div>

              <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-1">
                <span className="font-bold text-white">Step 3: Whitelist Allowed Domains</span>
                <p className="text-slate-400">In the CRM Directory or Onboarding, add your domain (e.g. `example.com`) to enforce CORS origin security.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
