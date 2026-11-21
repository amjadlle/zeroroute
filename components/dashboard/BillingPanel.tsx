import { CreditCard, ExternalLink, Mail } from "lucide-react";

interface BillingPanelProps {
  isPro: boolean;
  monthlyRequests?: number;
  monthlyLimit: number;
  email?: string;
}

/** Current plan, usage and the upgrade / billing-help action. Shown on /app/billing. */
export function BillingPanel({ isPro, monthlyRequests = 0, monthlyLimit, email }: BillingPanelProps) {
  return (
    <div className="w-full max-w-md bg-[#0a0d14] border border-dark-border rounded-2xl p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-500/25">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Plan &amp; Billing</h3>
            <p className="text-[11px] text-slate-400 font-mono">{email || "Subscriber Account"}</p>
          </div>
        </div>

      </div>

      {/* Current Plan Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Current Plan
            </span>
            <span className="text-base font-extrabold text-white">
              {isPro ? "ZeroRoute Pro" : "ZeroRoute Free"}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{isPro ? "Active Pro" : "Free Forever"}</span>
          </span>
        </div>

        <div className="flex items-baseline gap-1.5 pt-0.5">
          <span className="text-2xl font-extrabold text-white font-mono">
            {isPro ? "$2.00" : "$0"}
          </span>
          <span className="text-xs text-slate-400">/ month</span>
        </div>

        <div className="p-3.5 rounded-xl bg-[#050608] border border-dark-border space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Monthly Usage:</span>
            <strong className="text-emerald-400 font-mono font-bold">
              {monthlyRequests.toLocaleString()} / {monthlyLimit.toLocaleString()} reqs
            </strong>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, (monthlyRequests / (monthlyLimit || 1)) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-1">
        {isPro ? (
          <div className="space-y-3">
            <a
              href={`mailto:mapkisolutions@gmail.com?subject=${encodeURIComponent("ZeroRoute Pro Subscription & Billing Assistance")}&body=${encodeURIComponent(`Hi ZeroRoute Team,\n\nI need assistance with my ZeroRoute Pro subscription (invoices, billing update, or plan changes).\n\nAccount Email: ${email || ""}\nDetails:\n\nThank you!`)}`}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/15 active:scale-95 transition-all cursor-pointer touch-manipulation"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact Billing Support</span>
            </a>
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Need to update billing, request custom invoices, or adjust your subscription? Contact us at <a href="mailto:mapkisolutions@gmail.com" className="text-white hover:underline font-mono">mapkisolutions@gmail.com</a>.
            </p>
          </div>
        ) : (
          <a
            href="/api/checkout"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-b from-[#e5333b] to-[#c71d25] hover:from-[#f03e46] hover:to-[#d6232b] text-white border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_6px_rgba(0,0,0,0.4)] active:scale-95 transition-all cursor-pointer touch-manipulation"
          >
            <span>⚡ Upgrade to Pro ($2.00 / month)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
