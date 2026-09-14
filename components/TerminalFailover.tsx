"use client";

export function TerminalFailover() {
  return (
    <section className="max-w-4xl mx-auto">
      <div className="rounded-2xl border border-dark-border bg-dark-card shadow-2xl overflow-hidden glow-effect">
        {/* Terminal Header */}
        <div className="px-4 py-3 bg-[#080a0f] border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-xs text-slate-400 font-mono ml-2">
              zeroroute — auto-failover engine
            </span>
          </div>
          <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>circuit breaker active</span>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-6 font-mono text-xs sm:text-sm space-y-3 bg-[#07080c] leading-relaxed text-slate-300 overflow-x-auto">
          <div className="text-slate-500">
            # Sending prompt: &quot;Summarize user feedback and answer inquiry&quot;
          </div>
          <div>
            <span className="text-red-400 font-bold">$ </span>
            <span>curl -N https://zeroroute.mapki.in/v1/chat/completions</span>
          </div>

          <div className="pt-2 text-slate-400 flex items-center gap-2">
            <span className="text-amber-400">▶</span> Attempting primary route:{" "}
            <strong className="text-white">SambaNova (Meta-Llama-3.3-70B-Instruct)</strong>...
          </div>

          <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
            ⚠ HTTP 429: SambaNova rate limit exceeded (Quota exhausted). <br />
            ↳ Auto-isolating SambaNova on 60s cooldown timer.
          </div>

          <div className="text-emerald-400 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">⚡</span> Instant Failover ➔ Switched to{" "}
            <strong className="text-white">Groq (llama-3.3-70b-versatile)</strong> in{" "}
            <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 font-bold">
              4.2ms
            </span>{" "}
            ✓
          </div>

          <div className="p-3 bg-dark-card border border-dark-border rounded-lg text-slate-200">
            <div className="text-[11px] text-slate-500 mb-1">Incoming Stream:</div>
            &quot;Here is the summarized breakdown: 1. User loved the 1-line chatbot setup. 2. Performance was rated 10/10 with sub-100ms response time...&quot;{" "}
            <span className="text-red-400 terminal-cursor" />
          </div>

          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
            <span>
              Latency: <strong className="text-slate-300">98ms</strong>
            </span>
            <span>
              Speed: <strong className="text-emerald-400">220 tokens/sec</strong>
            </span>
            <span>
              Cost: <strong className="text-emerald-400">$0.0000</strong>
            </span>
            <span>
              Cache: <strong className="text-slate-300">SAVED</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
