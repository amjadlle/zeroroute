import { Layers, ShieldCheck, Zap, Gauge, Key, Server, MessageSquareText, FileText } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: MessageSquareText,
      color: "red",
      iconBg: "bg-red-500/10 border-red-500/20 text-red-400",
      title: "Visitor Question Logs & Insights",
      description: "See every question your visitors ask in real-time, so you finally know what people actually want from your site. Search prompts, audit AI answers, and discover product gaps.",
    },
    {
      icon: Layers,
      color: "blue",
      iconBg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      title: "10,000 Requests/Mo Pool",
      description: "Includes 10,000 monthly requests routed across Groq, Cloudflare, Gemini, Mistral, SambaNova & 6 more clouds with zero token overage fees.",
    },
    {
      icon: ShieldCheck,
      color: "emerald",
      iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
      title: "Zero-Downtime Smart Routing",
      description: "ZeroRoute dynamically distributes requests across the fastest, healthiest clouds in <8ms with automatic real-time high-availability load balancing.",
    },
    {
      icon: FileText,
      color: "purple",
      iconBg: "bg-purple-500/10 border-purple-500/20 text-purple-400",
      title: "Instant RAG & URL Crawler",
      description: "Scrape websites, Google Docs, Notion, or raw markdown with SSRF protection. Your chatbot answers strictly using verified facts with zero hallucination.",
    },
    {
      icon: Zap,
      color: "amber",
      iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
      title: "Lightning RAM Caching",
      description: "Exact repeat prompts return in 0ms with instant token replay from memory, saving 100% of your provider quota.",
    },
    {
      icon: Gauge,
      color: "rose",
      iconBg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      title: "Parallel Benchmark Suite",
      description: "Race all 11 multi-cloud providers concurrently in real-time. Detect the fastest model and optimize your routing chain in 1-click.",
    },
  ];

  return (
    <section id="features" className="space-y-12 scroll-mt-20">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
          <span>⚡</span> Built for Solo Founders &amp; Startups
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Everything You Need to Launch &amp; Scale at 99% Lower Cost
        </h2>
        <p className="text-sm text-slate-400">
          Enterprise-grade multi-cloud routing without the $500/month OpenAI or Anthropic bills.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="p-6 bg-dark-card border border-dark-border rounded-2xl space-y-3 hover:border-slate-700 transition-all"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${f.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
