"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2, Globe, FileText, Loader2, Sparkles, ExternalLink, AlertCircle } from "lucide-react";

export interface KnowledgeDoc {
  id: string;
  title: string;
  type: string;
  content: string;
  char_count: number;
  source_url?: string;
  created_at: number;
}

interface KnowledgeTabProps {
  docs: KnowledgeDoc[];
  onAddDoc: (title: string, content: string) => Promise<void>;
  onDeleteDoc: (id: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
  addingDoc: boolean;
}

export function KnowledgeTab({ docs, onAddDoc, onDeleteDoc, onRefresh, addingDoc }: KnowledgeTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"text" | "crawl">("crawl");

  // Text state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Crawl state
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlTitle, setCrawlTitle] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [crawlError, setCrawlError] = useState("");

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onAddDoc(title || "Knowledge Document", content);
    setTitle("");
    setContent("");
    setModalOpen(false);
  };

  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = crawlUrl.trim();
    if (!cleanUrl) return;
    
    // Auto prepend https if protocol is omitted
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setCrawling(true);
    setCrawlError("");

    try {
      const res = await fetch("/api/knowledge/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, title: crawlTitle.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCrawlError(data.error || "Failed to crawl URL.");
        setCrawling(false);
        return;
      }

      // Refresh list smoothly without full page reload
      setCrawlUrl("");
      setCrawlTitle("");
      setModalOpen(false);
      if (onRefresh) {
        await onRefresh();
      }
    } catch (err: any) {
      setCrawlError(err.message || "Network error while crawling.");
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Semantic Knowledge Base (RAG)</h3>
          <p className="text-xs text-slate-400">
            Documents and live website URLs crawled here are automatically injected into AI prompts for accurate answers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("crawl");
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 shadow-sm cursor-pointer transition-all touch-manipulation"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Crawl Website URL</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("text");
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg cursor-pointer transition-all touch-manipulation"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Add Text Doc</span>
          </button>
        </div>
      </div>

      {/* Document List */}
      {docs.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-dark-card border border-dark-border rounded-2xl space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-white">No knowledge documents yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Crawl your website or paste product FAQs to enable high-accuracy RAG for your assistant.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setMode("crawl");
                setModalOpen(true);
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 cursor-pointer touch-manipulation"
            >
              🌐 Crawl Website
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("text");
                setModalOpen(true);
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 cursor-pointer touch-manipulation"
            >
              + Add Text Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((d) => {
            const isWeb = d.type.startsWith("web_") || Boolean(d.source_url);
            return (
              <div key={d.id} className="p-4 bg-dark-card border border-dark-border rounded-2xl space-y-3 relative group hover:border-white/20 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {isWeb ? <Globe className="w-4 h-4 text-blue-400 shrink-0" /> : <FileText className="w-4 h-4 text-amber-400 shrink-0" />}
                    <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[240px]" title={d.title}>
                      {d.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteDoc(d.id)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer touch-manipulation shrink-0"
                    title="Delete Document"
                    aria-label="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {d.source_url && (
                  <a
                    href={d.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-400/90 hover:text-blue-300 truncate max-w-full font-mono"
                  >
                    <span className="truncate">{d.source_url}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                )}

                <p className="text-xs text-slate-400 font-mono line-clamp-3 leading-relaxed">
                  {d.content}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-dark-border">
                  <span className="font-mono">{d.char_count?.toLocaleString()} chars</span>
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Add / Crawl Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0c0e14] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            {/* Modal Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("crawl")}
                  className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                    mode === "crawl"
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🌐 Crawl Website URL
                </button>
                <button
                  type="button"
                  onClick={() => setMode("text")}
                  className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                    mode === "text"
                      ? "bg-red-600/20 text-red-300 border border-red-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📝 Paste Manual Text
                </button>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer touch-manipulation shrink-0"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Mode 1: Crawl Web Page */}
            {mode === "crawl" && (
              <form onSubmit={handleCrawlSubmit} className="space-y-4">
                {crawlError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{crawlError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Public URL</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                      placeholder="riba.mapki.in, https://yourcompany.com/docs, or GitHub raw .md"
                      className="w-full bg-[#080a0f] border border-dark-border rounded-xl pl-10 pr-3 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50 touch-manipulation"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1 text-[10px] text-slate-500">
                    <span>Supports:</span>
                    <span className="text-slate-400">Company Websites</span> •
                    <span className="text-slate-400">Notion Public Docs</span> •
                    <span className="text-slate-400">Google Docs (/pub)</span> •
                    <span className="text-slate-400">GitHub Markdown</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Custom Title <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={crawlTitle}
                    onChange={(e) => setCrawlTitle(e.target.value)}
                    placeholder="Auto-detected from page if left blank"
                    className="w-full bg-[#080a0f] border border-dark-border rounded-xl px-3 py-2.5 text-base sm:text-xs text-white placeholder-slate-500 outline-none touch-manipulation"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={crawling}
                    className="px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer touch-manipulation"
                  >
                    {crawling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Crawling & Indexing…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Crawl & Train RAG</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Mode 2: Manual Text */}
            {mode === "text" && (
              <form onSubmit={handleTextSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Document Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Return Policy & FAQs"
                    className="w-full bg-[#080a0f] border border-dark-border rounded-xl px-3 py-2.5 text-base sm:text-xs text-white outline-none touch-manipulation"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-semibold">Content / Text</label>
                  <textarea
                    rows={6}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste FAQ questions, answers, product specs..."
                    className="w-full bg-[#080a0f] border border-dark-border rounded-xl p-3 text-base sm:text-xs text-white font-mono leading-relaxed outline-none touch-manipulation"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingDoc}
                    className="px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 cursor-pointer touch-manipulation"
                  >
                    {addingDoc ? "Saving…" : "Add to Knowledge Base"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
