"use client";

import { useState } from "react";
import { Zap, BarChart2, Cpu, X } from "lucide-react";

export function ProviderMarquee() {
  const [modalOpen, setModalOpen] = useState(false);

  const providers = [
    { emoji: "⚡", name: "Groq LPU", latency: "~100ms", color: "emerald", model: "openai/gpt-oss-20b", desc: "Custom LPU silicon inference" },
    { emoji: "🌪️", name: "Mistral AI", latency: "~390ms", color: "emerald", model: "mistral-small-latest", desc: "Ultra-fast European model cluster" },
    { emoji: "🌐", name: "Cloudflare AI", latency: "~700ms", color: "emerald", model: "@cf/meta/llama-3.1-8b", desc: "Global edge GPU network" },
    { emoji: "✨", name: "Google Gemini", latency: "~850ms", color: "amber", model: "gemini-flash-lite-latest", desc: "1M Token massive context window" },
    { emoji: "🧠", name: "Cohere Command", latency: "~650ms", color: "emerald", model: "command-r-plus", desc: "Enterprise reasoning & search" },
    { emoji: "🚀", name: "SambaNova", latency: "~800ms", color: "emerald", model: "gemma-4-31B-it", desc: "Dataflow architecture speed" },
    { emoji: "🏢", name: "NVIDIA NIM", latency: "Enterprise", color: "purple", model: "nemotron-3.5-30b", desc: "DGX Supercomputer microservices" },
    { emoji: "🤗", name: "Hugging Face", latency: "~450ms", color: "emerald", model: "meta-llama/Llama-3.1-8B", desc: "Serverless open-source router" },
    { emoji: "🔀", name: "OpenRouter", latency: "Free Pool", color: "slate", model: "nemotron-3.5-lightning:free", desc: "Community load-balanced endpoint" },
    { emoji: "⚡", name: "BazaarLink AI", latency: "~1.2s", color: "cyan", model: "auto:free-pool", desc: "Distributed backup inference" },
  ];

  const getLatencyBadge = (latency: string, color: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-500/10 text-emerald-400";
      case "amber":
        return "bg-amber-500/10 text-amber-400";
      case "purple":
        return "bg-purple-500/10 text-purple-400";
      case "cyan":
        return "bg-cyan-500/10 text-cyan-400";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <>
      <section id="providers" className="space-y-6 scroll-mt-20 max-w-5xl mx-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Multi-Cloud Failover Pool</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Backed by 10 Ultra-Fast AI Clouds
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Zero single points of failure. If one provider throttles, ZeroRoute fails over in 0ms.
          </p>
        </div>

        {/* Infinite Sliding Logo Marquee Container */}
        <div className="relative overflow-hidden py-4 border-y border-white/[0.06] bg-white/[0.01]">
          {/* Gradient Edge Masks */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-[#050608] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-[#050608] to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee gap-3 items-center">
            {/* First Set */}
            {providers.map((p, i) => (
              <div
                key={`p1-${i}`}
                onClick={() => setModalOpen(true)}
                className="cursor-pointer flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-dark-card/80 border border-dark-border hover:border-red-500/40 hover:bg-dark-cardHover transition-all shrink-0"
              >
                <span className="text-sm">{p.emoji}</span>
                <span className="text-xs font-bold text-white">{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${getLatencyBadge(p.latency, p.color)}`}>
                  {p.latency}
                </span>
              </div>
            ))}

            {/* Duplicate Set for Seamless Loop */}
            {providers.map((p, i) => (
              <div
                key={`p2-${i}`}
                onClick={() => setModalOpen(true)}
                className="cursor-pointer flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-dark-card/80 border border-dark-border hover:border-red-500/40 hover:bg-dark-cardHover transition-all shrink-0"
              >
                <span className="text-sm">{p.emoji}</span>
                <span className="text-xs font-bold text-white">{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${getLatencyBadge(p.latency, p.color)}`}>
                  {p.latency}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5 text-red-400" />
            <span>Inspect All 10 Cloud AI Providers</span>
          </button>
        </div>
      </section>

      {/* Benchmarks Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[#0b0e14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-dark-border flex items-center justify-between bg-dark-card/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">10 Multi-Cloud AI Benchmarks</h3>
                  <p className="text-[11px] text-slate-400">Zero single point of failure • Dynamic multi-cloud failover pool</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto font-sans text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {providers.map((p, i) => (
                  <div
                    key={`modal-${i}`}
                    className="flex items-center justify-between px-4 py-3 bg-dark-card border border-dark-border rounded-xl hover:border-red-500/30 hover:bg-white/[0.03] transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{p.emoji}</span>
                      <span className="font-semibold text-white text-sm">
                        {p.name}
                      </span>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg ${getLatencyBadge(p.latency, p.color)}`}>
                      {p.latency}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-dark-border flex items-center justify-between bg-dark-card/40 text-[11px] text-slate-400">
              <span>All 10 providers auto-rotated in failover engine</span>
              <button
                onClick={() => setModalOpen(false)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
