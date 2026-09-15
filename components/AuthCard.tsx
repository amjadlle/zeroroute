"use client";

import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
      {/* Top Navigation: Back to Home */}
      <div className="w-full max-w-md mb-3 sm:mb-4 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors group px-3.5 py-2 min-h-[44px] rounded-xl bg-white/5 border border-white/5 hover:border-white/10 touch-manipulation"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <Image
            src="/logo.png"
            alt="ZeroRoute"
            width={36}
            height={36}
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain group-hover:scale-105 transition-transform"
          />
          <div className="text-left">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white group-hover:text-red-400 transition-colors">
              ZeroRoute
            </span>
            <div className="text-[7.5px] font-mono tracking-widest text-slate-500 uppercase leading-none">
              ZERO COST. MAX ROUTE.
            </div>
          </div>
        </Link>
      </div>

      {/* Main Glass Card */}
      <div className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80 space-y-6 glow-effect relative overflow-hidden backdrop-blur-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {subtitle}
          </p>
        </div>

        {children}
      </div>

      {/* Bottom Footer Note */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <p>© 2026 ZeroRoute. Enterprise-grade zero-cost AI gateway.</p>
      </div>
    </div>
  );
}
