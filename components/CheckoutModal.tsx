"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Check, ArrowRight, ShieldCheck, CreditCard, Loader2 } from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleStartCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data?.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
    } catch (err) {
      console.warn("Checkout session fallback:", err);
    }
    window.location.href = "/api/checkout";
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-[440px] bg-[#0c0f17] border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 sm:p-7 space-y-5">
          {/* Header & Value Prop */}
          <div className="space-y-2 pr-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Risk-Free 3-Day Trial</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
              Unlock ZeroRoute Cloud
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instant multi-cloud AI failover, embeddable website widget, and custom knowledge RAG ready in 60 seconds.
            </p>
          </div>

          {/* Plan Card / Pricing Anchor */}
          <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 relative overflow-hidden space-y-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-sm font-bold text-white block">ZeroRoute Pro</span>
                <span className="text-[11px] text-slate-400">All-in-one Managed Suite</span>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-2xl font-black text-white font-mono">$3.99</span>
                  <span className="text-xs text-slate-400">/mo</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 block">
                  3 Days Free • ≈ ₹330/mo
                </span>
              </div>
            </div>

            {/* Feature Bullets */}
            <ul className="space-y-2.5 pt-3 border-t border-white/10 text-xs text-slate-300">
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>10,000 Monthly AI Requests</strong> (~330 chats/day included)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>11 Cloud Failover</strong> (Gemini, Groq, Cloudflare &amp; more)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>1-Line Chatbot Widget</strong> with custom RAG knowledge
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  <strong>Unlimited API Keys</strong> &amp; real-time latency analytics
                </span>
              </li>
            </ul>
          </div>

          {/* CTA Action Area */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleStartCheckout}
              disabled={loading}
              className="group w-full flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-600/30 hover:shadow-red-500/50 hover:scale-[1.01] active:scale-[0.98] transition-all cursor-pointer disabled:brightness-95 disabled:cursor-wait drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white font-bold">Preparing Checkout…</span>
                </>
              ) : (
                <>
                  <span className="text-white font-bold">Start Free Trial • $0 Due Today</span>
                  <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {/* Trust Badges & Guarantees */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-400 text-center">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" />
                <span>Encrypted Checkout</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Cards, Apple Pay, UPI</span>
              </span>
              <span className="text-slate-600">•</span>
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
