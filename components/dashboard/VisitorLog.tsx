"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/client/api";
import { RefreshCw, MessageSquare, Search, Download, Clock, Zap, MessageCircleQuestion } from "lucide-react";

interface CustomerLogItem {
  id: string;
  timestamp: number;
  origin?: string;
  prompt_preview?: string;
  response_preview?: string;
  provider?: string;
  model?: string;
  latency_ms?: number;
  status?: number;
  is_cache_hit?: number | boolean;
}

/** Recent visitor questions from /api/customer/stats (moved out of OverviewTab for /app/usage). */
export function VisitorLog() {
  // Visitor Question Logs state
  const [logs, setLogs] = useState<CustomerLogItem[]>([]);
  const [avgLatency, setAvgLatency] = useState<number>(0);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);
  const [logSearch, setLogSearch] = useState<string>("");

  const fetchCustomerLogs = async () => {
    try {
      setLoadingLogs(true);
      const data = await apiFetch<{ stats?: { logs?: CustomerLogItem[]; averageLatencyMs?: number } }>("/api/customer/stats");
      if (data.stats) {
        setLogs(data.stats.logs || []);
        setAvgLatency(data.stats.averageLatencyMs || 0);
      }
    } catch (e) {
      console.error("Failed to load visitor logs:", e);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchCustomerLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!logSearch.trim()) return logs;
    const q = logSearch.toLowerCase();
    return logs.filter((l) => 
      (l.prompt_preview && l.prompt_preview.toLowerCase().includes(q)) ||
      (l.response_preview && l.response_preview.toLowerCase().includes(q)) ||
      (l.origin && l.origin.toLowerCase().includes(q))
    );
  }, [logs, logSearch]);

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zeroroute-visitor-questions-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-6 bg-dark-card border border-dark-border rounded-2xl space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Visitor Question Logs &amp; Insights</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Live Question Stream
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            See every question your website visitors ask your chatbot in real-time. Discover what customers actually want, identify unaddressed questions, and refine your business knowledge base.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchCustomerLogs}
            disabled={loadingLogs}
            className="p-2.5 min-h-[40px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
            title="Refresh Question Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingLogs ? "animate-spin text-red-400" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportLogs}
            disabled={filteredLogs.length === 0}
            className="px-3 py-2 min-h-[40px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export filtered logs as JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Search visitor questions, answers, or origin domains…"
            className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-colors"
          />
        </div>
        {logSearch && (
          <button
            type="button"
            onClick={() => setLogSearch("")}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-white/5 rounded-lg border border-white/10"
          >
            Clear
          </button>
        )}
      </div>

      {/* Question Logs Table / Cards */}
      {loadingLogs ? (
        <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
          <span>Loading visitor questions…</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-dark-border rounded-xl bg-[#080a0f] space-y-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <MessageCircleQuestion className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-bold text-white">No visitor questions recorded yet</h4>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Once visitors start chatting with your chatbot widget on your website, all questions and AI responses will stream here in real-time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Showing <strong>{filteredLogs.length}</strong> {filteredLogs.length === 1 ? "visitor interaction" : "recent visitor interactions"}</span>
            {avgLatency > 0 && (
              <span className="flex items-center gap-1 font-mono text-emerald-400">
                <Zap className="w-3 h-3" />
                Avg AI Speed: {avgLatency}ms
              </span>
            )}
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredLogs.map((log) => {
              const dateStr = log.timestamp
                ? new Date(log.timestamp).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })
                : "Just now";

              return (
                <div
                  key={log.id}
                  className="p-4 bg-[#080a0f] hover:bg-[#0c1017] border border-dark-border hover:border-slate-700 rounded-xl transition-all space-y-2"
                >
                  {/* Header: Meta info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-mono text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {dateStr}
                      </span>
                      {log.origin && (
                        <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono text-[10px]">
                          {log.origin}
                        </span>
                      )}
                      {log.is_cache_hit ? (
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-[9px] font-bold">
                          ⚡ 0ms RAM Cache
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[10px]">
                      {log.provider && (
                        <span className="text-slate-400">
                          {log.provider} {log.latency_ms ? `• ${log.latency_ms}ms` : ""}
                        </span>
                      )}
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold ${
                          log.status === 200
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {log.status === 200 ? "OK" : log.status || "ERR"}
                      </span>
                    </div>
                  </div>

                  {/* Question (User Prompt) */}
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-white flex items-start gap-2">
                      <span className="text-red-400 shrink-0 font-mono text-[11px] font-bold mt-0.5">Q:</span>
                      <span className="break-words select-text">{log.prompt_preview || "No question text recorded"}</span>
                    </div>

                    {/* Bot Answer Preview */}
                    {log.response_preview && (
                      <div className="text-[11px] text-slate-300/90 pl-5 flex items-start gap-2 pt-0.5 border-t border-white/5">
                        <span className="text-emerald-400 shrink-0 font-mono text-[10px] font-bold mt-0.5">A:</span>
                        <span className="break-words line-clamp-2 select-text">{log.response_preview}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
