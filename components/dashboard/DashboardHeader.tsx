"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, CreditCard } from "lucide-react";

interface DashboardHeaderProps {
  name?: string;
  email?: string;
  isAdmin?: boolean;
  onLogout: () => void;
  onOpenBilling?: () => void;
}

export function DashboardHeader({ name, email, isAdmin, onLogout, onOpenBilling }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#080a0f]/90 backdrop-blur-xl border-b border-dark-border px-3 sm:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
          <Image src="/logo.png" alt="ZeroRoute" width={28} height={28} className="w-7 h-7 object-contain" />
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-red-400 transition-colors">
            ZeroRoute
          </span>
        </Link>
        <span className="px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
          Console
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Master Admin Portal Switcher (Visible only to authorized Admins) */}
        {isAdmin && (
          <Link
            href="/admin"
            className="px-2.5 sm:px-3 py-1.5 min-h-[44px] rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm touch-manipulation whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
            <span>Admin</span>
            <span className="hidden md:inline">Portal</span>
          </Link>
        )}

        {onOpenBilling && (
          <button
            type="button"
            onClick={onOpenBilling}
            className="px-2.5 sm:px-3 py-1.5 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-red-500/30 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm touch-manipulation"
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Plan</span>
          </button>
        )}

        <div className="hidden lg:flex flex-col text-right">
          <span className="text-xs font-bold text-white">{name || "Subscriber"}</span>
          <span className="text-[10px] font-mono text-slate-400">{email}</span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation"
          title="Sign out"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
