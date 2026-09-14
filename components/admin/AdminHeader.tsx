"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  LogOut,
  Globe,
  KeyRound,
  Activity,
  CheckCircle2,
  Sparkles,
  Timer,
  Layers
} from "lucide-react";

interface AdminHeaderProps {
  totalCustomers: number;
  activeProviders: number;
  totalProvidersCount: number;
  totalRequests: number;
  avgLatencyMs?: number;
  cacheSavings?: string;
  cacheHitRatio?: number;
  onLogout: () => void;
  onOpenKeysModal: () => void;
}

export function AdminHeader({
  totalCustomers,
  activeProviders,
  totalProvidersCount,
  totalRequests,
  avgLatencyMs = 450,
  cacheSavings = "$0.0000",
  cacheHitRatio = 0,
  onLogout,
  onOpenKeysModal,
}: AdminHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Top Bar Header */}
      <header className="border-b border-white/10 bg-[#050608]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Admin Status */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="ZeroRoute"
                width={32}
                height={32}
                className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-red-400 transition-colors">
                ZeroRoute
              </span>
            </Link>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10.5px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Master Admin</span>
            </div>
          </div>

          {/* Action Buttons: Subscriber View, Public Site, Buy Me a Coffee, API Keys, Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/app"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl transition-all shadow-sm"
            >
              <span>Subscriber View (/app)</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl transition-all shadow-sm"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>

            <a
              href="https://buymeacoffee.com/amjadlle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#FFDD00] hover:bg-[#FFEA47] text-zinc-950 rounded-xl transition-all active:scale-95 shadow-md shadow-amber-500/20 whitespace-nowrap cursor-pointer"
              title="Buy Me a Coffee"
            >
              <span>☕</span>
              <span className="hidden sm:inline">Buy Me a Coffee</span>
            </a>

            <button
              type="button"
              onClick={onOpenKeysModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-md shadow-red-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>API Keys</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* KPI Stats Ribbon matching public/admin.html */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Total Requests */}
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Total Requests</span>
              <Activity className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {totalRequests.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>100% success rate</span>
            </div>
          </div>

          {/* RAM Cache Savings */}
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>RAM Cache Savings</span>
              <Sparkles className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              {cacheSavings}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              0 hits • {cacheHitRatio}% hit ratio
            </div>
          </div>

          {/* Avg Latency */}
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Average Latency</span>
              <Timer className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {avgLatencyMs}ms
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Sub-second multi-cloud routing
            </div>
          </div>

          {/* Active Providers */}
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
              <span>Active Clouds</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {activeProviders} / {totalProvidersCount}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {activeProviders} keys configured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
