import Image from "next/image";

export function CreatorSection() {
  return (
    <section className="max-w-4xl mx-auto pt-4">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e111a] via-[#090b10] to-[#07080c] p-6 sm:p-10 shadow-2xl glow-effect">
        {/* Glow accents */}
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          {/* Avatar Headshot */}
          <div className="relative shrink-0">
            <img
              src="https://doting-octopus-124.convex.cloud/api/storage/730e2173-8a2f-4d38-8976-7624a53bbc88"
              alt="Amjad P A"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-red-500/40 shadow-2xl shadow-red-500/20"
            />
            <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 backdrop-blur-md">
              ● Active
            </span>
          </div>

          {/* Bio & Mission */}
          <div className="space-y-4 text-center md:text-left flex-1 min-w-0">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-semibold mb-2">
                <span>👨‍💻 Creator &amp; Maintainer</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Amjad P A</h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Full-Stack AI Engineer &amp; Solo Builder. Engineered <strong>ZeroRoute</strong> to eliminate rate limits and make multi-cloud LLM inference 100% free, reliable, and accessible for solo founders and developers.
              </p>
            </div>

            {/* Social Links Grid */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs">
              <a
                href="https://amjad.mapki.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-red-400 hover:text-red-300 border border-white/10 font-semibold transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
                </svg>
                <span>Portfolio</span>
              </a>

              <a
                href="https://github.com/amjadlle"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 hover:text-white border border-white/10 font-semibold transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>GitHub</span>
              </a>

              <a
                href="https://linkedin.com/in/amjadlle"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 hover:text-white border border-white/10 font-semibold transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>LinkedIn</span>
              </a>

              <a
                href="https://x.com/amjadlle"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 hover:text-white border border-white/10 font-semibold transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>X</span>
              </a>

              <a
                href="https://youtube.com/@reputedculprit"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 hover:text-white border border-white/10 font-semibold transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-current text-red-400" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>YouTube</span>
              </a>

              <a
                href="https://instagram.com/amjadlle"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 hover:text-white border border-white/10 font-semibold transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                </svg>
                <span>Instagram</span>
              </a>

              <a
                href="https://www.threads.net/@amjadlle"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 hover:text-white border border-white/10 font-semibold transition-all active:scale-95 shadow-sm"
              >
                <span className="font-bold text-xs">@</span>
                <span>Threads</span>
              </a>

              <a
                href="https://www.reddit.com/user/reputed_culprit/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-xl bg-white/[0.04] hover:bg-white/[0.09] text-slate-200 hover:text-white border border-white/10 font-semibold transition-all active:scale-95 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                </svg>
                <span>Reddit</span>
              </a>

              <a
                href="mailto:mapkisolutions@gmail.com"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold transition-all active:scale-95 shadow-md shadow-red-500/25"
              >
                <svg className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2" viewBox="0 0 24 24">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Get in Touch</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
