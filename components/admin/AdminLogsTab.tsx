"use client";

import { useState } from "react";
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
  Filter
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
  const [copied, setCopied] = useState(false);

  // Extract unique origins for the filter dropdown
  const uniqueOrigins = Array.from(new Set(logs.map((l) => l.origin).filter(Boolean)));

  const filteredLogs = logs.filter((log) => {
    if (originFilter === "all") return true;
    return log.origin === originFilter;
  });

  const handleCopyLogDetail = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header, Filter, and Flush/Clear Actions */}
      <div className="bg-[#090d16] border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Real-Time Gateway Traffic & Failovers
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Click on any request to inspect full payload, timeline, and multi-tier failover trace.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
          {/* Origin Filter */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs min-h-[44px]">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-base sm:text-xs min-h-[40px] sm:min-h-0"
            >
              <option value="all" className="bg-[#090d16]">🌐 All Origins ({logs.length})</option>
              {uniqueOrigins.map((orig) => (
                <option key={orig} value={orig} className="bg-[#090d16]">
                  {orig}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all cursor-pointer disabled:opacity-50 min-h-[44px] touch-manipulation flex-1 sm:flex-initial"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : "text-slate-400"}`} />
            <span>Refresh</span>
          </button>
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
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
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
                        <span className="text-[11px] font-mono text-slate-400">({log.model})</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-mono text-[10.5px] font-bold border ${latencyColor}`}>
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
                    No gateway requests found. Send a test from the playground to see live telemetry.
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
