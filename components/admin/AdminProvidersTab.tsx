"use client";

import { useState } from "react";
import {
  Layers,
  Zap,
  Play,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Key,
  Workflow,
  AlertCircle
} from "lucide-react";
import { PROVIDER_PORTALS, PROVIDER_CATALOGS } from "@/lib/providers/catalog";
import { ProviderModelCatalogModal } from "./ProviderModelCatalogModal";

export interface ProviderItem {
  id: string;
  name: string;
  model: string;
  models: string[];
  enabled: boolean;
  order: number;
  configured: boolean;
  consecutiveFailures: number;
  cooldownUntil: number;
  lastLatencyMs?: number;
  lastError?: string;
}

interface BenchmarkResult {
  providerId: string;
  providerName: string;
  model: string;
  status: "ok" | "error";
  latencyMs: number;
  response?: string;
  error?: string | null;
}

interface AdminProvidersTabProps {
  providers: ProviderItem[];
  onUpdateProviders: (updated: ProviderItem[]) => Promise<void>;
}

export function AdminProvidersTab({ providers, onUpdateProviders }: AdminProvidersTabProps) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; latencyMs: number; response?: string; error?: string }>
  >({});
  const [benchmarking, setBenchmarking] = useState(false);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[] | null>(null);
  const [activeCatalogProvider, setActiveCatalogProvider] = useState<ProviderItem | null>(null);
  const [errorModalProvider, setErrorModalProvider] = useState<ProviderItem | null>(null);
  const [savingAction, setSavingAction] = useState<string | null>(null);

  // Sort providers strictly by order
  const sortedProviders = [...providers].sort((a, b) => a.order - b.order);

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

  const handleTestPrimary = async (providerId: string) => {
    setTestingId(providerId);
    const provider = providers.find((p) => p.id === providerId);
    const targetModel = provider?.models?.[0] || provider?.model;

    try {
      const data = await safeFetchJson("/api/admin/providers/test", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ providerId, model: targetModel }),
      });
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          ok: Boolean(data.ok),
          latencyMs: data.latencyMs || 0,
          response: data.response || (data.ok ? "OK" : undefined),
          error: data.error,
        },
      }));

      // Update provider latency in parent if successful
      if (data.ok) {
        const updated = providers.map((p) =>
          p.id === providerId
            ? { ...p, lastLatencyMs: data.latencyMs, consecutiveFailures: 0, lastError: undefined }
            : p
        );
        await onUpdateProviders(updated);
      }
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: {
          ok: false,
          latencyMs: 0,
          error: e.message || "Network test failed",
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleRunBenchmark = async () => {
    setBenchmarking(true);
    setBenchmarkResults(null);
    try {
      const data = await safeFetchJson("/api/admin/providers/benchmark", {
        method: "POST",
        headers: getAdminHeaders(),
      });
      if (data.results) {
        setBenchmarkResults(data.results);
      }
    } catch (err) {
      console.error("Benchmark error:", err);
    } finally {
      setBenchmarking(false);
    }
  };

  const handleToggleEnable = async (providerId: string) => {
    const actionKey = `toggle-${providerId}`;
    setSavingAction(actionKey);
    try {
      const updated = providers.map((p) => (p.id === providerId ? { ...p, enabled: !p.enabled } : p));
      await onUpdateProviders(updated);
    } finally {
      setSavingAction(null);
    }
  };

  const handleMoveProvider = async (currentIndex: number, delta: number) => {
    const targetIndex = currentIndex + delta;
    if (targetIndex < 0 || targetIndex >= sortedProviders.length) return;

    const actionKey = `move-prov-${sortedProviders[currentIndex]?.id}`;
    setSavingAction(actionKey);
    try {
      const list = [...sortedProviders];
      const temp = list[currentIndex];
      list[currentIndex] = list[targetIndex];
      list[targetIndex] = temp;

      // Re-assign order 1..N
      const updated = list.map((p, idx) => ({ ...p, order: idx + 1 }));
      await onUpdateProviders(updated);
    } finally {
      setSavingAction(null);
    }
  };

  const handleMoveModelInProvider = async (providerId: string, modelIndex: number, delta: number) => {
    const targetProvider = providers.find((p) => p.id === providerId);
    if (!targetProvider) return;

    const currentModels = targetProvider.models && targetProvider.models.length > 0
      ? [...targetProvider.models]
      : [targetProvider.model];

    const targetModelIndex = modelIndex + delta;
    if (targetModelIndex < 0 || targetModelIndex >= currentModels.length) return;

    const actionKey = `move-model-${providerId}-${modelIndex}`;
    setSavingAction(actionKey);
    try {
      const temp = currentModels[modelIndex];
      currentModels[modelIndex] = currentModels[targetModelIndex];
      currentModels[targetModelIndex] = temp;

      const updated = providers.map((p) =>
        p.id === providerId
          ? { ...p, models: currentModels, model: currentModels[0] }
          : p
      );
      await onUpdateProviders(updated);
    } finally {
      setSavingAction(null);
    }
  };

  const handleRemoveModelFromProvider = async (providerId: string, modelName: string) => {
    const targetProvider = providers.find((p) => p.id === providerId);
    if (!targetProvider) return;

    const currentModels = targetProvider.models && targetProvider.models.length > 0
      ? [...targetProvider.models]
      : [targetProvider.model];

    if (currentModels.length <= 1) {
      alert("Each provider must keep at least 1 model in its chain.");
      return;
    }

    const actionKey = `remove-model-${providerId}-${modelName}`;
    setSavingAction(actionKey);
    try {
      const filtered = currentModels.filter((m) => m !== modelName);
      const updated = providers.map((p) =>
        p.id === providerId
          ? { ...p, models: filtered, model: filtered[0] }
          : p
      );
      await onUpdateProviders(updated);
    } finally {
      setSavingAction(null);
    }
  };

  const handleUpdateSingleProvider = async (updatedItem: ProviderItem) => {
    const updated = providers.map((p) => (p.id === updatedItem.id ? updatedItem : p));
    await onUpdateProviders(updated);
    setActiveCatalogProvider(updatedItem);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Automatic Failover Chain Header */}
      <div className="bg-[#090d16] border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Workflow className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white tracking-tight">Automatic Failover Chain</h2>
          </div>
          <p className="text-xs text-slate-400">
            Top-priority provider handles traffic first. Click any model name or Manage Models to customize intra-provider fallback chains inline.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleRunBenchmark}
            disabled={benchmarking}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {benchmarking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Racing 10 Clouds…</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Benchmark All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Benchmark Results Leaderboard Modal */}
      {benchmarkResults && (
        <div className="bg-[#090d16] border border-red-500/30 rounded-2xl p-6 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Live Benchmark Race Leaderboard</h3>
            </div>
            <button
              type="button"
              onClick={() => setBenchmarkResults(null)}
              className="text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {benchmarkResults.map((r, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl border flex flex-col justify-between gap-2 text-xs ${
                  r.status === "ok"
                    ? "bg-emerald-500/5 border-emerald-500/20 text-slate-200"
                    : "bg-red-500/5 border-red-500/20 text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{r.providerName}</span>
                  <span
                    className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      r.status === "ok" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {r.status === "ok" ? `${r.latencyMs}ms` : "Error"}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-400 truncate">{r.model}</div>
                {r.error && <div className="text-[10px] text-red-400/90 truncate">{r.error}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider Failover Rows */}
      <div className="space-y-4">
        {sortedProviders.map((p, index) => {
          const isTesting = testingId === p.id;
          const result = testResults[p.id];
          const portalUrl = PROVIDER_PORTALS[p.id] || "https://zeroroute.app";
          const modelsList = p.models && p.models.length > 0 ? p.models : [p.model];
          const isFirst = index === 0;
          const isLast = index === sortedProviders.length - 1;

          return (
            <div
              key={p.id}
              className={`bg-[#090d16] border rounded-2xl p-5 space-y-4 transition-all ${
                p.enabled ? "border-white/10" : "border-white/5 opacity-50 grayscale"
              }`}
            >
              {/* Row 1: Order, Provider Info, Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  {/* Priority Order & Up/Down Arrows */}
                  <div className="flex sm:flex-col items-center gap-1 shrink-0 pt-0.5 sm:pt-0">
                    <span className="w-7 h-7 rounded-xl bg-black/50 border border-white/10 text-xs font-mono font-bold flex items-center justify-center text-slate-300">
                      {index + 1}
                    </span>
                    <div className="flex sm:flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={isFirst || Boolean(savingAction)}
                        onClick={() => handleMoveProvider(index, -1)}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                        title="Move Up in Failover Chain"
                      >
                        {savingAction === `move-prov-${p.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        ) : (
                          <ChevronUp className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={isLast || Boolean(savingAction)}
                        onClick={() => handleMoveProvider(index, 1)}
                        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
                        title="Move Down in Failover Chain"
                      >
                        {savingAction === `move-prov-${p.id}` ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Provider Details */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <a
                        href={portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-sm sm:text-base text-white hover:text-red-400 flex items-center gap-1.5 transition-colors truncate"
                      >
                        <span>{p.name}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-70 shrink-0" />
                      </a>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          p.configured
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {p.configured ? "• Active" : "+ Needs Key"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        ⚡ Latency:{" "}
                        <strong className="text-slate-200">
                          {p.lastLatencyMs ? `${p.lastLatencyMs}ms` : "--"}
                        </strong>
                      </span>
                      <span className="font-mono">
                        Failures:{" "}
                        <strong className={p.consecutiveFailures > 0 ? "text-amber-400" : "text-slate-300"}>
                          {p.consecutiveFailures || 0}
                        </strong>
                      </span>
                      {p.lastError && (
                        <button
                          type="button"
                          onClick={() => setErrorModalProvider(p)}
                          className="inline-flex items-center gap-1 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer"
                        >
                          <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{p.lastError}</span>
                          <span className="underline font-sans text-rose-300 ml-0.5">View Log</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions: Enabled Toggle & Test Primary Button */}
                <div className="flex items-center justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={Boolean(savingAction)}
                    onClick={() => handleToggleEnable(p.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 ${
                      p.enabled
                        ? "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25"
                        : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                    }`}
                  >
                    {savingAction === `toggle-${p.id}` ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving…</span>
                      </>
                    ) : (
                      <span>{p.enabled ? "Enabled" : "Disabled"}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTestPrimary(p.id)}
                    disabled={isTesting || Boolean(savingAction)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-black/40 hover:bg-white/5 border border-white/10 text-slate-200 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                    ) : (
                      <Play className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span>Test Primary</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Dynamic Intra-Provider Model Fallback Chain */}
              <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                    <Layers className="w-3.5 h-3.5 text-red-400" />
                    <span>Intra-Provider Model Fallback Chain</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      (Fails over in sequence before switching provider)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveCatalogProvider(p)}
                    className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Manage Models</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {modelsList.map((m, mIdx) => {
                    const isPrimary = mIdx === 0;
                    const isMovingThis = savingAction === `move-model-${p.id}-${mIdx}`;
                    const isRemovingThis = savingAction === `remove-model-${p.id}-${m}`;

                    return (
                      <div
                        key={m}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono shadow-sm transition-all ${
                          isPrimary
                            ? "bg-red-500/15 text-red-300 border border-red-500/30 font-bold"
                            : "bg-[#0b101c] text-slate-300 border border-white/10"
                        } ${isMovingThis || isRemovingThis ? "opacity-75 ring-1 ring-red-400/50" : ""}`}
                      >
                        {(isMovingThis || isRemovingThis) ? (
                          <Loader2 className="w-3 h-3 animate-spin text-red-400 shrink-0" />
                        ) : (
                          <span
                            className={`text-[10px] font-bold ${
                              isPrimary ? "text-red-400 uppercase font-sans" : "text-slate-500"
                            }`}
                          >
                            {isPrimary ? "#1 PRIMARY" : `#${mIdx + 1}`}
                          </span>
                        )}

                        <span
                          onClick={() => setActiveCatalogProvider(p)}
                          className="font-bold max-w-[180px] truncate cursor-pointer hover:underline"
                          title={`${m} (Click to inspect model catalog)`}
                        >
                          {m}
                        </span>

                        <div className="flex items-center gap-0.5 ml-1 border-l border-white/10 pl-1.5">
                          <button
                            type="button"
                            disabled={mIdx === 0 || Boolean(savingAction)}
                            onClick={() => handleMoveModelInProvider(p.id, mIdx, -1)}
                            className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                            title="Move Up / Promote in Chain"
                          >
                            <ChevronLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={mIdx === modelsList.length - 1 || Boolean(savingAction)}
                            onClick={() => handleMoveModelInProvider(p.id, mIdx, 1)}
                            className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20 transition-all cursor-pointer"
                            title="Move Down / Demote in Chain"
                          >
                            <ChevronRight className="w-3 h-3" />
                          </button>
                          {modelsList.length > 1 && (
                            <button
                              type="button"
                              disabled={Boolean(savingAction)}
                              onClick={() => handleRemoveModelFromProvider(p.id, m)}
                              className="p-0.5 text-slate-500 hover:text-rose-400 disabled:opacity-20 transition-all cursor-pointer ml-0.5"
                              title="Remove model from chain"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Test Status / Error Display */}
              {result && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1.5 animate-in fade-in ${
                    result.ok
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      {result.ok ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Ping OK ({result.latencyMs}ms)</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                          <span>Ping Failed ({result.latencyMs}ms)</span>
                        </>
                      )}
                    </div>
                  </div>
                  <pre className="text-[11px] font-mono bg-black/40 p-2 rounded border border-white/5 whitespace-pre-wrap select-all">
                    {result.ok ? result.response || "OK" : result.error}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Provider Model Catalog Modal */}
      <ProviderModelCatalogModal
        provider={activeCatalogProvider}
        isOpen={Boolean(activeCatalogProvider)}
        onClose={() => setActiveCatalogProvider(null)}
        onUpdateProvider={handleUpdateSingleProvider}
      />

      {/* Error Details Modal */}
      {errorModalProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#090d16] border border-rose-500/40 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errorModalProvider.name} Error Log</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorModalProvider(null)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
            <pre className="text-xs font-mono text-rose-200 bg-black/60 p-3.5 rounded-xl border border-rose-500/20 leading-relaxed whitespace-pre-wrap select-all max-h-60 overflow-y-auto">
              {errorModalProvider.lastError}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
