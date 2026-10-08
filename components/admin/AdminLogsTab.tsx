"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Radio,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Copy,
  Check,
  Filter,
  Search,
  Download,
  Clock,
  Layers,
  Sparkles
} from "lucide-react";

export interface GlobalLogItem {
  id: string;
  customer_key: string;
  timestamp: number;
  origin?: string;
  prompt_preview?: string;
  response_preview?: string;
  provider: string;
  model: string;
  latency_ms: number;
  status: number;
  is_stream: number;
  is_cache_hit: number;
  failovers?: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

interface AdminLogsTabProps {
  logs: GlobalLogItem[];
  onRefresh: () => Promise<void>;
  loading: boolean;
}

export function AdminLogsTab({ logs, onRefresh, loading }: AdminLogsTabProps) {
  const [selectedLog, setSelectedLog] = useState<GlobalLogItem | null>(null);
  const [originFilter, setOriginFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "error">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-refresh interval (5 seconds) when active
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      onRefresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  // Extract unique origins and providers with count mapping
  const uniqueOrigins = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      const orig = l.origin || "Direct API";
      counts[orig] = (counts[orig] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const uniqueProviders = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach((l) => {
      const p = (l.provider || "unknown").toLowerCase();
      counts[p] = (counts[p] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  // Client-side high speed filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Origin filter
      if (originFilter !== "all") {
        const logOrig = log.origin || "Direct API";
        if (logOrig !== originFilter) return false;
      }
      // Provider filter
      if (providerFilter !== "all") {
        if ((log.provider || "").toLowerCase() !== providerFilter.toLowerCase()) return false;
      }
      // Status filter
      if (statusFilter === "success") {
        if (log.status < 200 || log.status >= 300) return false;
      } else if (statusFilter === "error") {
        if (log.status >= 200 && log.status < 300) return false;
      }
      // Search query filter (search across prompt, response, model, id, origin)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const prompt = (log.prompt_preview || "").toLowerCase();
        const response = (log.response_preview || "").toLowerCase();
        const model = (log.model || "").toLowerCase();
        const origin = (log.origin || "").toLowerCase();
        const id = (log.id || "").toLowerCase();
        if (!prompt.includes(q) && !response.includes(q) && !model.includes(q) && !origin.includes(q) && !id.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [logs, originFilter, providerFilter, statusFilter, searchQuery]);

  const handleCopyLogDetail = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zeroroute-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Control Banner & Multi-Filters */}
      <div className="bg-[#090d16] border border-white/10 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Live Gateway Telemetry & Failover Stream
              </h2>
              <span className="text-[11px] font-mono text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                Showing {filteredLogs.length} of {logs.length}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zero-latency multi-cloud audit log with payload inspection, failover traces, and origin security analysis.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {/* Live Auto-Refresh Button */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[38px] touch-manipulation ${
                autoRefresh
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
              }`}
              title={autoRefresh ? "Live polling active (every 5s)" : "Click to enable live auto-refresh"}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
              <span>{autoRefresh ? "Live 5s" : "Auto-Refresh"}</span>
            </button>

            {/* Export JSON */}
            <button
              type="button"
              onClick={handleExportJson}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer disabled:opacity-40 min-h-[38px] touch-manipulation"
              title="Download filtered logs as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50 min-h-[38px] touch-manipulation"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : "text-slate-400"}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Bar: Search + Origin + Provider + Status Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-white/5">
          {/* Full Text Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompt, model, ID…"
              className="w-full bg-black/40 border border-white/10 focus:border-red-500/50 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all min-h-[38px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white p-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Origin Filter */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs min-h-[38px]">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer w-full text-xs"
            >
              <option value="all" className="bg-[#090d16]">🌐 All Origins ({logs.length})</option>
              {uniqueOrigins.map(([orig, count]) => (
                <option key={orig} value={orig} className="bg-[#090d16]">
                  {orig} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Provider Filter */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs min-h-[38px]">
            <Cpu className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <select
              value={providerFilter}
              onChange={(e) => setProviderFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer w-full text-xs capitalize"
            >
              <option value="all" className="bg-[#090d16]">⚡ All Cloud Providers ({logs.length})</option>
              {uniqueProviders.map(([prov, count]) => (
                <option key={prov} value={prov} className="bg-[#090d16] capitalize">
                  {prov} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Tabs */}
          <div className="grid grid-cols-3 p-1 bg-black/40 border border-white/10 rounded-xl text-[11px] font-semibold min-h-[38px] items-center">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`py-1 rounded-lg transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-white/10 text-white font-bold" : "text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("success")}
              className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                statusFilter === "success" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>2xx</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("error")}
              className={`py-1 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                statusFilter === "error" ? "bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30" : "text-slate-400 hover:text-white"
              }`}
            >
              <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
              <span>Err</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#090d16] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-slate-400 font-mono">
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">Origin / Site</th>
                <th className="py-3 px-4 font-semibold">Provider / Route</th>
                <th className="py-3 px-4 font-semibold">Latency</th>
                <th className="py-3 px-4 font-semibold">Prompt Preview</th>
                <th className="py-3 px-4 font-semibold">Failover Trail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.map((log) => {
                let failoverList: string[] = [];
                try {
                  if (log.failovers) failoverList = JSON.parse(log.failovers);
                } catch {}

                const isSuccess = log.status >= 200 && log.status < 300;
                const latencyColor =
                  log.latency_ms < 400
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : log.latency_ms < 1200
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : "text-rose-400 bg-rose-500/10 border-rose-500/20";

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-white/[0.04] transition-colors cursor-pointer group touch-manipulation"
                  >
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                          isSuccess
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        <span>{log.status || 200}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 truncate max-w-[140px]" title={log.origin || "Direct API"}>
                      {log.origin || "Direct API"}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="font-bold text-white capitalize">{log.provider}</span>
                        <span className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">({log.model})</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-lg font-mono text-[10.5px] font-bold border ${latencyColor}`}>
                        {log.latency_ms}ms
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-slate-300 group-hover:text-white transition-colors" title={log.prompt_preview || ""}>
                      {log.prompt_preview || "No prompt"}
                    </td>

                    <td className="py-3 px-4">
                      {failoverList.length > 0 ? (
                        <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{failoverList.length} failover(s)</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-mono text-emerald-400/80 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Direct
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No requests matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Detail Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#090d16] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Request Detail Inspector</h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate max-w-[180px] sm:max-w-none">ID: {selectedLog.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLogDetail}
                  className="px-3 py-1.5 min-h-[44px] text-xs rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer touch-manipulation"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Payload"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-2 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/5 flex items-center justify-center touch-manipulation"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs text-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">Provider</span>
                  <div className="font-bold text-white capitalize">{selectedLog.provider}</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">Model</span>
                  <div className="font-bold text-white truncate" title={selectedLog.model}>{selectedLog.model}</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">Latency</span>
                  <div className="font-bold text-emerald-400">{selectedLog.latency_ms}ms</div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase">Total Tokens</span>
                  <div className="font-bold text-cyan-400">{selectedLog.total_tokens || 0}</div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Origin / Referer:</span>
                <div className="p-2.5 bg-black/50 border border-white/5 rounded-xl font-mono text-emerald-400">
                  {selectedLog.origin || "Direct API"}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">User Prompt:</span>
                <div className="p-3 bg-black/50 border border-white/5 rounded-xl leading-relaxed whitespace-pre-wrap select-all max-h-32 overflow-y-auto">
                  {selectedLog.prompt_preview || "—"}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400">Assistant Response:</span>
                <div className="p-3 bg-black/50 border border-white/5 rounded-xl leading-relaxed whitespace-pre-wrap select-all max-h-40 overflow-y-auto">
                  {selectedLog.response_preview || "—"}
                </div>
              </div>

              {selectedLog.failovers && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-400">Failover Trace:</span>
                  <pre className="p-3 bg-amber-500/5 border border-amber-500/20 text-amber-300 rounded-xl leading-relaxed whitespace-pre-wrap">
                    {selectedLog.failovers}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

