"use client";

import { Check, X, Headphones, Calendar, Mail, ExternalLink, Sparkles } from "lucide-react";

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
          Choose 100% free DIY self-hosting or let us manage the 11-cloud key pools, high-speed routing, and 99.9% uptime for less than a cup of coffee.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
        {/* Free Forever Plan */}
        <div className="relative flex flex-col justify-between p-6 sm:p-8 bg-dark-card/90 border border-dark-border rounded-3xl backdrop-blur-xl shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Starter Plan
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">Free Forever</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                $0 FOREVER
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Perfect for testing, personal projects, and launching your first embeddable AI website assistant.
            </p>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono pt-2">
              $0 <span className="text-sm font-normal text-slate-400 font-sans">/ month (No credit card needed)</span>
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-300 pt-4 border-t border-dark-border">
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
                <span><strong>Embeddable 1-Line Chat Widget</strong></span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Knowledge Base &amp; FAQ Ingestion</span>
              </li>
              <li className="flex items-center gap-2.5 text-slate-400">
                <span className="text-xs font-mono bg-white/5 px-2 py-0.5 rounded text-slate-400">Badge</span>
                <span>Includes subtle &quot;Powered by ZeroRoute&quot; footer</span>
              </li>
            </ul>
          </div>

          <a
            href="/login?tab=signup"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/15 transition-all active:scale-95 shadow-md min-h-[44px] touch-manipulation cursor-pointer"
          >
            <span>🚀 Get Started Free (No Card Needed)</span>
          </a>
        </div>

        {/* Managed ZeroRoute Pro Plan */}
        <div className="relative flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-b from-[#17111b] via-[#100d16] to-[#0a080f] border-2 border-red-500/50 rounded-3xl shadow-2xl shadow-red-500/10 space-y-6 glow-effect">
          {/* Popular Ribbon */}
          <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg shadow-red-500/30">
            ★ Most Popular • White-Label
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">
                  Pro Cloud
                </span>
                <h3 className="text-2xl font-bold text-white mt-1">ZeroRoute Pro</h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              For businesses and developers wanting 100% white-label branding, high traffic volume, and multi-domain support.
            </p>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono pt-2">
              $2.00{" "}
              <span className="text-sm font-normal text-slate-400 font-sans">
                / month
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono -mt-1">
              Apple Pay, Google Pay, Cards &amp; UPI Supported
            </div>

            <ul className="space-y-3 text-xs sm:text-sm text-slate-200 pt-4 border-t border-white/10">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>10,000 Monthly AI Requests</strong> (~330 req/day)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>100% White-Label</strong> (Removes ZeroRoute badge)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-red-400 shrink-0" />
                <span>
                  <strong>Up to 3 Whitelisted Domains</strong>
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
                  <strong>Private Visitor Chat Logs</strong> &amp; Question History
                </span>
              </li>
              <li className="flex items-center gap-2.5 bg-emerald-500/10 -mx-2 px-2 py-1.5 rounded-xl border border-emerald-500/20 text-emerald-300">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Free 1-on-1 Setup &amp; Installation</strong> (We install &amp; test it on your site for free)
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={onOpenCheckout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-xl shadow-red-500/25 transition-all active:scale-95 cursor-pointer min-h-[44px] touch-manipulation"
            >
              <span>⚡ Upgrade to Pro ($2.00 / month)</span>
            </button>
            <p className="text-[11px] text-center text-slate-500">
              Cancel anytime. Instant automated activation.
            </p>
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
