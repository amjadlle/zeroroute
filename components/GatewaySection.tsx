"use client";

import Link from "next/link";
import { TerminalFailover } from "@/components/TerminalFailover";
import { Zap, Code2, ArrowRight, ShieldCheck, Cpu } from "lucide-react";

export function GatewaySection() {
  return (
    <section id="gateway" className="space-y-10 scroll-mt-20 max-w-5xl mx-auto">
      {/* Section Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-semibold">
          <Code2 className="w-3.5 h-3.5" />
          <span>⚡ OpenAI-Compatible API Gateway for Developers</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight text-balance max-w-3xl mx-auto">
          Never Pay for LLMs Again. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
            One Endpoint. 100 Fast Models.
          </span>
        </h2>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed text-balance">
          Drop in our single OpenAI-compatible base URL into your <strong className="text-slate-200">Cursor</strong>, <strong className="text-slate-200">Claude Code</strong>, <strong className="text-slate-200">Python</strong>, or <strong className="text-slate-200">TypeScript</strong> apps. Automatically load balances across 11 pooled AI providers with sub-8ms dynamic failover.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-dark-card border border-dark-border text-slate-300 font-mono">
            <Cpu className="w-3 h-3 text-red-400" />
            <span>baseURL: &quot;https://zeroroute.mapki.in/v1&quot;</span>
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold font-mono">
            <ShieldCheck className="w-3 h-3" />
            <span>100% Uptime Failover</span>
          </span>
        </div>
      </div>

      {/* Live Terminal Failover Component */}
      <TerminalFailover />

      {/* Developer Quick Links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs">
        <a
          href="#quickstart"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 hover:border-white/20 hover:-translate-y-0.5 transition-all"
        >
          <span>View SDK Code Examples (Python / Node / cURL)</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </a>
        <a
          href="https://github.com/amjadlle/zeroroute"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 hover:-translate-y-0.5 transition-all"
        >
          <span>Open-Source Repo ↗</span>
        </a>
      </div>
    </section>
  );
}
