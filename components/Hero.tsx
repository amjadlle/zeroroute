"use client";

import Link from "next/link";
import { Zap, SlidersHorizontal, MessageSquare, ChevronRight } from "lucide-react";

interface HeroProps {
  onOpenCheckout: () => void;
}

export function Hero({ onOpenCheckout }: HeroProps) {
  return (
    <section className="text-center pt-6 sm:pt-10 pb-6 space-y-8 max-w-4xl mx-auto">
      {/* Top Announcement Badge */}
      <div>
        <a
          href="https://github.com/amjadlle/zeroroute/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-semibold shadow-sm transition-all hover:scale-105"
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-[10px] font-mono text-red-300">
            v1.0.0
          </span>
          <span>⚡ Multi-Cloud AI Gateway with Instant Failover</span>
          <ChevronRight className="w-3 h-3 opacity-70" />
        </a>
      </div>

      {/* Clean, Snappy Main Headline */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.12]">
        Never Pay for LLMs Again. <br />
        <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
          One Endpoint. 100 Fast Models.
        </span>
      </h1>

      {/* Spacious, Punchy Subtitle */}
      <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Zero downtime AI routing across <strong className="text-slate-200">9 multi-cloud providers</strong> — Gemini, Groq, Cloudflare, Mistral, SambaNova, Cohere &amp; more. Auto-fails over in &lt;8ms with custom RAG knowledge and a <strong className="text-slate-200">1-line website AI chatbot</strong>.
      </p>

      {/* Clean Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 pt-2 max-w-md sm:max-w-none mx-auto w-full">
        {/* Primary CTA */}
        <button
          type="button"
          onClick={onOpenCheckout}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl transition-all shadow-xl shadow-red-500/20 active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>Start 3-Day Free Trial ($3.99/mo)</span>
        </button>

        {/* Console Link */}
        <Link
          href="/app"
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all active:scale-95 touch-manipulation min-h-[44px]"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span>Open Console</span>
        </Link>

        {/* Live Chatbot Demo Trigger */}
        <a
          href="#widget"
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl transition-all active:scale-95 cursor-pointer touch-manipulation min-h-[44px]"
        >
          <MessageSquare className="w-4 h-4 text-red-400" />
          <span>Test Chatbot Demo</span>
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs text-slate-400 font-medium pt-1">
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>3-Day Free Trial Included</span>
        </span>
        <span className="text-slate-600">•</span>
        <span>Instant Setup in 30s</span>
        <span className="text-slate-600">•</span>
        <span>Cancel Anytime</span>
      </div>

      {/* Quick Metrics Bar */}
      <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-dark-border/60">
        <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">$0</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Self-Hosted Cost</div>
        </div>
        <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">&lt;8ms</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Failover Speed</div>
        </div>
        <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-red-400 font-mono">100</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Fast Models</div>
        </div>
        <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">9</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Cloud Providers</div>
        </div>
      </div>
    </section>
  );
}
