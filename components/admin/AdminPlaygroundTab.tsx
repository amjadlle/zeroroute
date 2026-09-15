"use client";

import { useState, useRef, useEffect } from "react";
import {
  Terminal,
  Sparkles,
  ChevronDown,
  Wand2,
  Cloud,
  Play,
  Copy,
  Trash2,
  Check,
  Loader2,
  Search
} from "lucide-react";
import { ProviderItem } from "./AdminProvidersTab";

interface AdminPlaygroundTabProps {
  providers: ProviderItem[];
}

export function AdminPlaygroundTab({ providers }: AdminPlaygroundTabProps) {
  // Persona Generator State
  const [showPersona, setShowPersona] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [botRole, setBotRole] = useState("");
  const [tone, setTone] = useState("Friendly & Professional");
  const [systemPersona, setSystemPersona] = useState("");
  const [savingPersona, setSavingPersona] = useState(false);

  // Custom Dropdown State
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Playground Execution State
  const [prompt, setPrompt] = useState("Explain quantum computing in one short sentence.");
  const [selectedTarget, setSelectedTarget] = useState("auto");
  const [isStream, setIsStream] = useState(true);
  const [loading, setLoading] = useState(false);
  const [outputMeta, setOutputMeta] = useState<{ provider?: string; model?: string; latencyMs?: number; tokens?: number } | null>(null);
  const [outputText, setOutputText] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleGeneratePersona = () => {
    const brand = companyName.trim() || "our company";
    const role = botRole.trim() || "Customer Support AI";
    const generated = `You are ${role} representing ${brand}. Respond with a ${tone.toLowerCase()} tone. Answer questions concisely, accurately, and politely based on the company's verified knowledge base. Never hallucinate facts.`;
    setSystemPersona(generated);
    showToast("✨ Auto-generated AI persona prompt!");
  };

  const handleSavePersona = async () => {
    setSavingPersona(true);
    try {
      const res = await fetch("/api/customer/persona", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: companyName,
          bot_title: botRole,
          bot_role: botRole,
          persona: systemPersona,
        }),
      });
      if (res.ok) {
        showToast("☁️ Persona saved to Cloud CRM & AI Widget!");
      } else {
        showToast("⚠️ Could not save persona to cloud.");
      }
    } catch {
      showToast("⚠️ Network error while saving persona.");
    } finally {
      setSavingPersona(false);
    }
  };

  const getAdminHeaders = () => {
    const adminKey = typeof window !== "undefined" ? localStorage.getItem("admin_key") || "" : "";
    return {
      "Content-Type": "application/json",
      "Authorization": adminKey ? `Bearer ${adminKey}` : "",
    };
  };

  const handleRunTest = async () => {
    setLoading(true);
    setOutputText("");
    setOutputMeta(null);

    const startTime = Date.now();
    let targetProvider: string | undefined;
    let targetModel: string | undefined;

    if (selectedTarget !== "auto") {
      const [p, m] = selectedTarget.split("::");
      targetProvider = p;
      targetModel = m;
    }

    const messages = [];
    if (systemPersona.trim()) {
      messages.push({ role: "system", content: systemPersona.trim() });
    }
    messages.push({ role: "user", content: prompt });

    try {
      const res = await fetch("/v1/chat/completions", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          model: targetModel || (targetProvider ? `${targetProvider}/default` : "auto"),
          messages,
          stream: isStream,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        setOutputText(`❌ Request Error (${res.status}): ${errText}`);
        setLoading(false);
        return;
      }

      if (isStream && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let sseBuffer = "";
        let finalProvider = targetProvider || "auto";
        let finalModel = targetModel || "auto";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          sseBuffer += decoder.decode(value, { stream: true });
          const lines = sseBuffer.split("\n");
          sseBuffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:") && trimmed !== "data: [DONE]") {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr) {
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.provider) finalProvider = parsed.provider;
                  if (parsed.model) finalModel = parsed.model;
                  const delta = parsed.choices?.[0]?.delta?.content ?? "";
                  accumulated += delta;
                  setOutputText(accumulated);
                } catch {}
              }
            }
          }
        }

        // Process any remaining buffered text
        if (sseBuffer.trim().startsWith("data:") && sseBuffer.trim() !== "data: [DONE]") {
          try {
            const parsed = JSON.parse(sseBuffer.trim().slice(5).trim());
            const delta = parsed.choices?.[0]?.delta?.content ?? "";
            accumulated += delta;
            setOutputText(accumulated);
          } catch {}
        }

        const latency = Date.now() - startTime;
        setOutputMeta({
          provider: finalProvider,
          model: finalModel,
          latencyMs: latency,
        });
      } else {
        const data = await res.json();
        const latency = Date.now() - startTime;
        setOutputText(data.choices?.[0]?.message?.content || "No response");
        setOutputMeta({
          provider: data.provider || targetProvider,
          model: data.model || targetModel,
          latencyMs: latency,
          tokens: data.usage?.total_tokens,
        });
      }
    } catch (e: any) {
      setOutputText(`❌ Network Exception: ${e.message || "Failed to execute request"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Playground Card */}
      <div className="bg-[#090d16] border border-white/10 rounded-2xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        
        {/* Left Column: Persona & Inputs */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Persona Accordion */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowPersona(!showPersona)}
                className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px] touch-manipulation"
              >
                <Sparkles className="w-3.5 h-3.5 text-red-400" />
                <span>Customize AI Persona & Brand (Optional)</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPersona ? "rotate-180" : ""}`} />
              </button>

              {showPersona && (
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Company Name</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g. Mapki Solutions"
                        className="w-full px-3 py-2 text-base sm:text-xs bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Bot Role / Title</label>
                      <input
                        type="text"
                        value={botRole}
                        onChange={(e) => setBotRole(e.target.value)}
                        placeholder="e.g. Sales Assistant"
                        className="w-full px-3 py-2 text-base sm:text-xs bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Tone</label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-2.5 py-2 text-base sm:text-xs bg-black/50 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500 cursor-pointer min-h-[44px] sm:min-h-0"
                      >
                        <option value="Friendly & Professional">Friendly & Professional</option>
                        <option value="Direct & Technical">Direct & Technical</option>
                        <option value="Warm & Sales-Focused">Warm & Sales-Focused</option>
                        <option value="Strictly Formal">Strictly Formal</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleGeneratePersona}
                        className="px-3.5 py-2 min-h-[44px] text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation flex-1 sm:flex-initial"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Auto-Generate</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSavePersona}
                        disabled={savingPersona}
                        className="px-3.5 py-2 min-h-[44px] text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation flex-1 sm:flex-initial"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Save to Cloud</span>
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Syncs to CRM & Widget</span>
                  </div>

                  <textarea
                    rows={2}
                    value={systemPersona}
                    onChange={(e) => setSystemPersona(e.target.value)}
                    placeholder="Persona prompt will generate here, or enter your own..."
                    className="w-full p-2.5 text-base sm:text-xs bg-black/60 border border-white/10 rounded-lg text-slate-200 focus:outline-none focus:border-red-500 font-mono resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Test Prompt */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Test Prompt</label>
              <textarea
                rows={5}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask anything to test failover and latency…"
                className="w-full p-3.5 text-base sm:text-xs bg-black/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Provider Select, Stream Toggle, Send Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {/* Custom Model Selector Dropdown */}
            <div className="flex-1 flex items-center gap-2.5 min-w-0">
              <div className="flex-1 min-w-0 relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-full px-3 py-2 min-h-[44px] text-xs bg-black/50 border rounded-xl text-slate-200 font-mono flex items-center justify-between gap-2 transition-all cursor-pointer touch-manipulation ${
                    dropdownOpen
                      ? "border-red-500 ring-1 ring-red-500/30 shadow-lg shadow-red-500/10"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {selectedTarget === "auto" ? (
                      <span className="text-amber-400 font-bold flex items-center gap-1.5 truncate">
                        <span>⚡</span>
                        <span>Auto Fallback Route</span>
                      </span>
                    ) : (
                      (() => {
                        const [pId, ...mParts] = selectedTarget.split("::");
                        const mName = mParts.join("::");
                        const prov = providers.find((p) => p.id === pId);
                        return (
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-400 shrink-0">{prov?.name || pId}</span>
                            <span className="text-slate-600 shrink-0">→</span>
                            <span className="text-white font-medium truncate">{mName}</span>
                          </div>
                        );
                      })()
                    )}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-red-400" : ""}`} />
                </button>

                {/* Custom Popover Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute left-0 right-0 bottom-full mb-2 z-50 bg-[#090d16]/98 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl shadow-black/90 p-1.5 flex flex-col animate-in fade-in zoom-in-95 duration-150 max-w-full">
                    {/* Search filter input */}
                    <div className="px-2.5 py-1.5 border-b border-white/10 mb-1 flex items-center gap-2 bg-black/60 rounded-lg">
                      <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search provider or model..."
                        className="w-full text-base sm:text-xs bg-transparent text-white placeholder-slate-500 focus:outline-none font-mono py-1"
                        autoFocus
                      />
                      {searchFilter && (
                        <button
                          type="button"
                          onClick={() => setSearchFilter("")}
                          className="text-slate-400 hover:text-white text-xs px-2 py-1 min-w-[36px] min-h-[36px] flex items-center justify-center touch-manipulation"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Scrollable Model Options List */}
                    <div className="overflow-y-auto space-y-0.5 max-h-60 pr-1">
                      {/* Auto Fallback Route Item */}
                      {("auto fallback route".includes(searchFilter.toLowerCase()) || !searchFilter) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTarget("auto");
                            setDropdownOpen(false);
                            setSearchFilter("");
                          }}
                          className={`w-full text-left px-2.5 py-2 min-h-[40px] rounded-lg text-xs font-mono transition-colors flex items-center justify-between gap-2 cursor-pointer touch-manipulation ${
                            selectedTarget === "auto"
                              ? "bg-red-500/20 text-white border border-red-500/40"
                              : "text-slate-200 hover:bg-white/[0.08] hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400">⚡</span>
                            <div className="flex flex-col">
                              <span className="font-bold text-amber-300">Auto Fallback Route</span>
                              <span className="text-[10px] text-slate-400 font-sans">Dynamic multi-cloud routing with instant failover</span>
                            </div>
                          </div>
                          {selectedTarget === "auto" && <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                        </button>
                      )}

                      {/* Providers & Models */}
                      {providers.map((p) => {
                        const models = (p.models?.length ? p.models : [p.model]);
                        const matchingModels = models.filter(
                          (m) =>
                            p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
                            m.toLowerCase().includes(searchFilter.toLowerCase())
                        );

                        if (matchingModels.length === 0) return null;

                        return (
                          <div key={p.id} className="pt-1">
                            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/[0.02] rounded flex items-center justify-between">
                              <span>{p.name}</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${p.configured ? "bg-emerald-400" : "bg-slate-600"}`} />
                            </div>
                            <div className="space-y-0.5 mt-0.5 pl-1">
                              {matchingModels.map((m) => {
                                const targetKey = `${p.id}::${m}`;
                                const isSelected = selectedTarget === targetKey;
                                return (
                                  <button
                                    key={targetKey}
                                    type="button"
                                    onClick={() => {
                                      setSelectedTarget(targetKey);
                                      setDropdownOpen(false);
                                      setSearchFilter("");
                                    }}
                                    className={`w-full text-left px-2.5 py-2 min-h-[38px] rounded-lg text-xs font-mono transition-colors flex items-center justify-between gap-2 cursor-pointer touch-manipulation ${
                                      isSelected
                                        ? "bg-red-500/20 text-white border border-red-500/40 font-semibold"
                                        : "text-slate-300 hover:bg-white/[0.08] hover:text-white"
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <span className="text-slate-500 text-[10px]">→</span>
                                      <span className="truncate">{m}</span>
                                    </div>
                                    {isSelected && <Check className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-300 shrink-0 px-3 py-2 min-h-[44px] bg-black/40 border border-white/10 rounded-xl hover:border-white/20 transition-colors select-none touch-manipulation">
                <input
                  type="checkbox"
                  checked={isStream}
                  onChange={(e) => setIsStream(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/50 border-white/10 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span>Stream</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleRunTest}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2 min-h-[44px] text-xs font-bold rounded-xl shadow-md transition-all shrink-0 touch-manipulation ${
                loading
                  ? "bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed"
                  : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/20 active:scale-95 cursor-pointer"
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin text-red-400" /> : <Play className="w-4 h-4 fill-white text-white" />}
              <span className="font-bold">{loading ? "Routing Request…" : "Send Request"}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Output */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-red-400" />
              <span>Live Response Output</span>
            </span>

            <div className="flex items-center gap-2">
              {outputMeta && (
                <span className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 truncate max-w-[200px]">
                  ⚡ {outputMeta.latencyMs}ms ({outputMeta.provider}/{outputMeta.model})
                </span>
              )}

              <button
                type="button"
                onClick={handleCopy}
                disabled={!outputText}
                className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30 flex items-center justify-center touch-manipulation"
                title="Copy Response"
                aria-label="Copy Response"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOutputText("");
                  setOutputMeta(null);
                }}
                disabled={!outputText}
                className="p-2.5 min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-30 flex items-center justify-center touch-manipulation"
                title="Clear Output"
                aria-label="Clear Output"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[220px] p-4 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-slate-200 overflow-y-auto leading-relaxed whitespace-pre-wrap select-all">
            {outputText || <span className="text-slate-600">Response will stream or return here…</span>}
            {loading && <span className="inline-block w-2 h-4 bg-red-500 animate-pulse ml-1 align-middle" />}
          </div>
        </div>
      </div>
    </div>
  );
}
