"use client";

import { Check, X, Headphones, Calendar, Mail, ExternalLink, Sparkles } from "lucide-react";

interface PricingProps {
  onOpenCheckout: () => void;
}

export function Pricing({ onOpenCheckout }: PricingProps) {
  return (
    <section id="pricing" className="space-y-10 scroll-mt-20 max-w-7xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
          <span>⚡ Simple, Transparent Options</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Self-Host Free or Go Hosted
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Choose 100% free DIY self-hosting or let us manage the 11-cloud key pools, high-speed routing, and 99.9% uptime for less than a cup of coffee.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Left Column: Stacked Free Options (Free Hosted on top, DIY Self-Hosted below) */}
        <div className="lg:col-span-6 flex flex-col gap-6 justify-between">
          {/* 1. Free Hosted Plan */}
          <div className="flex-1 relative flex flex-col justify-between p-6 sm:p-7 bg-dark-card/90 border border-dark-border rounded-3xl backdrop-blur-xl shadow-xl space-y-5">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Starter Cloud
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">Free Hosted</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  $0 FOREVER
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                Perfect for testing, personal projects, and launching your first embeddable AI website assistant.
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                $0 <span className="text-xs sm:text-sm font-normal text-slate-400 font-sans">/ month (No card needed)</span>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 pt-3 border-t border-dark-border">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>500 Monthly AI Requests</strong> (Free forever)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>1 Whitelisted Website Domain</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>11-Cloud Multi-Cloud Gateway</strong> (Zero setup)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Embeddable 1-Line Chat Widget</strong> &amp; Knowledge Base</span>
                </li>
                <li className="flex items-center gap-2.5 text-slate-400">
                  <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded text-slate-400">Badge</span>
                  <span>Includes subtle &quot;Powered by ZeroRoute&quot; footer</span>
                </li>
              </ul>
            </div>

            <a
              href="/login?tab=signup"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 transition-all active:scale-95 shadow-md min-h-[42px] touch-manipulation cursor-pointer"
            >
              <span>🚀 Get Started Free (No Card Needed)</span>
            </a>
          </div>

          {/* 2. DIY Self-Hosted Plan */}
          <div className="flex-1 relative flex flex-col justify-between p-6 sm:p-7 bg-dark-card/90 border border-dark-border rounded-3xl backdrop-blur-xl shadow-xl space-y-5">
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Open-Source
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">DIY Self-Hosted</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  100% FREE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                For tinkerers and developers who want complete control and full source code on their own infrastructure.
              </p>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                $0 <span className="text-xs sm:text-sm font-normal text-slate-400 font-sans">/ forever</span>
              </div>

              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300 pt-3 border-t border-dark-border">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full TypeScript source code (MIT License)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Deploy to Cloudflare Workers / Docker / VPS</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Bring your own 11 provider API keys (BYOK)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited requests on your own infrastructure</span>
                </li>
              </ul>
            </div>

            <a
              href="https://github.com/amjadlle/zeroroute"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 transition-all active:scale-95 shadow-md min-h-[42px] touch-manipulation cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub Repo (Free)</span>
            </a>
          </div>
        </div>

        {/* Right Column: Standalone Featured ZeroRoute Pro Plan */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="relative flex flex-col justify-between flex-1 p-6 sm:p-8 bg-gradient-to-b from-[#1c080a] via-[#130507] to-[#070203] border-2 border-red-500/80 rounded-3xl shadow-2xl shadow-red-500/25 ring-1 ring-red-400/40 space-y-6">
            {/* Popular Ribbon */}
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white shadow-lg shadow-red-500/40 border border-red-300/30 flex items-center gap-1 z-20">
              <span>★ Most Popular • White-Label</span>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-400 font-mono">
                    Pro Cloud
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 bg-gradient-to-r from-white via-rose-100 to-red-200 bg-clip-text text-transparent">
                    ZeroRoute Pro
                  </h3>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300">
                For businesses and developers wanting 100% white-label branding, high traffic volume, and multi-domain support.
              </p>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono pt-1 flex items-baseline gap-1.5">
                <span className="bg-gradient-to-r from-rose-200 to-white bg-clip-text text-transparent">$2.00</span>
                <span className="text-sm font-normal text-rose-300/70 font-sans">
                  / month
                </span>
              </div>
              <div className="text-[11px] text-rose-300/70 font-mono -mt-1">
                Apple Pay, Google Pay, Cards &amp; UPI Supported
              </div>

              {/* Prominent White-Glove Setup Highlight Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-emerald-950/30 border border-emerald-500/35 shadow-lg shadow-emerald-950/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-wide">
                      Free 1-on-1 Setup &amp; Installation
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-400 text-black">
                    $150 Value • FREE
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-normal leading-relaxed">
                  We install &amp; test it on your live website for free. Our team personally embeds the 1-line script, fine-tunes your knowledge base, and tests it with you.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-[11px] text-emerald-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WordPress / Shopify / React / Custom</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Zero technical effort needed</span>
                  </span>
                </div>
              </div>

              {/* Pro Feature Checklist */}
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-200 pt-2 border-t border-red-500/20">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>10,000 Monthly AI Requests</strong> (~330 req/day)
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="text-[10px] font-mono font-bold bg-red-500/25 text-red-300 border border-red-400/30 px-2 py-0.5 rounded-full shrink-0">
                    PRO
                  </span>
                  <span>
                    <strong>100% White-Label</strong> (Removes ZeroRoute badge)
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>Up to 3 Whitelisted Domains</strong> (Anti-hijack security)
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>11 Clouds Pooled &amp; Managed</strong> for 99.9% uptime
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>Knowledge Base &amp; Semantic RAG</strong> (Docs &amp; FAQs)
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>Custom AI Brand Persona</strong> &amp; Tone customizer
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>Private Visitor Chat Logs</strong> &amp; Question History
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    <strong>Sub-8ms High Speed Routing</strong> with automatic failover
                  </span>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5 pt-2 relative z-10">
              <button
                type="button"
                onClick={onOpenCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-xl shadow-red-600/35 border border-red-400/30 transition-all active:scale-95 cursor-pointer min-h-[46px] touch-manipulation"
              >
                <span>⚡ Upgrade to Pro ($2.00 / month)</span>
              </button>
              <div className="flex items-center justify-center gap-3 text-[11px] text-rose-300/60 font-mono">
                <span>Instant automated activation</span>
                <span>•</span>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free Setup & Call Booking Banner */}
      <div className="p-6 sm:p-7 bg-[#0b0e14] border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.08] via-teal-500/[0.04] to-cyan-500/[0.02] rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Headphones className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Need Help Setting Up? We&apos;ll Do It For You — 100% Free!
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Zero Extra Charge
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Not sure how to add the script to WordPress, Shopify, Webflow, or custom code? 
            Book a quick 15-minute 1-on-1 call with our founding team or email us — we will personally embed, train, and test your chatbot on your live website for free.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 relative z-10">
          <a
            href="mailto:mapkisolutions@gmail.com?subject=ZeroRoute%20Free%20Setup%20Assistance"
            className="flex-1 sm:flex-initial px-4 py-3 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:border-emerald-500/40 cursor-pointer touch-manipulation"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>Email Setup Help</span>
          </a>

          <a
            href="https://cal.com/mapki/zeroroute-setup"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-initial px-5 py-3 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer touch-manipulation"
          >
            <Calendar className="w-4 h-4" />
            <span>Book a Free 1-on-1 Call</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </a>
        </div>
      </div>
    </section>
  );
}
