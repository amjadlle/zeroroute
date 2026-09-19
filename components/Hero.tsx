"use client";

import Link from "next/link";
import { Zap, SlidersHorizontal, MessageSquare, ChevronRight } from "lucide-react";
import { APP_VERSION } from "@/lib/version";

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
            {APP_VERSION}
          </span>
          <span>⚡ NEW: 10,000 Monthly Requests Included • 11 AI Clouds</span>
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
        Zero downtime AI routing across <strong className="text-slate-200">11 multi-cloud providers</strong> — Gemini, Groq, Cloudflare, Mistral, SambaNova, Cohere &amp; more. Includes <strong className="text-white">10,000 requests/month</strong>, custom RAG knowledge base, and a <strong className="text-slate-200">1-line website AI chatbot</strong>.
      </p>

      {/* Clean Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5 sm:gap-4 pt-2 max-w-md sm:max-w-none mx-auto w-full">
        {/* Primary Pro Upgrade CTA in Signature Red */}
        <button
          type="button"
          onClick={onOpenCheckout}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl transition-all shadow-xl shadow-red-500/30 active:scale-95 cursor-pointer touch-manipulation min-h-[46px]"
        >
          <Zap className="w-4 h-4 fill-white" />
          <span>⚡ Upgrade to Pro ($2.00/mo)</span>
        </button>

        {/* Free Plan CTA */}
        <Link
          href="/login?tab=signup"
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-xl transition-all active:scale-95 cursor-pointer touch-manipulation min-h-[46px]"
        >
          <span>🚀 Get Started Free (500 req/mo)</span>
        </Link>

        {/* Live Chatbot Demo Trigger */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              const widgetBox = document.getElementById("zr-widget-box");
              const widgetBtn = document.getElementById("zr-widget-btn");
              if (widgetBox && widgetBox.style.display !== "flex") {
                if (widgetBtn) widgetBtn.click();
              } else if (widgetBtn) {
                widgetBtn.click();
              }
              const inputField = document.getElementById("zr-input");
              if (inputField) {
                setTimeout(() => inputField.focus(), 100);
              }
            }
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 rounded-xl transition-all active:scale-95 cursor-pointer touch-manipulation min-h-[46px]"
        >
          <MessageSquare className="w-4 h-4 text-red-400" />
          <span>Test Live Bot</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs text-slate-400 font-medium pt-1">
        <span className="inline-flex items-center gap-1.5 text-red-400 font-bold bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 rounded-full shadow-sm">
          <span>Pro Tier: $2.00 / mo (10,000 req)</span>
        </span>
        <span className="text-slate-600">•</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Free Forever (500 req/mo)</span>
        </span>
        <span className="text-slate-600">•</span>
        <span>No Credit Card Required</span>
        <span className="text-slate-600">•</span>
        <span>Cancel Anytime</span>
      </div>

      {/* Quick Metrics Bar */}
      <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-dark-border/60">
        <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">10,000</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Monthly Requests</div>
        </div>
        <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">&lt;8ms</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Routing Speed</div>
        </div>
        <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-red-400 font-mono">100+</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Fast Models</div>
        </div>
        <div className="p-4 rounded-2xl bg-dark-card/60 border border-dark-border text-center shadow-sm">
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">11</div>
          <div className="text-xs text-slate-400 mt-1 font-medium">Cloud Providers</div>
        </div>
      </div>
    </section>
  );
}
