import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="pt-10 pb-8 border-t border-dark-border space-y-4 text-xs text-slate-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="ZeroRoute"
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
          <span className="font-bold text-sm text-slate-200">ZeroRoute</span>
          <span className="text-[10px] font-mono text-slate-400 font-normal">
            v1.0.0 • MIT Licensed
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-5 gap-y-2 text-[11px] text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">
            Features
          </a>
          <a href="#widget" className="hover:text-white transition-colors">
            Chatbot
          </a>
          <a href="#providers" className="hover:text-white transition-colors">
            Providers
          </a>
          <Link href="/app" className="hover:text-white transition-colors">
            Console
          </Link>
          <a
            href="https://buymeacoffee.com/amjadlle"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400/90 hover:text-amber-300 transition-colors font-medium flex items-center gap-1"
          >
            ☕ Buy Me a Coffee
          </a>
          <a
            href="https://github.com/amjadlle/zeroroute"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
      <div className="text-[11px] text-center sm:text-left text-slate-500 pt-2 border-t border-dark-border/40">
        © 2026 ZeroRoute by{" "}
        <a
          href="https://amjad.mapki.in"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-300 hover:text-white font-medium"
        >
          Amjad P A
        </a>
        . Free for personal &amp; commercial use.
      </div>
    </footer>
  );
}
