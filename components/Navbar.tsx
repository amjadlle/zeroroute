"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-3 sm:top-5 inset-x-0 mx-auto z-50 px-3 sm:px-6 w-full max-w-6xl pointer-events-none transition-all duration-300">
      <header
        className={`pointer-events-auto w-full backdrop-blur-2xl rounded-xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all duration-300 ring-1 ring-white/10 ${
          scrolled
            ? "bg-[#050608]/95 shadow-[0_12px_40px_rgba(0,0,0,0.85)] border border-white/20"
            : "bg-[#080a0f]/80 shadow-[0_8px_32px_0_rgba(0,0,0,0.65)] border border-white/[0.12] hover:border-white/20"
        }`}
      >
        {/* Brand Logo & Tagline */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
          <Image
            src="/logo.png"
            alt="ZeroRoute Logo"
            width={32}
            height={32}
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0 group-hover:scale-105 transition-transform"
            priority
          />
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-red-400 transition-colors">
                ZeroRoute
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                v1.0.0
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                $0/mo
              </span>
            </div>
            <div className="text-[6.5px] sm:text-[9px] font-mono tracking-wider sm:tracking-widest text-slate-500 uppercase leading-none mt-0.5">
              ZERO COST. MAX ROUTE.
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-xs font-semibold text-slate-300">
          <a
            href="#features"
            className="px-3 py-1.5 rounded-lg hover:bg-white/[0.06] hover:text-white transition-all"
          >
            Features
          </a>
          <a
            href="#widget"
            className="px-3 py-1.5 rounded-lg hover:bg-white/[0.06] hover:text-white transition-all"
          >
            Chatbot
          </a>
          <a
            href="#providers"
            className="px-3 py-1.5 rounded-lg hover:bg-white/[0.06] hover:text-white transition-all"
          >
            Providers
          </a>
          <a
            href="#pricing"
            className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 transition-all font-bold"
          >
            Pricing
          </a>
          <a
            href="#quickstart"
            className="px-3 py-1.5 rounded-lg hover:bg-white/[0.06] hover:text-white transition-all"
          >
            Docs
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <a
            href="https://buymeacoffee.com/amjadlle"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 text-xs font-bold bg-[#FFDD00] hover:bg-[#FFEA47] text-zinc-950 rounded-lg transition-all active:scale-95 shadow-md shadow-amber-500/20 shrink-0"
            title="Buy Me a Coffee"
            aria-label="Buy Me a Coffee"
          >
            <span className="text-sm sm:text-xs">☕</span>
            <span className="hidden sm:inline sm:ml-1.5">Buy Me a Coffee</span>
          </a>

          <a
            href="https://github.com/amjadlle/zeroroute"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white border border-white/10 rounded-lg transition-all active:scale-95 shadow-sm"
          >
            <svg className="w-3.5 h-3.5 fill-current text-slate-300" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Star</span>
            <span className="text-amber-400 font-mono text-[11px]">★</span>
          </a>

          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg shadow-lg shadow-red-600/30 ring-1 ring-red-400/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect width="7" height="7" x="3" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="3" rx="1" />
              <rect width="7" height="7" x="14" y="14" rx="1" />
              <rect width="7" height="7" x="3" y="14" rx="1" />
            </svg>
            <span>Console</span>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto md:hidden mt-2 bg-[#080a0f]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl space-y-2.5 font-semibold text-sm text-slate-200 ring-1 ring-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Features
          </a>
          <a
            href="#widget"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            1-Line Chatbot
          </a>
          <a
            href="#providers"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Supported Providers
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-amber-400"
          >
            Pricing &amp; Hosted Cloud
          </a>
          <a
            href="#quickstart"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            Integration Code
          </a>
          <a
            href="https://github.com/amjadlle/zeroroute"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-2 rounded-lg text-red-400 hover:bg-white/5 transition-colors"
          >
            GitHub &amp; Docs ↗
          </a>
          <div className="pt-2 border-t border-white/10">
            <a
              href="https://buymeacoffee.com/amjadlle"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold bg-[#FFDD00] hover:bg-[#FFEA47] text-zinc-950 shadow-md shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>☕</span>
              <span>Buy Me a Coffee</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
