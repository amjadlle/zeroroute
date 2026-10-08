"use client";

import Link from "next/link";
import { Zap, MessageSquare, ChevronRight, Sparkles, Check, ShieldCheck } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

interface HeroProps {
  onOpenCheckout: () => void;
}

export function Hero({ onOpenCheckout }: HeroProps) {
  return (
    <section className="text-center pt-4 sm:pt-8 pb-4 space-y-6 sm:space-y-8 max-w-4xl mx-auto px-2">
      {/* Top Announcement Badge */}
      <div>
        <a
          href="https://github.com/amjadlle/zeroroute/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-semibold shadow-sm transition-all hover:scale-105 max-w-full"
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-[10px] font-mono text-red-300 shrink-0">
            {APP_VERSION}
          </span>
          <span className="truncate">⚡ NEW: 1-Line Embeddable AI Assistant • 11 Pooled AI Providers</span>
          <ChevronRight className="w-3 h-3 opacity-70 shrink-0 hidden sm:inline-block" />
        </a>
      </div>

      {/* Clean, Balanced Main Chatbot Headline */}
      <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.18] text-balance max-w-3xl mx-auto">
        Add a Custom AI Chatbot <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
          To Your Website in 1 Minute.
        </span>
      </h1>

      {/* Clean, Non-bloated Subtitle */}
      <p className="text-sm sm:text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed text-balance">
        Embed an intelligent, floating AI customer assistant on WordPress, Shopify, Webflow, Next.js, or any website with <strong className="text-slate-200">1 line of code</strong>. Powered by <strong className="text-white">11 pooled AI providers</strong> with instant URL/doc training, zero hallucinations, and 100% uptime.
      </p>

      {/* Action CTAs with Sleek Radius & High-Converting Visual Hierarchy */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-3.5 pt-1 max-w-md sm:max-w-none mx-auto w-full">
        {/* 1. Primary Live Action: Test Bot */}
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
          className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-b from-[#e5333b] to-[#c71d25] hover:from-[#f03e46] hover:to-[#d6232b] rounded-xl border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_6px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 active:scale-95 cursor-pointer touch-manipulation min-h-[46px]"
        >
          <MessageSquare className="w-4 h-4 fill-white" />
          <span>Test Live Bot (On This Page)</span>
        </button>

        {/* 2. Premium Pro Conversion CTA */}
        <button
          type="button"
          onClick={onOpenCheckout}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-3.5 text-xs sm:text-sm font-extrabold text-zinc-950 bg-gradient-to-b from-[#f59e0b] to-[#d97706] hover:from-[#fbbf24] hover:to-[#b45309] rounded-xl border border-white/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_6px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 active:scale-95 cursor-pointer touch-manipulation min-h-[46px]"
        >
          <Zap className="w-4 h-4 fill-zinc-950 text-zinc-950" />
          <span>Upgrade to Pro ($2.00/mo)</span>
        </button>

        {/* 3. Free Tier Low-Friction Entry */}
        <Link
          href="/login?tab=signup"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold bg-white/[0.07] hover:bg-white/[0.12] text-slate-200 hover:text-white border border-white/15 hover:border-white/25 rounded-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 active:scale-95 cursor-pointer touch-manipulation min-h-[46px]"
        >
          <span>🚀 Get Started Free (500 req)</span>
        </Link>
      </div>

      {/* Trust & Guarantee Micro-Pills with Sleek Rounded-lg Radius */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-[11px] sm:text-xs font-medium pt-1">
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>No Credit Card Required</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-300 font-bold bg-emerald-500/15 border border-emerald-500/35 px-3 py-1 rounded-lg shadow-sm">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Free 1-on-1 Setup &amp; Installation</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="inline-flex items-center gap-1 text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
          <span>⚡ 1-Line Embed</span>
        </span>
        <span className="text-slate-600 hidden sm:inline">•</span>
        <span className="inline-flex items-center gap-1 text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-3 h-3 text-red-400" />
          <span>Zero Hallucinations</span>
        </span>
      </div>

      {/* Quick Metrics Bar */}
      <div className="pt-6 sm:pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto border-t border-dark-border/60">
        <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">1-Line</div>
          <div className="text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">Embed Script</div>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">10,000</div>
          <div className="text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">Monthly Requests</div>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">11</div>
          <div className="text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">Pooled Providers</div>
        </div>
        <div className="p-3.5 sm:p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-red-400 font-mono">&lt;8ms</div>
          <div className="text-[11px] sm:text-xs text-slate-400 mt-1 font-medium">Fallback Latency</div>
        </div>
      </div>
    </section>
  );
}
