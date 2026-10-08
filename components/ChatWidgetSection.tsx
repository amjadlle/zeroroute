"use client";

import { useState } from "react";
import { Copy, Check, Sparkles, MessageSquare } from "lucide-react";

export function ChatWidgetSection() {
  const [copied, setCopied] = useState(false);

  const widgetScript = `<script 
  src="https://zeroroute.mapki.in/widget.js" 
  data-title="ZeroRoute AI" 
  data-greeting="Hi! 👋 How can I help you today?" 
  data-prompts="Is it free?,How does it work?,Supported models?" 
  data-persona="You are a friendly portfolio assistant." 
  data-color="#ef4444" 
  defer>
</script>`;

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(widgetScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="widget" className="space-y-8 scroll-mt-20">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
          <span>✨</span> Embed Anywhere in 10 Seconds
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          The 1-Line Website AI Chatbot
        </h2>
        <p className="text-sm text-slate-400">
          Turn your multi-cloud pooled quota into a smart, floating AI assistant on your portfolio, Webflow, WordPress, Next.js, or React site.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
        {/* Left: Code Snippet */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-dark-border">
              <span className="font-mono text-slate-300">index.html (Paste before &lt;/body&gt;)</span>
              <button
                onClick={copyWidgetCode}
                className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className={copied ? "text-emerald-400" : ""}>{copied ? "Copied!" : "Copy Script"}</span>
              </button>
            </div>

            <pre className="font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto p-2 bg-[#080a0f] rounded-lg border border-dark-border">
              <code>{widgetScript}</code>
            </pre>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-dark-card border border-dark-border rounded-xl">
              <div className="text-base font-bold text-white font-mono">~8 KB</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Zero Dependencies</div>
            </div>
            <div className="p-3 bg-dark-card border border-dark-border rounded-xl">
              <div className="text-base font-bold text-emerald-400 font-mono">100%</div>
              <div className="text-[10px] text-slate-400 mt-0.5">XSS Immune</div>
            </div>
            <div className="p-3 bg-dark-card border border-dark-border rounded-xl">
              <div className="text-base font-bold text-red-400 font-mono">&lt;8ms</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Instant Response</div>
            </div>
          </div>
        </div>

        {/* Right: Live Interactive Demo Box */}
        <div className="lg:col-span-5 bg-gradient-to-b from-dark-card to-dark-bg border border-dark-border rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Try the Embedded AI Chatbot</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Test streaming speed, markdown formatting, and intelligent multi-cloud routing directly on this page.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                if ((window as any).ZeroRoute?.open) {
                  (window as any).ZeroRoute.open();
                } else {
                  window.dispatchEvent(new CustomEvent("zeroroute:open"));
                }
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold bg-gradient-to-b from-[#e5333b] to-[#c71d25] hover:from-[#f03e46] hover:to-[#d6232b] text-white rounded-xl border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_6px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-95 cursor-pointer min-h-[44px] touch-manipulation"
          >
            <MessageSquare className="w-4 h-4 fill-white" />
            <span>Open Chatbot Widget</span>
          </button>
        </div>
      </div>
    </section>
  );
}
