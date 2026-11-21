import { Calendar, ExternalLink, Headphones, Mail } from "lucide-react";

export const SUPPORT_EMAIL = "mapkisolutions@gmail.com";
export const SETUP_CALL_URL = "https://cal.com/mapki/zeroroute-setup";

type SupportBannerProps = {
  /** mailto: link for the email button; pass one with a prefilled subject/body (e.g. the bot ID) from the console. */
  emailHref?: string;
};

/**
 * "Free setup help" banner: email or book a call. Styled with the landing tokens (the landing pricing section).
 * app/welcome/page.tsx still has its own copy of these links; move it here when that page is migrated.
 */
export function SupportBanner({
  emailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("ZeroRoute Free Setup Assistance")}`,
}: SupportBannerProps) {
  return (
    <div className="p-6 sm:p-7 bg-landing-panel border border-emerald-500/25 bg-gradient-to-r from-emerald-500/[0.08] via-teal-500/[0.04] to-cyan-500/[0.02] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
      <div className="space-y-2 relative z-10 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Headphones className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            Need Help Setting Up? We&apos;ll Do It For You — 100% Free!
          </h3>
          <span className="px-2.5 py-0.5 rounded-lg text-landing-2xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
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
          href={emailHref}
          className="flex-1 sm:flex-initial px-4 py-3 min-h-11 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-white/25 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all active:translate-y-0 cursor-pointer touch-manipulation"
        >
          <Mail className="w-4 h-4 text-emerald-400" />
          <span>Email Setup Help</span>
        </a>

        <a
          href={SETUP_CALL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-initial px-5 py-3 min-h-11 rounded-xl bg-gradient-to-b from-landing-mint-from to-landing-mint-to hover:from-landing-mint-hover-from hover:to-landing-mint-hover-to text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-white/30 shadow-landing-bevel hover:-translate-y-0.5 transition-all active:translate-y-0 active:scale-95 cursor-pointer touch-manipulation"
        >
          <Calendar className="w-4 h-4" />
          <span>Book a Free 1-on-1 Call</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-75" />
        </a>
      </div>
    </div>
  );
}
