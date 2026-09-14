import { Cpu, Zap, ShieldCheck } from "lucide-react";

interface ProviderData {
  id: string;
  name: string;
  badge: string;
  models: string[];
  rpm: string;
  tpm: string;
  speed: string;
  status: "Operational" | "Fast";
}

const PROVIDERS_DATA: ProviderData[] = [
  {
    id: "groq",
    name: "Groq",
    badge: "LPU Ultra Speed",
    models: ["openai/gpt-oss-120b", "qwen/qwen3.8-27b", "openai/gpt-oss-20b"],
    rpm: "30 RPM",
    tpm: "6,000 TPM",
    speed: "300+ tok/s",
    status: "Fast",
  },
  {
    id: "cerebras",
    name: "Cerebras",
    badge: "World Record Chip",
    models: ["gpt-oss-120b", "qwen-3.8-27b"],
    rpm: "30 RPM",
    tpm: "60,000 TPM",
    speed: "1,800 tok/s",
    status: "Fast",
  },
  {
    id: "sambanova",
    name: "SambaNova",
    badge: "Dataflow Architecture",
    models: ["MiniMax-M2.7", "DeepSeek-V3.1", "Meta-Llama-3.3-70B-Instruct"],
    rpm: "20 RPM",
    tpm: "40,000 TPM",
    speed: "400 tok/s",
    status: "Fast",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    badge: "Official European AI",
    models: ["open-mistral-nemo", "ministral-3b-2512", "codestral-latest"],
    rpm: "60 RPM",
    tpm: "500,000 TPM",
    speed: "180 tok/s",
    status: "Operational",
  },
  {
    id: "gemini",
    name: "Google Gemini",
    badge: "Multimodal 1M Context",
    models: ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"],
    rpm: "15 RPM",
    tpm: "1,000,000 TPM",
    speed: "220 tok/s",
    status: "Operational",
  },
  {
    id: "cloudflare",
    name: "Cloudflare AI",
    badge: "Global Edge Network",
    models: ["@cf/meta/llama-3.1-8b-instruct", "@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-3.2-3b-instruct"],
    rpm: "50 RPM",
    tpm: "Unlimited",
    speed: "120 tok/s",
    status: "Operational",
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    badge: "Enterprise GPU Cloud",
    models: ["nvidia/nemotron-3.5-lightning-30b-a3b", "meta/llama-3.2-11b-vision-instruct"],
    rpm: "40 RPM",
    tpm: "10,000 TPM",
    speed: "250 tok/s",
    status: "Operational",
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    badge: "Multi-Model Fallback",
    models: ["nvidia/nemotron-3.5-lightning:free", "openrouter/free", "liquid/lfm-2.5-2.6b:free"],
    rpm: "20 RPM",
    tpm: "Unlimited",
    speed: "150 tok/s",
    status: "Operational",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    badge: "Open Source Hub",
    models: ["meta-llama/Llama-3.1-8B-Instruct", "Qwen/Qwen2.5-72B-Instruct", "Qwen/Qwen2.5-Coder-32B-Instruct"],
    rpm: "10 RPM",
    tpm: "Unlimited",
    speed: "140 tok/s",
    status: "Operational",
  },
];

export function ProvidersSection() {
  return (
    <section id="providers" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-300 text-xs font-semibold font-mono">
          <span>⚡ CLOUD PROVIDERS</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Supported AI Clouds &amp; Free Rate Limits
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
          ZeroRoute automatically load-balances and cascades across all 9 providers. Free tier quotas are refreshed automatically every minute.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {PROVIDERS_DATA.map((p) => (
          <div
            key={p.id}
            className="glass-card rounded-2xl p-5 space-y-4 hover:border-white/20 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>{p.name}</span>
                  </h3>
                  <span className="text-[10.5px] font-mono text-slate-400">{p.badge}</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{p.speed}</span>
                </span>
              </div>

              {/* Models List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10.5px] font-mono uppercase text-slate-400 font-bold">Top Models:</span>
                <div className="flex flex-wrap gap-1.5">
                  {p.models.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/10 text-[10px] font-mono text-slate-300 truncate max-w-full"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quota Stats Footer */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Limit: <strong className="text-slate-200">{p.rpm}</strong></span>
              <span>Tokens: <strong className="text-slate-200">{p.tpm}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}