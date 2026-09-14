"use client";

import { useState } from "react";
import { Users, Search, Key, CheckCircle2, PauseCircle, XCircle, RefreshCw, Trash2, Shield, Eye, EyeOff } from "lucide-react";

export interface CustomerAdminItem {
  id: string;
  key: string;
  email: string;
  name?: string;
  company?: string;
  website?: string;
  bot_title?: string;
  bot_role?: string;
  status: string;
  subscription_expires?: number;
  monthly_requests: number;
  monthly_limit: number;
  bot_id?: string;
  created_at: number;
}

interface AdminCustomersTabProps {
  customers: CustomerAdminItem[];
  onRefresh: () => Promise<void>;
}

export function AdminCustomersTab({ customers, onRefresh }: AdminCustomersTabProps) {
  const [search, setSearch] = useState("");
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      c.key.toLowerCase().includes(q)
    );
  });

  const toggleRevealKey = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getAdminHeaders = () => {
    const adminKey = typeof window !== "undefined" ? localStorage.getItem("admin_key") || "" : "";
    return {
      "Content-Type": "application/json",
      "Authorization": adminKey ? `Bearer ${adminKey}` : "",
    };
  };

  const handleToggleStatus = async (customer: CustomerAdminItem) => {
    const nextStatus = customer.status === "active" ? "paused" : "active";
    setActionLoading(customer.id);
    try {
      await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ id: customer.id, status: nextStatus }),
      });
      await onRefresh();
    } catch (e) {
      console.error("Status toggle error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRotateKey = async (customer: CustomerAdminItem) => {
    if (!confirm(`Rotate master API key for ${customer.email}?`)) return;
    setActionLoading(customer.id);
    try {
      await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: getAdminHeaders(),
        body: JSON.stringify({ id: customer.id, rotateKey: true }),
      });
      await onRefresh();
    } catch (e) {
      console.error("Key rotation error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCustomer = async (customer: CustomerAdminItem) => {
    if (!confirm(`Permanently delete subscriber ${customer.email} and revoke all keys?`)) return;
    setActionLoading(customer.id);
    try {
      await fetch(`/api/admin/customers?id=${customer.id}`, {
        method: "DELETE",
        headers: getAdminHeaders(),
      });
      await onRefresh();
    } catch (e) {
      console.error("Customer deletion error:", e);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Subscriber Directory ({customers.length})</h2>
          </div>
          <p className="text-xs text-slate-400">
            Manage paying tenants, monitor request limits, rotate subscriber master keys, and control access status.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, company, key…"
            className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filtered.map(c => {
          const isRevealed = Boolean(revealedKeys[c.id]);
          const maskedKey = isRevealed ? c.key : `${c.key.slice(0, 10)}••••••••••••••••${c.key.slice(-4)}`;
          const isLoading = actionLoading === c.id;

          const percent = Math.min(100, Math.round((c.monthly_requests / (c.monthly_limit || 2000)) * 100));

          return (
            <div
              key={c.id}
              className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4 hover:border-white/20 transition-all"
            >
              {/* Row Top: Info & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{c.name || "Subscriber"}</span>
                    <span className="text-xs text-slate-400 font-mono">({c.email})</span>
                    {c.company && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5">
                        {c.company}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Bot ID: <span className="text-slate-300">{c.bot_id || "None"}</span> • Created: {new Date(c.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Status Pill */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      c.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : c.status === "paused"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/10 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {c.status === "active" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                    <span className="capitalize">{c.status}</span>
                  </span>
                </div>
              </div>

              {/* Row Middle: Key & Usage Meter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                {/* Master Key Card */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 block">Master Subscriber Key</label>
                  <div className="flex items-center gap-2 bg-[#080a0f] border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-slate-300">
                    <Key className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate flex-1">{maskedKey}</span>
                    <button
                      type="button"
                      onClick={() => toggleRevealKey(c.id)}
                      className="text-slate-500 hover:text-white"
                      title={isRevealed ? "Hide key" : "Reveal key"}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Usage meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-400">Monthly Usage</span>
                    <span className="font-mono text-slate-300 font-bold">
                      {c.monthly_requests.toLocaleString()} / {c.monthly_limit.toLocaleString()} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#080a0f] h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row Bottom: Actions */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRotateKey(c)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotate Key</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleToggleStatus(c)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {c.status === "active" ? (
                    <>
                      <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Suspend</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Activate</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleDeleteCustomer(c)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            No subscribers matching your search filter.
          </div>
        )}
      </div>
    </div>
  );
}
