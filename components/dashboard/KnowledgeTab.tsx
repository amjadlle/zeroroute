"use client";

import { useState } from "react";
import { 
  BookOpen, Plus, Trash2, Globe, FileText, Loader2, Sparkles, 
  ExternalLink, AlertCircle, UploadCloud, FileUp, RotateCw 
} from "lucide-react";

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
  const [mode, setMode] = useState<"crawl" | "text" | "upload">("upload");

  // Text state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Crawl state
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlTitle, setCrawlTitle] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [crawlError, setCrawlError] = useState("");

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Sync state
  const [syncingDocId, setSyncingDocId] = useState<string | null>(null);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onAddDoc(title || "Knowledge Document", content);
    setTitle("");
    setContent("");
    setModalOpen(false);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError("");
    setUploadStatus(`Reading ${file.name}…`);
    try {
      const text = await file.text();
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: file.name,
          content: text,
          type: "file_upload",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Failed to upload document.");
        setUploadStatus(null);
        return;
      }

      setUploadStatus(`✅ Indexed ${file.name} (${text.length} chars)`);
      if (onRefresh) await onRefresh();
      setTimeout(() => {
        setModalOpen(false);
        setUploadStatus(null);
      }, 1200);
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file.");
      setUploadStatus(null);
    } finally {
      setUploading(false);
    }
  };

  const handleCrawlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = crawlUrl.trim();
    if (!cleanUrl) return;
    
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

  const handleSyncDoc = async (doc: KnowledgeDoc) => {
    if (!doc.source_url) return;
    setSyncingDocId(doc.id);
    try {
      const res = await fetch("/api/knowledge/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: doc.source_url }),
      });
      if (res.ok && onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setSyncingDocId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Semantic Knowledge Base (RAG)</h3>
          <p className="text-xs text-slate-400">
            Upload files, paste FAQs, or crawl website URLs to train your chatbot with verified knowledge.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("upload");
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 shadow-sm cursor-pointer transition-all touch-manipulation"
          >
            <FileUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Upload Files</span>
          </button>
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
            Upload document files (.md, .txt, .json), crawl your website, or paste FAQs to enable zero-hallucination RAG for your assistant.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setMode("upload");
                setModalOpen(true);
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 cursor-pointer touch-manipulation flex items-center gap-1.5"
            >
              <FileUp className="w-4 h-4 text-emerald-400" />
              <span>Upload Document</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("crawl");
                setModalOpen(true);
              }}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 cursor-pointer touch-manipulation flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Crawl Website</span>
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
                    {isWeb ? (
                      <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                    ) : d.type === "file_upload" ? (
                      <FileUp className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white truncate max-w-[180px] sm:max-w-[240px]" title={d.title}>
                      {d.title}
                    </span>
                    <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 shrink-0">
                      {d.type}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    {d.source_url && (
                      <button
                        type="button"
                        onClick={() => handleSyncDoc(d)}
                        disabled={syncingDocId === d.id}
                        className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-400 hover:bg-white/5 transition-colors cursor-pointer touch-manipulation disabled:opacity-50"
                        title="Re-sync from URL"
                        aria-label="Re-sync from URL"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${syncingDocId === d.id ? "animate-spin text-blue-400" : ""}`} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onDeleteDoc(d.id)}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer touch-manipulation"
                      title="Delete Document"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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

      {/* Unified Add / Crawl / Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0c0e14] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            {/* Modal Tabs */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("upload")}
                  className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                    mode === "upload"
                      ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📁 Upload File (.md, .txt, .json)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("crawl")}
                  className={`px-3 py-2 min-h-[44px] rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                    mode === "crawl"
                      ? "bg-blue-600/20 text-blue-300 border border-blue-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🌐 Crawl URL
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
                  📝 Manual Text
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

            {/* Mode 1: Upload File */}
            {mode === "upload" && (
              <div className="space-y-4">
                {uploadError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <label className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 bg-black/40 hover:bg-emerald-500/[0.02] rounded-2xl p-8 text-center transition-all cursor-pointer block space-y-3 touch-manipulation">
                  <input
                    type="file"
                    accept=".md,.txt,.json,.markdown"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Click to browse or drop file here</p>
                    <p className="text-[11px] text-slate-400 mt-1">Supports Markdown (.md), Plain Text (.txt), and JSON</p>
                  </div>
                  {uploadStatus && (
                    <span className="inline-block text-xs font-mono text-emerald-400 font-semibold animate-pulse">
                      {uploadStatus}
                    </span>
                  )}
                </label>
              </div>
            )}

            {/* Mode 2: Crawl Web Page */}
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

            {/* Mode 3: Manual Text */}
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
