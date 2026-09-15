"use client";

import { useState } from "react";
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
  Layers,
  Menu,
  X,
  ExternalLink,
  LayoutDashboard
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Top Bar Header */}
      <header className="border-b border-white/10 bg-[#050608]/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo & Admin Status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
              <Image
                src="/logo.png"
                alt="ZeroRoute"
                width={28}
                height={28}
                className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-red-400 transition-colors">
                ZeroRoute
              </span>
            </Link>
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Master Admin</span>
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl transition-all shadow-sm touch-manipulation"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Subscriber View (/app)</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 rounded-xl transition-all shadow-sm touch-manipulation"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>Public Site</span>
            </Link>

            <a
              href="https://buymeacoffee.com/amjadlle"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[38px] text-xs font-bold bg-[#FFDD00] hover:bg-[#FFEA47] text-zinc-950 rounded-xl transition-all active:scale-95 shadow-md shadow-amber-500/20 whitespace-nowrap cursor-pointer touch-manipulation"
              title="Buy Me a Coffee"
            >
              <span>☕</span>
              <span className="inline">Coffee</span>
            </a>

            <button
              type="button"
              onClick={onOpenKeysModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-md shadow-red-500/25 transition-all active:scale-95 cursor-pointer touch-manipulation shrink-0"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>API Keys</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center p-2 sm:p-2.5 min-w-[38px] sm:min-w-[44px] min-h-[38px] sm:min-h-[44px] rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer touch-manipulation shrink-0"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="hidden sm:inline ml-1">Sign Out</span>
            </button>
          </div>

          {/* Mobile Actions: API Keys + Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenKeysModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[36px] text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer touch-manipulation"
            >
              <KeyRound className="w-3.5 h-3.5 shrink-0" />
              <span>Keys</span>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-red-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#080b12] px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs">
              <span className="text-slate-400 font-medium">Role:</span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Master Admin</span>
              </div>
            </div>

            <Link
              href="/app"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/5 transition-all"
            >
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-red-400" />
                <span>Subscriber View (/app)</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <Link
              href="/"
              target="_blank"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/5 transition-all"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <span>Public Landing Site</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <a
              href="https://buymeacoffee.com/amjadlle"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#FFDD00]/10 hover:bg-[#FFDD00]/20 text-[#FFDD00] text-xs font-bold border border-[#FFDD00]/30 transition-all"
            >
              <div className="flex items-center gap-2">
                <span>☕</span>
                <span>Buy Me a Coffee</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>

            <div className="pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/20 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out Master Session</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* KPI Stats Ribbon */}
      <div className="max-w-7xl mx-auto px-3 sm:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          
          {/* Total Requests */}
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-3 sm:p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium">
              <span>Total Requests</span>
              <Activity className="w-3.5 h-3.5 text-red-400 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1 truncate">
              {totalRequests.toLocaleString()}
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>100% success rate</span>
            </div>
          </div>

          {/* RAM Cache Savings */}
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-3 sm:p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium">
              <span>RAM Cache Savings</span>
              <Sparkles className="w-3.5 h-3.5 text-red-400 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-1 truncate">
              {cacheSavings}
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
              0 hits • {cacheHitRatio}% hit ratio
            </div>
          </div>

          {/* Avg Latency */}
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-3 sm:p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium">
              <span>Average Latency</span>
              <Timer className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1 truncate">
              {avgLatencyMs}ms
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
              Sub-second multi-cloud routing
            </div>
          </div>

          {/* Active Providers */}
          <div className="bg-[#090d16] border border-white/10 rounded-2xl p-3 sm:p-4 transition-all hover:border-slate-700">
            <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs font-medium">
              <span>Active Clouds</span>
              <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white mt-1 truncate">
              {activeProviders} / {totalProvidersCount}
            </div>
            <div className="text-[9.5px] sm:text-[10px] text-slate-400 mt-0.5 truncate">
              {activeProviders} keys configured
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
