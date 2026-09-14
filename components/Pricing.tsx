"use client";

import { Check, X } from "lucide-react";

interface PricingProps {
  onOpenCheckout: () => void;
}

export function Pricing({ onOpenCheckout }: PricingProps) {
  return (
    <section id="pricing" className="space-y-10 scroll-mt-20 max-w-5xl mx-auto">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
          <span>⚡ Simple, Transparent Options</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Self-Host Free or Go Hosted
        </h2>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
          Choose 100% free DIY self-hosting or let us manage the 10-cloud key pools, failover, and uptime for less than a cup of coffee.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* Self-Hosted DIY Plan */}
        <div className="relative flex flex-col justify-between p-6 sm:p-8 bg-dark-card/90 border border-dark-border rounded-3xl backdrop-blur-xl shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Open-Source
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">DIY Self-Hosted</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                100% FREE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              For tinkerers and engineers who want full control and don&apos;t mind managing 10 provider API accounts.
            </p>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono pt-2">
              $0 <span className="text-sm font-normal text-slate-400 font-sans">/ forever</span>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-300 pt-4 border-t border-dark-border">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Full TypeScript source code (MIT License)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Deploy to your own Vercel / Docker / VPS</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bring your own 10 API keys (BYOK)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>In-memory caching &amp; rate limiting</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-500">
                <X className="w-4 h-4 text-slate-600 shrink-0" />
                <span>Requires manual setup of 10 cloud accounts</span>
              </li>
            </ul>
          </div>

          <a
            href="https://github.com/amjadlle/zeroroute"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/10 transition-all active:scale-95 shadow-md"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Clone Repository &amp; Deploy Free</span>
          </a>
        </div>

        {/* Managed ZeroRoute Cloud Plan */}
        <div className="relative flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-b from-[#17111b] via-[#100d16] to-[#0a080f] border-2 border-red-500/50 rounded-3xl shadow-2xl shadow-red-500/10 space-y-6 glow-effect">
          {/* Popular Ribbon */}
          <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30">
            ★ Most Popular • Zero Hassle
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Managed Cloud
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">ZeroRoute Cloud</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Instant 1-key setup. We manage the 10-cloud key pools, failover rotation, and 99.9% uptime for your apps.
            </p>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono pt-2">
              $3.99{" "}
              <span className="text-sm font-normal text-slate-400 font-sans">
                / month{" "}
                <span className="text-xs text-emerald-400 font-mono">(3-Day Free Trial)</span>
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono -mt-1">
              ≈ ₹330/mo • Apple Pay, Google Pay, Cards &amp; UPI
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-200 pt-4 border-t border-white/10">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Instant 1-Key Access</strong> (Zero setup or API keys needed)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>10 Clouds Pooled &amp; Managed</strong> for 99.9% uptime
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Knowledge Base &amp; Semantic RAG</strong> (Upload docs &amp; FAQs)
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
                  <strong>Hosted 1-Line Chatbot Widget</strong> (Embed anywhere in 30s)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Private Visitor Chat Logs</strong> &amp; Question History
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onOpenCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <span>🚀 Start 3-Day Free Trial ($3.99/mo)</span>
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Cancel anytime. Instant automated activation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
