"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  ArrowRight,
  Bot,
  Sliders,
  ShieldCheck,
  Code2,
  Terminal,
  Loader2,
  Headphones,
  Calendar,
  Mail,
  ExternalLink,
} from "lucide-react";

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || searchParams.get("id") || "";
  const paymentId = searchParams.get("payment_id") || "";
  const subscriptionId = searchParams.get("subscription_id") || "";
  const emailParam = searchParams.get("email") || "";
  const statusParam = searchParams.get("status") || "";

  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<{
    name: string;
    email: string;
    company: string;
    key: string;
    bot_id: string;
    status: string;
  } | null>(null);

  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ef4444", "#f43f5e", "#fb7185", "#10b981", "#3b82f6", "#ffffff"],
      });

      const timer = setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#ef4444", "#10b981", "#ffffff"],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#ef4444", "#10b981", "#ffffff"],
        });
      }, 400);

      return () => clearTimeout(timer);
    } catch {}
  }, []);

  useEffect(() => {
    async function loadCustomer() {
      setLoading(true);

      // 1. If any checkout redirect params exist (subscription_id, session_id, payment_id, email), verify
      const queryString = searchParams.toString();
      if (sessionId || subscriptionId || paymentId || emailParam || statusParam) {
        try {
          const res = await fetch(`/api/checkout/session?${queryString}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setCustomer({
                name: data.name || "Valued Subscriber",
                email: data.email || emailParam,
                company: data.company || "My Application",
                key: data.key,
                bot_id: data.botId,
                status: "active",
              });
              setLoading(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Session verification fallback:", e);
        }
      }

      // 2. Fallback to existing logged-in session profile
      try {
        const profileRes = await fetch("/api/customer/profile");
        if (profileRes.ok) {
          const pData = await profileRes.json();
          if (pData.customer) {
            setCustomer({
              name: pData.customer.name || "Valued Subscriber",
              email: pData.customer.email || "",
              company: pData.customer.company || "My Project",
              key: pData.customer.key,
              bot_id: pData.customer.bot_id,
              status: pData.customer.status || "active",
            });
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("Profile fetch fallback:", e);
      }

      // 3. If neither checkout redirect nor session exists:
      setCustomer(null);
      setLoading(false);
    }

    loadCustomer();
  }, [searchParams, sessionId, subscriptionId, paymentId, emailParam, statusParam]);

  const activeKey = customer?.key || "";
  const activeBotId = customer?.bot_id || "";
  const activeEmail = customer?.email || emailParam || "";
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://zeroroute.mapki.in";
  const widgetSnippet = activeBotId ? `<script src="${siteUrl}/widget.js" data-bot-id="${activeBotId}"></script>` : "";

  const onboardingHref = activeKey
    ? `/onboarding?key=${encodeURIComponent(activeKey)}&bot_id=${encodeURIComponent(activeBotId)}&email=${encodeURIComponent(activeEmail)}`
    : "/onboarding";

  const consoleHref = activeKey ? `/app?key=${encodeURIComponent(activeKey)}` : "/app";

  const copyKey = () => {
    navigator.clipboard.writeText(activeKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyScript = () => {
    navigator.clipboard.writeText(widgetSnippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="ZeroRoute"
              width={30}
              height={30}
              className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  ZeroRoute
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                  Cloud Pro
                </span>
              </div>
              <div className="text-[7px] sm:text-[8px] font-mono tracking-widest text-slate-500 uppercase">
                ZERO COST. MAX ROUTE.
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={consoleHref}
              className="px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-1.5 touch-manipulation"
            >
              <span>Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 w-full space-y-8">
        {loading ? (
          <div className="bg-dark-card border border-dark-border rounded-2xl p-10 sm:p-14 shadow-2xl text-center space-y-4 max-w-xl mx-auto flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Activating Your Gateway…</h3>
              <p className="text-xs text-slate-400">Verifying session credentials and provisioning Cloudflare D1 keys.</p>
            </div>
          </div>
        ) : !customer ? (
          /* Empty / Unauthenticated Direct Visit View */
          <div className="bg-dark-card border border-dark-border rounded-2xl p-8 sm:p-12 shadow-2xl text-center space-y-6 max-w-xl mx-auto animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                No Active Checkout Session
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                This page is automatically presented to customers upon completing checkout. If you already have an account, please log in to access your credentials and console.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/#pricing"
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 flex items-center justify-center touch-manipulation"
              >
                View Plans &amp; Pricing
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 py-3 min-h-[44px] rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all flex items-center justify-center touch-manipulation"
              >
                Log In to Account
              </Link>
            </div>
          </div>
        ) : (
          /* Active / Newly Subscribed Celebration View */
          <>
            {/* Celebration Banner */}
            <div className="text-center space-y-3 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Payment Confirmed • Account Activated</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Welcome to <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-400 to-amber-300">ZeroRoute Pro</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
                Your high-availability multi-cloud AI gateway is ready. Below are your live credentials and next steps.
              </p>
            </div>

            {/* Credentials & Access Summary Card */}
            <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 glow-effect">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Subscription Plan
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-bold text-white">ZeroRoute Pro Managed</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#080a0f] px-3.5 py-2 rounded-xl border border-dark-border">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>2,000 req/mo • 10 Cloud Failover</span>
            </div>
          </div>

          {/* Master API Key Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-red-400" />
                <span>Your Master AI Router Key</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-2.5 min-w-[44px] min-h-[44px] text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1 cursor-pointer touch-manipulation"
                  aria-label="Toggle key visibility"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showKey ? "Hide" : "Show"}</span>
                </button>
                <button
                  type="button"
                  onClick={copyKey}
                  className="text-red-400 hover:text-red-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer bg-red-500/10 px-3.5 py-2 min-h-[44px] rounded-xl border border-red-500/20 touch-manipulation"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
                </button>
              </div>
            </div>

            <div className="font-mono text-xs sm:text-sm text-slate-200 bg-[#080a0f] p-3.5 rounded-xl border border-dark-border break-all select-all flex items-center justify-between">
              {showKey ? activeKey : activeKey.slice(0, 10) + "••••••••••••••••••••••••" + activeKey.slice(-4)}
            </div>
            <p className="text-[11px] text-slate-500">
              Compatible with standard OpenAI SDKs: Point <code className="text-slate-400">baseURL</code> to <code className="text-slate-300">{siteUrl}/v1</code>.
            </p>
          </div>

          {/* 1-Line Embed Code Box */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>1-Line Website Chatbot Widget Embed</span>
              </label>
              <button
                type="button"
                onClick={copyScript}
                className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center gap-1.5 cursor-pointer bg-emerald-500/10 px-3.5 py-2 min-h-[44px] rounded-xl border border-emerald-500/20 touch-manipulation"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? "Copied!" : "Copy Embed HTML"}</span>
              </button>
            </div>

            <div className="font-mono text-[11px] text-emerald-400 bg-[#080a0f] p-3.5 rounded-xl border border-dark-border break-all select-all leading-relaxed">
              {widgetSnippet}
            </div>
          </div>
        </div>

        {/* Free Concierge Setup & Support Banner */}
        <div className="p-5 sm:p-6 bg-[#0b0e14] border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.08] via-teal-500/[0.04] to-cyan-500/[0.02] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Headphones className="w-4 h-4" />
              </div>
              <span className="text-sm sm:text-base font-bold text-white">Need Help Setting Up? We'll Do It For Free!</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                100% Free Concierge
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Stuck or not sure how to embed the widget into WordPress, Webflow, Shopify, or custom code? 
              Book a quick 1-on-1 call with our founding team or email us — we will configure and test your AI bot for free.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            <a
              href={`mailto:mapkisolutions@gmail.com?subject=${encodeURIComponent("ZeroRoute Pro Free Setup Assistance")}&body=${encodeURIComponent(`Hi ZeroRoute Team,\n\nI just upgraded to ZeroRoute Pro and would love help setting up my chatbot.\n\nMy Website URL:\nMy Bot ID: ${activeBotId}\n\nThank you!`)}`}
              className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:border-emerald-500/40 cursor-pointer touch-manipulation"
            >
              <Mail className="w-3.5 h-3.5 text-emerald-400" />
              <span>Email Support</span>
            </a>

            <a
              href="https://cal.com/mapki/zeroroute-setup"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer touch-manipulation"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book a Free Call</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Dual Next-Steps Action Path */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2">
          {/* Action 1: Onboarding Wizard */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-red-500/20 hover:border-red-500/40 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Launch Setup Wizard (Recommended)
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customize your assistant’s brand identity, tune the AI prompt persona, crawl your website docs for RAG, and set your account password.
              </p>
            </div>

            <Link
              href={onboardingHref}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 touch-manipulation"
            >
              <span>Start Onboarding Wizard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Action 2: Direct to Console Dashboard */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.01] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Go Straight to Subscriber Console
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Direct access to your live telemetry dashboard, quota usage, model playground, domain whitelisting, and billing portal.
              </p>
            </div>

            <Link
              href={consoleHref}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all active:scale-95 touch-manipulation"
            >
              <span>Open Console Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        </>
        )}
      </main>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050608] flex items-center justify-center text-slate-400 text-xs">
          Loading welcome page…
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
