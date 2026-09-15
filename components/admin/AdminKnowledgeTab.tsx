"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  RotateCw,
  FileUp,
  UploadCloud,
  Edit3,
  Globe,
  Download,
  Layers,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";

interface KnowledgeDoc {
  id: string;
  customer_key: string;
  title: string;
  type: string;
  content: string;
  char_count: number;
  source_url?: string;
  created_at: number;
}

export function AdminKnowledgeTab() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Ingestion
  const [rawTitle, setRawTitle] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [savingSnippet, setSavingSnippet] = useState(false);

  // URL Crawler
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [crawlStatus, setCrawlStatus] = useState<string | null>(null);

  // Drag & drop status
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const getAdminHeaders = () => {
    const adminKey = typeof window !== "undefined" ? localStorage.getItem("admin_key") || "" : "";
    return {
      "Content-Type": "application/json",
      "Authorization": adminKey ? `Bearer ${adminKey}` : "",
    };
  };

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge", {
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (data.documents) {
        setDocs(data.documents);
      }
    } catch {
      showToast("⚠️ Could not load knowledge documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleSaveSnippet = async () => {
    if (!rawContent.trim()) {
      showToast("⚠️ Content cannot be empty");
      return;
    }
    setSavingSnippet(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          title: rawTitle.trim() || "Knowledge Snippet",
          content: rawContent.trim(),
          type: "manual_text",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRawTitle("");
        setRawContent("");
        showToast("✅ Knowledge snippet indexed!");
        await fetchDocs();
      } else {
        showToast(`❌ Failed: ${data.error}`);
      }
    } catch (e: any) {
      showToast(`❌ Error: ${e.message}`);
    } finally {
      setSavingSnippet(false);
    }
  };

  const handleCrawlUrl = async () => {
    if (!crawlUrl.trim()) {
      showToast("⚠️ Please enter a valid URL to crawl");
      return;
    }
    setCrawling(true);
    setCrawlStatus("Crawling & extracting clean markdown…");
    try {
      const res = await fetch("/api/knowledge/crawl", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({ url: crawlUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCrawlUrl("");
        setCrawlStatus("✅ Page crawled & indexed successfully!");
        showToast("🎉 URL crawled & indexed into knowledge base!");
        await fetchDocs();
      } else {
        setCrawlStatus(`❌ Crawl Failed: ${data.error}`);
      }
    } catch (e: any) {
      setCrawlStatus(`❌ Exception: ${e.message}`);
    } finally {
      setCrawling(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadStatus(`Processing ${file.name}…`);
    try {
      const text = await file.text();
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          title: file.name,
          content: text,
          type: "file_upload",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setUploadStatus(`✅ Indexed ${file.name} (${text.length} chars)`);
        showToast(`✅ File ${file.name} uploaded and indexed!`);
        await fetchDocs();
      } else {
        setUploadStatus(`❌ Failed: ${data.error}`);
      }
    } catch (e: any) {
      setUploadStatus(`❌ Upload Error: ${e.message}`);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      const res = await fetch(`/api/knowledge?id=${id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      if (res.ok) {
        showToast("🗑️ Document deleted.");
        setDocs((prev) => prev.filter((d) => d.id !== id));
      }
    } catch {
      showToast("⚠️ Could not delete document.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Glass Container */}
      <div className="bg-[#090d16] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10.5px] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart BM25 Semantic RAG</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-red-500" />
              <span>Knowledge Base & Document Training</span>
            </h2>
            <p className="text-xs text-slate-400">
              Upload company documents or crawl website URLs. ZeroRoute automatically chunks and indexes content to deliver 0-hallucination answers.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDocs}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white border border-white/10 rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50 touch-manipulation w-full sm:w-auto"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-400" : ""}`} />
            <span>Refresh Docs</span>
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* Left Column: Dropzone & Raw Text Ingestion */}
          <div className="space-y-5">
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Documents (.md, .txt, .json)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Drag and drop business documents, pricing lists, catalogs, or policy files.
              </p>
            </div>

            {/* Dropzone */}
            <label className="border-2 border-dashed border-white/10 hover:border-red-500/50 bg-black/40 hover:bg-red-500/[0.02] rounded-2xl p-7 text-center transition-all cursor-pointer block space-y-3 touch-manipulation">
              <input
                type="file"
                accept=".md,.txt,.json,.markdown"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-red-600/20 to-rose-600/10 border border-red-500/30 flex items-center justify-center text-red-400">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Click to browse or drag & drop files</p>
                <p className="text-[11px] text-slate-400 mt-1">Supports Markdown (.md), Plain Text (.txt), and JSON</p>
              </div>
              {uploadStatus && (
                <span className="inline-block text-[11px] font-mono text-emerald-400 font-semibold">{uploadStatus}</span>
              )}
            </label>

            {/* Raw Text Ingestion Box */}
            <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Paste Custom Text / FAQs Directly</span>
                </label>
                <button
                  type="button"
                  onClick={handleSaveSnippet}
                  disabled={savingSnippet}
                  className="px-4 py-2 min-h-[44px] text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl shadow-md shadow-red-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 touch-manipulation w-full sm:w-auto"
                >
                  {savingSnippet ? "Indexing…" : "Save Snippet →"}
                </button>
              </div>

              <input
                type="text"
                value={rawTitle}
                onChange={(e) => setRawTitle(e.target.value)}
                placeholder="Document Title (e.g. Refund Policy, Company Pricing)"
                className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500"
              />
              <textarea
                rows={3}
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Paste knowledge content, company policies, or service specs here..."
                className="w-full px-3.5 py-2.5 text-base sm:text-xs bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500 font-mono resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* Right Column: URL Crawler & Active Sources */}
          <div className="space-y-5">
            
            {/* Website URL Crawler */}
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>1-Click URL Crawler</span>
              </h3>
              <p className="text-[11px] text-slate-400">Scrape live documentation or pricing pages into clean markdown knowledge.</p>
            </div>

            <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCrawlUrl()}
                  placeholder="e.g. https://mapki.in/docs or https://mapki.in/pricing"
                  className="flex-1 px-3.5 py-2.5 text-base sm:text-xs bg-black/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={handleCrawlUrl}
                  disabled={crawling}
                  className="px-5 py-2.5 min-h-[44px] text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-red-500/20 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation"
                >
                  {crawling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>{crawling ? "Crawling…" : "Crawl URL"}</span>
                </button>
              </div>
              {crawlStatus && <span className="block text-[11px] font-mono text-amber-400">{crawlStatus}</span>}
            </div>

            {/* Active Sources List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>Active Knowledge Sources</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                    {docs.length}
                  </span>
                </h4>
              </div>

              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-black/40 border border-white/5 rounded-xl flex items-center justify-between gap-3 hover:border-white/10 transition-colors"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span className="font-bold text-xs text-white truncate" title={doc.title}>
                          {doc.title}
                        </span>
                        <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                          {doc.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{doc.content}</p>
                      <div className="text-[10px] font-mono text-slate-500">
                        {doc.char_count} chars • {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-2 min-w-[44px] min-h-[44px] text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center justify-center touch-manipulation"
                      title="Delete document"
                      aria-label="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {docs.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-white/10 rounded-2xl">
                    No knowledge documents uploaded yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
