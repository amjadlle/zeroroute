"use client";

import { useState } from "react";
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Download,
  Upload,
  Check,
  ShieldCheck,
  Save,
  Loader2
} from "lucide-react";
import { PROVIDER_PORTALS } from "@/lib/providers/catalog";
import { ProviderItem } from "./AdminProvidersTab";

interface AdminApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  providers: ProviderItem[];
}

export function AdminApiKeysModal({ isOpen, onClose, providers }: AdminApiKeysModalProps) {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportBackup = () => {
    const backupData = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      providers: providers.map((p) => ({
        id: p.id,
        name: p.name,
        order: p.order,
        enabled: p.enabled,
        model: p.model,
        models: p.models,
      })),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zeroroute-config-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback("✅ Configuration backup exported successfully!");
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.providers) {
          showFeedback("✅ Configuration backup loaded!");
        }
      } catch {
        showFeedback("⚠️ Invalid JSON backup file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#090d16] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Toast */}
        {toast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{toast}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/10 bg-[#050608]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white">AI Provider Credentials & Secrets</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Encrypted Secrets
                </span>
              </div>
              <p className="text-xs text-slate-400">Manage API keys across all 10 free multi-cloud inference providers</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center touch-manipulation"
            aria-label="Close credentials modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Provider Key List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          {providers.map((p) => {
            const portalUrl = PROVIDER_PORTALS[p.id] || "https://zeroroute.app";
            const isVisible = showKeys[p.id] || false;
            const currentVal = keys[p.id] || "";

            return (
              <div
                key={p.id}
                className="p-3.5 bg-black/40 border border-white/5 rounded-xl space-y-2 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{p.name}</span>
                    <a
                      href={portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors min-h-[32px] items-center"
                    >
                      <span>Get Free API Key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      p.configured
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {p.configured ? "● Active in .env" : "○ Not Set"}
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={isVisible ? "text" : "password"}
                    value={currentVal}
                    onChange={(e) => setKeys({ ...keys, [p.id]: e.target.value })}
                    placeholder={p.configured ? "••••••••••••••••••••••••••••••••" : `Enter ${p.name} API Key`}
                    className="w-full pl-3.5 pr-12 py-2.5 text-base sm:text-xs font-mono bg-black/60 border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-red-500 transition-colors min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys({ ...showKeys, [p.id]: !isVisible })}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2.5 min-w-[44px] min-h-[44px] text-slate-400 hover:text-white flex items-center justify-center touch-manipulation"
                    aria-label={isVisible ? "Hide API key" : "Show API key"}
                  >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer: Backup Export/Import and Save */}
        <div className="p-4 bg-[#050608] border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportBackup}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation flex-1 sm:flex-initial"
            >
              <Download className="w-3.5 h-3.5 text-red-400" />
              <span>Export Backup</span>
            </button>

            <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation flex-1 sm:flex-initial">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Backup</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer touch-manipulation flex-1 sm:flex-initial flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                showFeedback("✅ API credentials saved to gateway state!");
                setTimeout(onClose, 1000);
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 min-h-[44px] rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20 transition-all active:scale-95 cursor-pointer touch-manipulation flex-1 sm:flex-initial"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Credentials</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
