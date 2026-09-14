"use client";

import { useState } from "react";
import {
  Globe,
  PieChart,
  ShieldAlert,
  RefreshCw,
  Cpu,
  Layers,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Timer
} from "lucide-react";
import { ProviderItem } from "./AdminProvidersTab";
import { GlobalLogItem } from "./AdminLogsTab";
import { PROVIDER_CATALOGS } from "@/lib/providers/catalog";

interface AdminAnalyticsTabProps {
  providers: ProviderItem[];
  logs: GlobalLogItem[];
  onRefresh: () => Promise<void>;
  loading: boolean;
}

export function AdminAnalyticsTab({ providers, logs, onRefresh, loading }: AdminAnalyticsTabProps) {
  // Aggregate origin statistics from real request logs
  const originsMap: Record<
    string,
    { requests: number; tokens: number; cacheHits: number; lastSeen: number }
  > = {};

  // Aggregate model distribution statistics from logs
  const modelsMap: Record<string, { count: number; provider: string; tokens: number }> = {};

  logs.forEach((log) => {
    const origin = log.origin || "Direct API Gateway (CLI/SDK)";
    if (!originsMap[origin]) {
      originsMap[origin] = { requests: 0, tokens: 0, cacheHits: 0, lastSeen: log.timestamp };
    }
    originsMap[origin].requests++;
    originsMap[origin].tokens += log.total_tokens || 0;
    if (log.is_cache_hit) originsMap[origin].cacheHits++;
    if (log.timestamp > originsMap[origin].lastSeen) {
      originsMap[origin].lastSeen = log.timestamp;
    }

    const modelKey = `${log.provider}/${log.model}`;
    if (!modelsMap[modelKey]) {
      modelsMap[modelKey] = { count: 0, provider: log.provider, tokens: 0 };
    }
    modelsMap[modelKey].count++;
    modelsMap[modelKey].tokens += log.total_tokens || 0;
  });

  const originsList = Object.entries(originsMap).sort((a, b) => b[1].requests - a[1].requests);
  const modelsList = Object.entries(modelsMap).sort((a, b) => b[1].count - a[1].count);
  const totalModelRequests = modelsList.reduce((acc, curr) => acc + curr[1].count, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Top Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Connected Websites & Origins Card */}
        <div className="bg-[#090d16] border border-white/10 rounded-2xl p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Connected Websites & Traffic Origins</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {originsList.length} origin{originsList.length === 1 ? "" : "s"} active
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time breakdown of chatbot requests, token consumption, and cache hits per website domain.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {originsList.length > 0 ? (
              originsList.map(([origin, stat]) => {
                const hitRatio = Math.round((stat.cacheHits / stat.requests) * 100);
                return (
                  <div
                    key={origin}
                    className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-2 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white truncate max-w-[180px]" title={origin}>
                        {origin}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {stat.requests} reqs
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-white/5">
                      <div>
                        Tokens: <strong className="text-slate-200">{stat.tokens.toLocaleString()}</strong>
                      </div>
                      <div>
                        Cache: <strong className="text-emerald-400">{hitRatio}%</strong>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 p-8 bg-black/40 border border-dashed border-white/10 rounded-xl text-center text-slate-500 text-xs">
                No website traffic recorded yet. Embed the 1-line widget on your site or send API requests to see live telemetry!
              </div>
            )}
          </div>
        </div>

        {/* Model Traffic Distribution Card */}
        <div className="bg-[#090d16] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-red-400" />
              <span>Model Traffic Distribution</span>
            </h3>
          </div>
          <p className="text-xs text-slate-400">Which models and speed buckets are fulfilling user requests.</p>

          <div className="space-y-3 pt-1">
            {modelsList.length > 0 ? (
              modelsList.map(([modelKey, data]) => {
                const percentage = Math.round((data.count / totalModelRequests) * 100);
                return (
                  <div key={modelKey} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-semibold text-slate-200 truncate max-w-[170px]" title={modelKey}>
                        {modelKey}
                      </span>
                      <span className="text-slate-400">{data.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-white/10 rounded-xl">
                No model traffic recorded yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Provider Quota & Health Status Grid */}
      <div className="bg-[#090d16] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-5 sm:px-6 bg-black/40 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>AI Provider Quotas & Health Status</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live monitoring of 429 rate limit events, consecutive errors, and automated failover cooldowns.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
            <span>Refresh Quotas</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => {
            const catalog = PROVIDER_CATALOGS[p.id];
            const inCooldown = p.cooldownUntil && p.cooldownUntil > Date.now();
            const cooldownSec = inCooldown ? Math.ceil((p.cooldownUntil - Date.now()) / 1000) : 0;

            return (
              <div
                key={p.id}
                className={`p-4 bg-black/40 border rounded-2xl space-y-3 transition-all ${
                  p.enabled ? "border-white/10" : "border-white/5 opacity-40 grayscale"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{p.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                      Priority #{p.order}
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.configured
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {p.configured ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {p.configured ? "Configured" : "Needs Key"}
                  </span>
                </div>

                {catalog && (
                  <div className="text-[11px] text-slate-300 font-mono space-y-1">
                    <div className="truncate text-slate-400">{catalog.totalCapacity}</div>
                    <div className="text-[10px] text-emerald-400/90 font-sans">{catalog.poolBadge}</div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                  <div className="text-slate-400">
                    Latency:{" "}
                    <strong className="text-slate-200 font-bold">
                      {p.lastLatencyMs ? `${p.lastLatencyMs}ms` : "—"}
                    </strong>
                  </div>
                  <div className="text-slate-400">
                    Failures:{" "}
                    <strong className={p.consecutiveFailures > 0 ? "text-amber-400 font-bold" : "text-slate-200"}>
                      {p.consecutiveFailures || 0}
                    </strong>
                  </div>
                </div>

                {inCooldown && (
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10.5px] font-mono flex items-center gap-1.5 animate-pulse">
                    <Timer className="w-3.5 h-3.5 shrink-0" />
                    <span>Cooldown active ({cooldownSec}s remaining)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
