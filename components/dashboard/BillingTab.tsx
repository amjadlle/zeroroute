"use client";

import { useEffect } from "react";
import { X, CreditCard, ExternalLink, CheckCircle2 } from "lucide-react";

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysRemaining: number;
  monthlyRequests?: number;
  monthlyLimit?: number;
  email?: string;
}

export function BillingModal({
  isOpen,
  onClose,
  daysRemaining,
  monthlyRequests = 0,
  monthlyLimit = 10000,
  email,
}: BillingModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#0a0d14] border border-dark-border rounded-2xl p-6 shadow-2xl space-y-5 glow-effect animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Plan</h3>
              <p className="text-[11px] text-slate-400 font-mono">{email || "Subscriber Account"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
            aria-label="Close plan modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Plan Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Plan
              </span>
              <span className="text-base font-extrabold text-white">ZeroRoute Cloud Pro</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active Pro Trial</span>
            </span>
          </div>

          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="text-2xl font-extrabold text-white font-mono">$3.99</span>
            <span className="text-xs text-slate-400">/ month</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#050608] border border-dark-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Trial Period:</span>
              <strong className="text-emerald-400 font-mono font-bold">{daysRemaining} Days Remaining</strong>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, (daysRemaining / 30) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action CTA */}
        <div className="pt-1">
          <a
            href="https://test.checkout.dodopayments.com/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all cursor-pointer touch-manipulation"
          >
            <span>Manage Subscription</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

