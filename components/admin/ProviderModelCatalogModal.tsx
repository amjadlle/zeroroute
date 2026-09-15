"use client";

import { useState, useEffect } from "react";
import {
  X,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Plus,
  Trash2,
  Workflow,
  ExternalLink,
  Layers
} from "lucide-react";
import { PROVIDER_CATALOGS, PROVIDER_PORTALS, CatalogModel } from "@/lib/providers/catalog";
import { ProviderItem } from "./AdminProvidersTab";

interface ProviderModelCatalogModalProps {
  provider: ProviderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProvider: (updated: ProviderItem) => Promise<void>;
}

interface TestResult {
  ok: boolean;
  latencyMs: number;
  response?: string;
  error?: string;
  telemetry?: {
    remainingRequests?: string | number;
    limitRequests?: string | number;
    remainingTokens?: string | number;
    resetRequests?: string;
  };
}

export function ProviderModelCatalogModal({
  provider,
  isOpen,
  onClose,
  onUpdateProvider,
}: ProviderModelCatalogModalProps) {
  const [testingModels, setTestingModels] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [benchmarkingAll, setBenchmarkingAll] = useState(false);
  const [benchmarkProgress, setBenchmarkProgress] = useState<{ current: number; total: number } | null>(null);
  const [customModelInput, setCustomModelInput] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  useEffect(() => {
    setTestResults({});
    setTestingModels({});
    setBenchmarkingAll(false);
    setBenchmarkProgress(null);
    setCustomModelInput("");
  }, [provider?.id, isOpen]);

  if (!isOpen || !provider) return null;

  const catalogData = PROVIDER_CATALOGS[provider.id];
  const currentModels = provider.models && provider.models.length > 0 ? provider.models : [provider.model];
  const portalUrl = PROVIDER_PORTALS[provider.id] || "https://zeroroute.app";

  const allCatalogModels: CatalogModel[] = catalogData?.categories
    ? catalogData.categories.flatMap((cat) => cat.models)
    : [];

  const totalCatalogModelsCount = allCatalogModels.length || currentModels.length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getAdminHeaders = () => {
    const adminKey = typeof window !== "undefined" ? localStorage.getItem("admin_key") || "" : "";
    return {
      "Content-Type": "application/json",
      "Authorization": adminKey ? `Bearer ${adminKey}` : "",
    };
  };

  const safeFetchJson = async (url: string, options: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 120)}` };
      }
    } catch (e: any) {
      return { ok: false, error: e.message || "Network request failed" };
    }
  };

  const handleTestModel = async (modelId: string) => {
    setTestingModels((prev) => ({ ...prev, [modelId]: true }));
    try {
      const data = await safeFetchJson("/api/admin/providers/test", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ providerId: provider.id, model: modelId }),
      });
      setTestResults((prev) => ({
        ...prev,
        [modelId]: {
          ok: Boolean(data.ok),
          latencyMs: data.latencyMs || 0,
          response: data.response || (data.ok ? "OK" : undefined),
          error: data.error,
          telemetry: data.telemetry,
        },
      }));
      if (data.ok) {
        showToast(`✅ ${modelId} responded in ${data.latencyMs}ms!`);
      }
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [modelId]: {
          ok: false,
          latencyMs: 0,
          error: e.message || "Network request failed",
        },
      }));
    } finally {
      setTestingModels((prev) => ({ ...prev, [modelId]: false }));
    }
  };

  const handleBenchmarkAll = async () => {
    if (benchmarkingAll || allCatalogModels.length === 0) return;
    setBenchmarkingAll(true);
    setBenchmarkProgress({ current: 0, total: allCatalogModels.length });

    let completed = 0;
    const concurrency = 3;
    let idx = 0;

    const worker = async () => {
      while (idx < allCatalogModels.length) {
        const currentModel = allCatalogModels[idx++];
        if (!currentModel) break;
        try {
          const data = await safeFetchJson("/api/admin/providers/test", {
            method: "POST",
            headers: getAdminHeaders(),
            body: JSON.stringify({ providerId: provider.id, model: currentModel.id }),
          });
          setTestResults((prev) => ({
            ...prev,
            [currentModel.id]: {
              ok: Boolean(data.ok),
              latencyMs: data.latencyMs || 0,
              response: data.response || (data.ok ? "OK" : undefined),
              error: data.error,
              telemetry: data.telemetry,
            },
          }));
        } catch (e: any) {
          setTestResults((prev) => ({
            ...prev,
            [currentModel.id]: {
              ok: false,
              latencyMs: 0,
              error: e.message || "Ping error",
            },
          }));
        }
        completed++;
        setBenchmarkProgress({ current: completed, total: allCatalogModels.length });
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, allCatalogModels.length) }, () => worker());
    await Promise.all(workers);

    setBenchmarkingAll(false);
    setBenchmarkProgress(null);
    showToast(`⚡ Tested ${allCatalogModels.length} models for ${provider.name}!`);
  };

  const handleSetPrimary = async (modelName: string) => {
    setSavingAction(`set-primary-${modelName}`);
    try {
      const without = currentModels.filter((m) => m !== modelName);
      const newModels = [modelName, ...without];
      await onUpdateProvider({
        ...provider,
        model: modelName,
        models: newModels,
      });
      showToast(`🏆 ${modelName} is now #1 Primary model!`);
    } finally {
      setSavingAction(null);
    }
  };

  const handleAddToChain = async (modelName: string) => {
    if (currentModels.includes(modelName)) return;
    setSavingAction(`add-${modelName}`);
    try {
      const newModels = [...currentModels, modelName];
      await onUpdateProvider({
        ...provider,
        models: newModels,
        model: newModels[0],
      });
      showToast(`✅ Added ${modelName} to fallback chain`);
    } finally {
      setSavingAction(null);
    }
  };

  const handleRemoveFromChain = async (modelName: string) => {
    if (currentModels.length <= 1) {
      showToast("⚠️ Each provider must keep at least 1 model in its chain.");
      return;
    }
    setSavingAction(`remove-${modelName}`);
    try {
      const newModels = currentModels.filter((m) => m !== modelName);
      await onUpdateProvider({
        ...provider,
        models: newModels,
        model: newModels[0],
      });
      showToast(`🗑️ Removed ${modelName} from chain`);
    } finally {
      setSavingAction(null);
    }
  };

  const handleMoveModel = async (index: number, delta: number) => {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= currentModels.length) return;
    setSavingAction(`move-${index}`);
    try {
      const newModels = [...currentModels];
      const temp = newModels[index];
      newModels[index] = newModels[targetIndex];
      newModels[targetIndex] = temp;

      await onUpdateProvider({
        ...provider,
        models: newModels,
        model: newModels[0],
      });
      showToast(`🔄 Moved ${temp} to rank #${targetIndex + 1}`);
    } finally {
      setSavingAction(null);
    }
  };

  const handleAddCustomModel = async () => {
    const trimmed = customModelInput.trim();
    if (!trimmed) {
      showToast("⚠️ Please enter a valid model identifier");
      return;
    }
    setSavingAction("add-custom");
    try {
      await handleAddToChain(trimmed);
      setCustomModelInput("");
    } finally {
      setSavingAction(null);
    }
  };

  // Compute healthy tested models for Smart Fallback Recommendation
  const validModelIds = new Set([...allCatalogModels.map((m) => m.id), ...currentModels]);
  const healthyTestedModels = Object.entries(testResults)
    .filter(([id, result]) => result.ok && validModelIds.has(id))
    .map(([id, result]) => ({ id, latencyMs: result.latencyMs }))
    .sort((a, b) => a.latencyMs - b.latencyMs);

  const handleApplySmartRecommendation = async () => {
    if (healthyTestedModels.length === 0) return;
    setSavingAction("smart-recommendation");
    try {
      const newChain = healthyTestedModels.map((m) => m.id);
      await onUpdateProvider({
        ...provider,
        models: newChain,
        model: newChain[0],
      });
      showToast(`🏆 Applied optimal fallback chain (${newChain.length} models)!`);
    } finally {
      setSavingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#090d16] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#050608]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">{provider.name} Model Catalog & Quotas</h2>
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-white transition-colors"
                  title="Open Provider Developer Console"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-slate-400">Pick from verified models or enter custom identifiers</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center touch-manipulation"
            aria-label="Close catalog modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* Top Capacity & Quota Info Banner */}
          {catalogData && (
            <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {catalogData.poolBadge}
                  </span>
                  <span className="text-xs font-semibold text-slate-300">
                    Total Capacity: <strong className="text-white font-mono">{catalogData.totalCapacity}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleBenchmarkAll}
                  disabled={benchmarkingAll || allCatalogModels.length === 0}
                  className="px-4 py-2 min-h-[44px] text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer touch-manipulation w-full sm:w-auto"
                >
                  {benchmarkingAll ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        Testing ({benchmarkProgress?.current || 0}/{benchmarkProgress?.total || totalCatalogModelsCount})…
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ Test All ({totalCatalogModelsCount}) Models</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed font-sans">{catalogData.poolSummary}</p>
            </div>
          )}

          {/* Active Intra-Provider Fallback Chain Bar */}
          <div className="p-4 bg-black/50 border border-white/10 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-red-400" />
                <span>Active Intra-Provider Fallback Chain:</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{currentModels.length} models active</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentModels.map((m, idx) => {
                const isPrimary = idx === 0;
                const isMoving = savingAction === `move-${idx}`;
                const isRemoving = savingAction === `remove-${m}`;
                return (
                  <div
                    key={m}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono shadow-sm transition-all min-h-[38px] ${
                      isPrimary
                        ? "bg-red-500/15 text-red-300 border border-red-500/40 font-bold"
                        : "bg-[#0b101c] text-slate-300 border border-white/10"
                    } ${isMoving || isRemoving ? "opacity-75 ring-1 ring-red-400/50" : ""}`}
                  >
                    {isMoving || isRemoving ? (
                      <Loader2 className="w-3 h-3 animate-spin text-red-400 shrink-0" />
                    ) : (
                      <span className={isPrimary ? "text-red-400 font-bold uppercase text-[10px]" : "text-slate-500 text-[10px]"}>
                        {isPrimary ? "🏆 #1 Primary" : `#${idx + 1}`}
                      </span>
                    )}
                    <span className="truncate max-w-[180px] font-semibold" title={m}>
                      {m}
                    </span>

                    <div className="flex items-center gap-0.5 ml-1 border-l border-white/10 pl-1.5">
                      {idx > 0 && (
                        <button
                          type="button"
                          disabled={Boolean(savingAction)}
                          onClick={() => handleMoveModel(idx, -1)}
                          className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-400 hover:text-emerald-300 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-20 cursor-pointer touch-manipulation"
                          title="Promote / Move Left"
                          aria-label="Move model left"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < currentModels.length - 1 && (
                        <button
                          type="button"
                          disabled={Boolean(savingAction)}
                          onClick={() => handleMoveModel(idx, 1)}
                          className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-400 hover:text-emerald-300 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-20 cursor-pointer touch-manipulation"
                          title="Demote / Move Right"
                          aria-label="Move model right"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {currentModels.length > 1 && (
                        <button
                          type="button"
                          disabled={Boolean(savingAction)}
                          onClick={() => handleRemoveFromChain(m)}
                          className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-0.5 disabled:opacity-20 cursor-pointer touch-manipulation"
                          title="Remove from active chain"
                          aria-label="Remove model from chain"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Fallback Recommendation (if benchmarked / tested) */}
          {healthyTestedModels.length > 1 && (
            <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-[#0a1518] to-black/60 border border-emerald-500/30 rounded-2xl space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Smart Fallback Recommendation (Ranked by Live Tested Latency & Health):</span>
                </div>
                <button
                  type="button"
                  disabled={Boolean(savingAction)}
                  onClick={handleApplySmartRecommendation}
                  className="px-4 py-2 min-h-[44px] text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black rounded-xl shadow-md shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer touch-manipulation w-full sm:w-auto"
                >
                  {savingAction === "smart-recommendation" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying…</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>1-Click Apply Suggested Order</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {healthyTestedModels.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono ${
                        idx === 0
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm"
                          : "bg-black/40 text-slate-300 border border-white/10"
                      }`}
                    >
                      <span className={`text-[10px] ${idx === 0 ? "text-emerald-400 font-bold" : "text-slate-500"}`}>
                        #{idx + 1}
                      </span>
                      <span className="truncate max-w-[160px]">{item.id}</span>
                      <span className="text-[10px] text-emerald-400 font-semibold font-mono">⚡{item.latencyMs}ms</span>
                    </span>
                    {idx < healthyTestedModels.length - 1 && (
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-500/40 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categorized Model Sections */}
          <div className="space-y-6">
            {catalogData?.categories?.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div>
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">{cat.name}</h3>
                    <p className="text-[11px] text-slate-400">{cat.description}</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-semibold bg-white/5 px-2.5 py-0.5 rounded-full border border-white/5">
                    {cat.models.length} Models
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cat.models.map((m) => {
                    const inChain = currentModels.includes(m.id);
                    const chainIndex = currentModels.indexOf(m.id);
                    const isPrimary = chainIndex === 0;
                    const isTesting = testingModels[m.id];
                    const testResult = testResults[m.id];
                    const isSettingPrimary = savingAction === `set-primary-${m.id}`;
                    const isAddingToChain = savingAction === `add-${m.id}`;
                    const isRemovingThis = savingAction === `remove-${m.id}`;

                    return (
                      <div
                        key={m.id}
                        className={`p-4 bg-black/40 hover:bg-[#0c121e] border rounded-2xl transition-all flex flex-col justify-between gap-3 ${
                          inChain ? "border-red-500/40 shadow-lg shadow-red-500/5" : "border-white/10"
                        }`}
                      >
                        {/* Header & Role */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-bold text-xs text-white font-mono select-all">{m.id}</code>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10">
                              {m.brain}
                            </span>
                            {isPrimary && (
                              <span className="text-[10px] font-bold text-red-300 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded-full uppercase">
                                🏆 Primary
                              </span>
                            )}
                            {inChain && !isPrimary && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                                #{chainIndex + 1} Chain
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 leading-snug">{m.role}</p>
                        </div>

                        {/* Specs & Pool Chips */}
                        <div className="space-y-2.5 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-1.5 flex-wrap text-[10.5px] font-mono text-slate-400">
                            {m.kind && m.kind !== "Chat" && (
                              <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 font-semibold font-sans">
                                {m.kind}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-[#0b101c] border border-white/10 text-slate-300">
                              RPM: <strong className="text-white">{m.rpm}</strong>
                            </span>
                            {m.ctx && (
                              <span className="px-2 py-0.5 rounded bg-[#0b101c] border border-white/10 text-slate-300">
                                Ctx: <strong className="text-white">{m.ctx}</strong>
                              </span>
                            )}
                            {m.maxOut && (
                              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                                Max Out: <strong className="text-white">{m.maxOut}</strong>
                              </span>
                            )}
                            {m.tpm && m.tpm !== "—" && (
                              <span className="px-2 py-0.5 rounded bg-[#0b101c] border border-white/10 text-slate-300">
                                TPM: <strong className="text-white">{m.tpm}</strong>
                              </span>
                            )}
                            {m.rpd && (
                              <span className="px-2 py-0.5 rounded bg-[#0b101c] border border-white/10 text-slate-300">
                                RPD: <strong className="text-white">{m.rpd}</strong>
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-[#0b101c] border border-white/10 text-emerald-400">
                              ⚡ {m.latency}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                              {m.pool}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleTestModel(m.id)}
                              disabled={isTesting || Boolean(savingAction)}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50 touch-manipulation flex-1 sm:flex-initial"
                            >
                              {isTesting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-emerald-400" />
                              )}
                              <span>{isTesting ? "Testing…" : "Test Ping"}</span>
                            </button>

                            <div className="flex items-center gap-1.5 flex-wrap flex-1 sm:flex-initial justify-end">
                              {inChain ? (
                                <>
                                  {!isPrimary && (
                                    <button
                                      type="button"
                                      disabled={Boolean(savingAction)}
                                      onClick={() => handleSetPrimary(m.id)}
                                      className="inline-flex items-center justify-center gap-1 px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition-all disabled:opacity-50 cursor-pointer touch-manipulation flex-1 sm:flex-initial"
                                    >
                                      {isSettingPrimary ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                      ) : null}
                                      <span>Make Primary</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    disabled={Boolean(savingAction)}
                                    onClick={() => handleRemoveFromChain(m.id)}
                                    className="inline-flex items-center justify-center gap-1 px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all disabled:opacity-50 cursor-pointer touch-manipulation flex-1 sm:flex-initial"
                                  >
                                    {isRemovingThis ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : null}
                                    <span>Remove</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={Boolean(savingAction)}
                                    onClick={() => handleSetPrimary(m.id)}
                                    className="inline-flex items-center justify-center gap-1 px-3.5 py-2 min-h-[44px] text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer touch-manipulation flex-1 sm:flex-initial"
                                  >
                                    {isSettingPrimary ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : null}
                                    <span>Set Primary</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={Boolean(savingAction)}
                                    onClick={() => handleAddToChain(m.id)}
                                    className="inline-flex items-center justify-center gap-1 px-4 py-2 min-h-[44px] text-xs font-bold rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer touch-manipulation flex-1 sm:flex-initial"
                                  >
                                    {isAddingToChain ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Plus className="w-3.5 h-3.5" />
                                    )}
                                    <span>Add to Chain</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Live Response / Error Result Box */}
                          {testResult && (
                            <div
                              className={`p-3 rounded-xl border text-xs space-y-2 animate-in fade-in ${
                                testResult.ok
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-slate-200"
                                  : "bg-rose-500/10 border-rose-500/30 text-rose-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 font-bold text-[11px]">
                                  {testResult.ok ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-emerald-400">Live Response ({testResult.latencyMs}ms):</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                      <span className="text-rose-300">Test Failed ({testResult.latencyMs}ms):</span>
                                    </>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(
                                      testResult.ok ? testResult.response || "OK" : testResult.error || "Failed",
                                      m.id
                                    )
                                  }
                                  className="px-2.5 py-1 min-h-[36px] text-[10px] rounded-lg bg-black/40 hover:bg-black/60 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer touch-manipulation"
                                >
                                  {copiedKey === m.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <pre className="text-[11px] bg-black/50 p-2.5 rounded-lg border border-white/5 font-mono leading-relaxed select-all whitespace-pre-wrap max-h-28 overflow-y-auto">
                                {testResult.ok ? testResult.response || "OK" : testResult.error}
                              </pre>

                              {/* Telemetry Row */}
                              {testResult.telemetry && (
                                <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-slate-300 pt-1.5 border-t border-emerald-500/20">
                                  {testResult.telemetry.remainingRequests && (
                                    <span className="px-2 py-0.5 rounded bg-black/40 border border-emerald-500/30 text-emerald-300">
                                      Live Quota:{" "}
                                      <strong className="text-white">
                                        {testResult.telemetry.remainingRequests}
                                        {testResult.telemetry.limitRequests ? `/${testResult.telemetry.limitRequests}` : ""} Left
                                      </strong>
                                    </span>
                                  )}
                                  {testResult.telemetry.remainingTokens && (
                                    <span className="px-2 py-0.5 rounded bg-black/40 border border-emerald-500/30 text-emerald-300">
                                      Tokens Left: <strong className="text-white">{testResult.telemetry.remainingTokens}</strong>
                                    </span>
                                  )}
                                  {testResult.telemetry.resetRequests && (
                                    <span className="px-2 py-0.5 rounded bg-black/40 border border-emerald-500/30 text-emerald-300">
                                      ⏱️ Resets in {testResult.telemetry.resetRequests}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Model Input */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <label className="text-xs font-bold text-slate-300 block">
              Or Enter Any Custom / Fine-Tuned Model Identifier
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={customModelInput}
                onChange={(e) => setCustomModelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustomModel()}
                placeholder="e.g. meta-llama/llama-guard-4-12b or your-fine-tuned-model"
                className="flex-1 px-4 py-2.5 text-base sm:text-xs font-mono bg-black/50 border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition-all min-h-[44px]"
              />
              <button
                type="button"
                disabled={Boolean(savingAction)}
                onClick={handleAddCustomModel}
                className="px-5 py-2.5 min-h-[44px] text-xs font-bold bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer touch-manipulation"
              >
                {savingAction === "add-custom" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Add Custom Model</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
