"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Bot,
  MessageSquare,
  BookOpen,
  Key,
  ArrowRight,
  ArrowLeft,
  Check,
  Copy,
  Plus,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Building,
  Globe,
  CheckCircle2,
} from "lucide-react";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || searchParams.get("key") || "";
  const botIdFromUrl = searchParams.get("bot_id") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Step 1: Brand
  const [botTitle, setBotTitle] = useState("ZeroRoute AI");
  const [botRole, setBotRole] = useState("AI Support Assistant");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [color, setColor] = useState("#ef4444");

  // Step 2: Persona
  const [greeting, setGreeting] = useState("Hi there! 👋 How can I help you today?");
  const [prompts, setPrompts] = useState<string[]>([
    "What features do you offer?",
    "How does pricing work?",
    "How can I contact support?",
  ]);
  const [newPromptInput, setNewPromptInput] = useState("");
  const [tone, setTone] = useState("helpful, friendly, and concise");
  const [persona, setPersona] = useState(
    "You are an expert AI customer support specialist. Answer accurately based on provided knowledge."
  );

  // Step 3: Knowledge
  const [knowledgeMode, setKnowledgeMode] = useState<"crawl" | "text">("crawl");
  const [knowledgeUrl, setKnowledgeUrl] = useState("");
  const [knowledgeText, setKnowledgeText] = useState("");
  const [crawlingUrl, setCrawlingUrl] = useState(false);
  const [crawledSuccess, setCrawledSuccess] = useState(false);

  // Step 4: Password & Keys
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [customerKey, setCustomerKey] = useState(tokenFromUrl);
  const [botId, setBotId] = useState(botIdFromUrl);
  const [customerEmail, setCustomerEmail] = useState(emailFromUrl);

  // Prefill key or session if available
  useEffect(() => {
    if (tokenFromUrl) setCustomerKey(tokenFromUrl);
    if (botIdFromUrl) setBotId(botIdFromUrl);
    if (emailFromUrl) setCustomerEmail(emailFromUrl);

    const fetchExisting = async () => {
      try {
        const queryParams = new URLSearchParams();
        if (tokenFromUrl) queryParams.set("key", tokenFromUrl);
        if (emailFromUrl) queryParams.set("email", emailFromUrl);
        const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";

        const res = await fetch(`/api/customer/profile${queryStr}`);
        if (res.ok) {
          const data = await res.json();
          if (data.customer) {
            if (data.customer.key) setCustomerKey(data.customer.key);
            if (data.customer.bot_id) setBotId(data.customer.bot_id);
            if (data.customer.email) setCustomerEmail(data.customer.email);
            if (data.customer.name) setBotTitle(data.customer.bot_title || data.customer.name);
            if (data.customer.company) setCompany(data.customer.company);
            if (data.customer.website) setWebsite(data.customer.website);
          }
        }
      } catch {}
    };
    fetchExisting();
  }, [tokenFromUrl, botIdFromUrl, emailFromUrl]);

  const steps = [
    { num: 1, title: "Identity", icon: Building },
    { num: 2, title: "Persona", icon: Bot },
    { num: 3, title: "Knowledge (RAG)", icon: BookOpen },
    { num: 4, title: "Credentials & Widget", icon: Key },
  ];

  const handleCrawlInWizard = async () => {
    let cleanUrl = knowledgeUrl.trim();
    if (!cleanUrl) return;
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setCrawlingUrl(true);
    setError("");
    try {
      const res = await fetch("/api/knowledge/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to crawl URL.");
      } else {
        setCrawledSuccess(true);
        if (data.document?.title) {
          setKnowledgeText(`[Source: ${data.document.title}]\nURL: ${data.document.source_url}\nContent indexed (${data.document.char_count} chars).`);
        }
      }
    } catch (e: any) {
      setError(e.message || "Network error while crawling.");
    } finally {
      setCrawlingUrl(false);
    }
  };

  const handleNextStep = () => {
    setError("");
    if (currentStep === 1) {
      if (!company.trim()) {
        setError("Please enter your company or project name.");
        return;
      }
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addPrompt = () => {
    if (newPromptInput.trim() && prompts.length < 6) {
      setPrompts([...prompts, newPromptInput.trim()]);
      setNewPromptInput("");
    }
  };

  const removePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const copyKey = () => {
    navigator.clipboard.writeText(customerKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const activeBotId = botId || "bot_cloud_default";
  const widgetSnippet = `<script src="${typeof window !== "undefined" ? window.location.origin : "https://zeroroute.mapki.in"}/widget.js" data-bot-id="${activeBotId}"></script>`;

  const copyScript = () => {
    navigator.clipboard.writeText(widgetSnippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleFinishSetup = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: customerKey || tokenFromUrl,
          token: tokenFromUrl || customerKey,
          email: customerEmail || emailFromUrl,
          company,
          website,
          bot_title: botTitle,
          bot_role: botRole,
          tone,
          greeting,
          prompts,
          persona,
          knowledge_text: knowledgeText,
          password: password || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save configuration.");
        setLoading(false);
        return;
      }

      // Redirect to /app dashboard with key if present
      const finalKey = data.customer?.key || customerKey || tokenFromUrl;
      const targetUrl = finalKey ? `/app?key=${encodeURIComponent(finalKey)}` : "/app";
      router.push(targetUrl);
    } catch {
      setError("An unexpected error occurred while saving setup.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-xl fixed top-0 left-0 right-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/logo.png"
              alt="ZeroRoute"
              width={30}
              height={30}
              className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  ZeroRoute
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 font-mono">
                  Cloud Pro
                </span>
              </div>
              <div className="text-[7px] sm:text-[8px] font-mono tracking-widest text-slate-500 uppercase">
                ZERO COST. MAX ROUTE.
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Active</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Wizard Form Container */}
      <main className="relative z-10 flex-1 max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-12 w-full space-y-8">
        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between relative max-w-xl mx-auto px-2 sm:px-4">
          <div className="absolute left-6 right-6 sm:left-10 sm:right-10 top-1/2 -translate-y-1/2 h-0.5 bg-dark-border -z-10" />

          {steps.map((s) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center gap-1 bg-[#050608] px-2 sm:px-3">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full font-bold text-xs flex items-center justify-center transition-all ${
                    isDone
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : isCurrent
                      ? "bg-gradient-to-tr from-red-600 to-rose-600 text-white shadow-lg shadow-red-500/25 ring-2 ring-red-400/30"
                      : "bg-dark-card border border-dark-border text-slate-500"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold tracking-tight ${
                    isCurrent ? "text-white" : isDone ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Wizard Step Card */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 glow-effect">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ──────────────── STEP 1: BRAND IDENTITY ──────────────── */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Brand &amp; Assistant Identity</h2>
                <p className="text-xs text-slate-400">
                  Configure how your AI assistant introduces itself on your website and applications.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Company or Project Name *</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Cloud"
                      className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Website URL</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="yourcompany.com or https://..."
                      className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Chatbot Display Title</label>
                  <input
                    type="text"
                    value={botTitle}
                    onChange={(e) => setBotTitle(e.target.value)}
                    placeholder="e.g. Acme Support AI"
                    className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Bot Role / Job Title</label>
                  <input
                    type="text"
                    value={botRole}
                    onChange={(e) => setBotRole(e.target.value)}
                    placeholder="e.g. Customer Success Specialist"
                    className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Primary Brand Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-dark-border bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-400 uppercase">{color}</span>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── STEP 2: PERSONA & TONE ──────────────── */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">AI Persona &amp; Tone</h2>
                <p className="text-xs text-slate-400">
                  Tune how your bot speaks, greets visitors, and guides users with starter prompts.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Welcome Greeting</label>
                <input
                  type="text"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  placeholder="Hi there! How can I help you today?"
                  className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Suggested Question Chips</label>
                <div className="flex flex-wrap gap-2">
                  {prompts.map((p, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/[0.06] border border-white/10 text-xs text-slate-200"
                    >
                      <span>{p}</span>
                      <button
                        type="button"
                        onClick={() => removePrompt(idx)}
                        className="text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {prompts.length < 6 && (
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newPromptInput}
                      onChange={(e) => setNewPromptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addPrompt();
                        }
                      }}
                      placeholder="Add a sample prompt..."
                      className="flex-1 bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl px-3.5 py-1.5 text-xs text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={addPrompt}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Tone of Voice</label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="helpful, friendly, and concise"
                  className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl px-3.5 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">System Persona Instructions</label>
                <textarea
                  rows={3}
                  value={persona}
                  onChange={(e) => setPersona(e.target.value)}
                  placeholder="Instructions guiding AI tone and boundaries..."
                  className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl p-3 text-xs text-white outline-none"
                />
              </div>
            </div>
          )}

          {/* ──────────────── STEP 3: KNOWLEDGE BASE ──────────────── */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Knowledge Base &amp; Semantic RAG</h2>
                <p className="text-xs text-slate-400">
                  Crawl your live website or paste FAQs so your assistant answers accurately without hallucinations.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <button
                  type="button"
                  onClick={() => setKnowledgeMode("crawl")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    knowledgeMode === "crawl"
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🌐 Crawl Website URL
                </button>
                <button
                  type="button"
                  onClick={() => setKnowledgeMode("text")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    knowledgeMode === "text"
                      ? "bg-red-600/20 text-red-300 border border-red-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📝 Manual Text Entry
                </button>
              </div>

              {knowledgeMode === "crawl" && (
                <div className="space-y-3">
                  <label className="text-xs font-semibold text-slate-300">Website or Documentation URL</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={knowledgeUrl}
                        onChange={(e) => setKnowledgeUrl(e.target.value)}
                        placeholder="riba.mapki.in, https://yourcompany.com/docs, or GitHub raw .md"
                        className="w-full bg-[#080a0f] border border-dark-border focus:border-blue-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCrawlInWizard}
                      disabled={crawlingUrl || !knowledgeUrl.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {crawlingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{crawlingUrl ? "Crawling…" : "Crawl"}</span>
                    </button>
                  </div>

                  {crawledSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Successfully crawled and indexed content into your RAG knowledge corpus!</span>
                    </div>
                  )}

                  <div className="space-y-1 pt-2">
                    <label className="text-[11px] font-semibold text-slate-400">Indexed Preview Content</label>
                    <textarea
                      rows={5}
                      value={knowledgeText}
                      onChange={(e) => setKnowledgeText(e.target.value)}
                      placeholder="Crawled content or additional notes will appear here..."
                      className="w-full bg-[#080a0f] border border-dark-border rounded-xl p-3 text-xs text-white font-mono leading-relaxed outline-none"
                    />
                  </div>
                </div>
              )}

              {knowledgeMode === "text" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">Documentation &amp; FAQs Text</label>
                    <span className="text-[10px] font-mono text-slate-500">
                      {knowledgeText.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={knowledgeText}
                    onChange={(e) => setKnowledgeText(e.target.value)}
                    placeholder={`Example:\nQ: What is our return policy?\nA: We offer a 30-day money-back guarantee.\n\nQ: How do I contact support?\nA: Email us at support@example.com or reach out via live chat.`}
                    className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl p-3.5 text-xs text-white font-mono leading-relaxed outline-none"
                  />
                </div>
              )}

              <p className="text-[11px] text-slate-500">
                💡 You can crawl additional URLs and documents anytime inside your Console dashboard after setup.
              </p>
            </div>
          )}

          {/* ──────────────── STEP 4: PASSWORD & DEPLOY ──────────────── */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">Access Credentials &amp; Live Widget</h2>
                <p className="text-xs text-slate-400">
                  Set your password for portal login and copy your 1-line website widget embed script.
                </p>
              </div>

              {/* Password Setting */}
              <div className="space-y-1.5 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <label className="text-xs font-semibold text-slate-300 block">
                  Set Account Password <span className="text-slate-500">(For dashboard login)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password (min 6 chars)"
                    className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Live API Key */}
              <div className="space-y-1.5 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold">Your Master Router Key</span>
                  <button
                    type="button"
                    onClick={copyKey}
                    className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? "Copied!" : "Copy Key"}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-200 bg-[#080a0f] p-2.5 rounded-lg border border-dark-border break-all select-all">
                  {customerKey || "Generating key..."}
                </div>
              </div>

              {/* Embed Script Snippet */}
              <div className="space-y-1.5 p-4 rounded-xl bg-white/[0.02] border border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold">1-Line Embed Code</span>
                  <button
                    type="button"
                    onClick={copyScript}
                    className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? "Copied!" : "Copy HTML"}</span>
                  </button>
                </div>
                <div className="font-mono text-[11px] text-emerald-400 bg-[#080a0f] p-3 rounded-lg border border-dark-border break-all select-all leading-relaxed">
                  {widgetSnippet}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="pt-4 border-t border-dark-border flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSetup}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-xl shadow-red-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Launching Dashboard…</span>
                  </>
                ) : (
                  <>
                    <span>Complete &amp; Open Console</span>
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050608] flex items-center justify-center text-slate-400 text-xs">
          Loading onboarding…
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
