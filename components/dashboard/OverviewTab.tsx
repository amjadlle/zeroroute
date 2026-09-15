"use client";

import { useState } from "react";
import { 
  Key, Copy, Check, Eye, EyeOff, RefreshCw, Bot, 
  Mail, Calendar, Headphones, ExternalLink, Sparkles,
  Code2, ArrowRight, Palette
} from "lucide-react";

interface OverviewTabProps {
  apiKey: string;
  botId?: string;
  monthlyRequests: number;
  monthlyLimit: number;
  daysRemaining: number;
  onRotateKey: () => Promise<void>;
  rotatingKey: boolean;
  onNavigateTab?: (tab: "overview" | "widget" | "knowledge" | "persona" | "docs") => void;
}

export function OverviewTab({
  apiKey,
  botId = "bot_live_demo",
  monthlyRequests,
  monthlyLimit,
  daysRemaining,
  onRotateKey,
  rotatingKey,
  onNavigateTab,
}: OverviewTabProps) {
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBotId, setCopiedBotId] = useState(false);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const copyBotId = () => {
    navigator.clipboard.writeText(botId);
    setCopiedBotId(true);
    setTimeout(() => setCopiedBotId(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Primary Credentials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 1. Master Gateway Key Card */}
        <div className="p-6 bg-dark-card border border-dark-border rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Master Gateway Key
                </span>
                <span className="text-[11px] text-slate-400">Bearer token for direct OpenAI API inference</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
                title="Toggle Visibility"
                aria-label="Toggle Visibility"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={copyApiKey}
                className="px-3.5 py-2 min-h-[44px] rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
              </button>
            </div>
          </div>

          <div className="font-mono text-xs text-slate-200 bg-[#080a0f] p-3 rounded-xl border border-dark-border break-all select-all flex items-center justify-between">
            <span>{showKey ? apiKey : `${apiKey.substring(0, 14)}••••••••••••••••••••••••`}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-white/5">
            <span>Pass in <code className="text-slate-400 font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded">Bearer &lt;key&gt;</code></span>
            <button
              type="button"
              disabled={rotatingKey}
              onClick={onRotateKey}
              className="text-slate-400 hover:text-red-400 flex items-center gap-1.5 cursor-pointer transition-colors text-xs font-medium min-h-[44px] px-1 touch-manipulation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${rotatingKey ? "animate-spin text-red-400" : ""}`} />
              <span>Rotate Key</span>
            </button>
          </div>
        </div>

        {/* 2. Public Bot Token / Bot ID Card */}
        <div className="p-6 bg-dark-card border border-dark-border rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Public Bot ID &amp; Token
                </span>
                <span className="text-[11px] text-slate-400">Embed identifier for 1-line website widget</span>
              </div>
            </div>

            <button
              type="button"
              onClick={copyBotId}
              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer touch-manipulation"
            >
              {copiedBotId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBotId ? "Copied!" : "Copy Bot ID"}</span>
            </button>
          </div>

          <div className="font-mono text-xs text-blue-300 bg-[#080a0f] p-3 rounded-xl border border-dark-border break-all select-all flex items-center justify-between">
            <span>{botId}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-white/5">
            <span>Used in <code className="text-slate-400 font-mono text-[10px] bg-white/5 px-1 py-0.5 rounded">data-bot-id="{botId}"</code></span>
            <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Quick Connect & 1-Line Embed Banner */}
      <div className="p-5 bg-gradient-to-r from-red-600/[0.08] via-rose-600/[0.04] to-blue-600/[0.04] border border-red-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-red-400" />
              <span>1-Line Chatbot Embed &amp; API Quickstart</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
              <Palette className="w-2.5 h-2.5" />
              Customizable • HTML / React / WordPress / Shopify
            </span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-2xl">
            Configure brand colors, greeting message, logo, and quick-prompt chips with real-time code generator &amp; platform guides.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab ? onNavigateTab("docs") : undefined}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-md shadow-red-500/10 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
          >
            <span>Open API Quickstart &amp; Customizer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Need Help / Free Setup Concierge Banner */}
      <div className="p-5 bg-[#0b0e14] border border-emerald-500/20 bg-gradient-to-r from-emerald-500/[0.07] via-teal-500/[0.04] to-cyan-500/[0.02] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold text-white">Need Help Setting Up? We'll Do It For Free!</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              100% Free Concierge
            </span>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Stuck or not sure how to embed the widget into WordPress, Webflow, Shopify, or custom code? 
            Contact us and our team will personally configure and test your AI chatbot on your website free of charge.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 relative z-10">
          {/* Email Support */}
          <a
            href={`mailto:mapkisolutions@gmail.com?subject=${encodeURIComponent("ZeroRoute Free Chatbot Setup Assistance")}&body=${encodeURIComponent(`Hi ZeroRoute Team,\n\nI would love your help setting up my AI chatbot.\n\nMy Website URL:\nMy Bot ID: ${botId}\nSpecial requirements / Platform:\n\nThank you!`)}`}
            className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:border-emerald-500/40 cursor-pointer touch-manipulation"
          >
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            <span>Email Support</span>
          </a>

          {/* Book a Call */}
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

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Monthly Usage Quota */}
        <div className="p-6 bg-dark-card border border-dark-border rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Monthly Request Usage
            </span>
            <span className="text-xs font-mono text-slate-400">
              {Math.round((monthlyRequests / (monthlyLimit || 10000)) * 100)}% Used
            </span>
          </div>

          <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-2">
            <span>{monthlyRequests}</span>
            <span className="text-sm font-normal text-slate-500">/ {monthlyLimit || 10000} monthly requests</span>
          </div>

          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(2, (monthlyRequests / (monthlyLimit || 10000)) * 100))}%`,
              }}
            />
          </div>

          <div className="text-[11px] text-slate-500 pt-1">
            Usage automatically resets at the start of each billing cycle.
          </div>
        </div>

        {/* Subscription / Trial Status */}
        <div className="p-6 bg-dark-card border border-dark-border rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Subscription Status
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              Active Pro
            </span>
          </div>

          <div className="text-3xl font-extrabold text-emerald-400 font-mono flex items-baseline gap-2">
            <span>{daysRemaining}</span>
            <span className="text-sm font-normal text-slate-400">Days Remaining</span>
          </div>

          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(5, (daysRemaining / 30) * 100))}%`,
              }}
            />
          </div>

          <div className="text-[11px] text-slate-400 pt-1">
            Current Plan: <strong className="text-white font-semibold">ZeroRoute Cloud Pro ($3.99/mo)</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
