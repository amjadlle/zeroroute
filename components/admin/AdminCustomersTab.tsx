"use client";

import { useState } from "react";
import { 
  Users, Search, Key, CheckCircle2, PauseCircle, RefreshCw, Trash2, 
  Eye, EyeOff, Plus, Copy, Check, Globe, X, Bot, Shield, Code, Sparkles
} from "lucide-react";

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
  allowed_domains?: string;
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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCompany, setFormCompany] = useState("");
  const [formDomains, setFormDomains] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formColor, setFormColor] = useState("#ef4444");
  const [formLogo, setFormLogo] = useState("");
  const [formGreeting, setFormGreeting] = useState("Hi! 👋 How can I help you today?");
  const [formPrompts, setFormPrompts] = useState("What services do you offer?, How do I get started?, What are your pricing plans?");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBot, setCreatedBot] = useState<{
    bot_id: string;
    key: string;
    company: string;
    bot_title: string;
    color: string;
    logo?: string;
    greeting: string;
    prompts: string;
    domains: string;
  } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q)) ||
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.bot_id && c.bot_id.toLowerCase().includes(q)) ||
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

  const handleCreateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "POST",
        headers: getAdminHeaders(),
        body: JSON.stringify({
          company: formCompany.trim() || "My Website",
          name: formCompany.trim() || "Admin Bot",
          bot_title: formTitle.trim() || `${formCompany || "ZeroRoute"} AI Assistant`,
          website: formDomains.split(",")[0]?.trim() || "",
          allowed_domains: formDomains.trim(),
          greeting: formGreeting.trim(),
          prompts: formPrompts.split(",").map(p => p.trim()).filter(Boolean),
        }),
      });

      const data = await res.json();
      if (data.success && data.bot) {
        setCreatedBot({
          bot_id: data.bot.bot_id,
          key: data.bot.key,
          company: formCompany.trim() || "My Website",
          bot_title: formTitle.trim() || `${formCompany || "ZeroRoute"} AI Assistant`,
          color: formColor,
          logo: formLogo.trim(),
          greeting: formGreeting.trim(),
          prompts: formPrompts.trim(),
          domains: formDomains.trim()
        });
        await onRefresh();
      } else {
        alert(data.error || "Failed to create bot");
      }
    } catch (err) {
      console.error("Create bot error:", err);
      alert("Network error creating bot");
    } finally {
      setIsSubmitting(false);
    }
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

  const generateEmbedCode = (botId: string, title?: string, color?: string, logo?: string, greeting?: string, prompts?: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://zeroroute.mapki.in";
    const logoAttr = logo ? `\n  data-logo="${logo}"` : "";
    const greetingAttr = greeting ? `\n  data-greeting="${greeting}"` : "";
    const promptsAttr = prompts ? `\n  data-prompts="${prompts}"` : "";
    
    return `<script
  src="${origin}/widget.js"
  data-bot-id="${botId}"
  data-title="${title || "AI Assistant"}"
  data-color="${color || "#ef4444"}"${logoAttr}${greetingAttr}${promptsAttr}
  defer>
</script>`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">Subscriber & Bot Directory ({customers.length})</h2>
          </div>
          <p className="text-xs text-slate-400">
            Create unlimited bots for your personal websites, manage tenants, configure domain security, and monitor requests.
          </p>
        </div>

        {/* Search and Create button */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email, bot, key…"
              className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 rounded-xl pl-10 pr-4 py-2 text-base sm:text-xs text-white placeholder-slate-500 outline-none transition-all min-h-[44px]"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setCreatedBot(null);
              setIsModalOpen(true);
            }}
            className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Unlimited Bot</span>
          </button>
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filtered.map(c => {
          const isRevealed = Boolean(revealedKeys[c.id]);
          const maskedKey = isRevealed ? c.key : `${c.key.slice(0, 10)}••••••••••••••••${c.key.slice(-4)}`;
          const isLoading = actionLoading === c.id;
          const isUnlimited = c.monthly_limit >= 999999999;
          const percent = isUnlimited ? 0 : Math.min(100, Math.round((c.monthly_requests / (c.monthly_limit || 2000)) * 100));

          return (
            <div
              key={c.id}
              className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4 hover:border-white/20 transition-all"
            >
              {/* Row Top: Info & Status */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">{c.name || "Subscriber"}</span>
                    <span className="text-xs text-slate-400 font-mono">({c.email})</span>
                    {c.company && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5">
                        {c.company}
                      </span>
                    )}
                    {isUnlimited && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Unlimited Lifetime
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 flex-wrap">
                    <span>Bot ID: <strong className="text-slate-300">{c.bot_id || "None"}</strong></span>
                    <span>•</span>
                    <span>Created: {new Date(c.created_at).toLocaleDateString()}</span>
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
                  <div className="flex items-center gap-2 bg-[#080a0f] border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 min-h-[44px]">
                    <Key className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span className="truncate flex-1">{maskedKey}</span>
                    <button
                      type="button"
                      onClick={() => toggleRevealKey(c.id)}
                      className="text-slate-500 hover:text-white p-2 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                      title={isRevealed ? "Hide key" : "Reveal key"}
                      aria-label={isRevealed ? "Hide key" : "Reveal key"}
                    >
                      {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Usage meter */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-400">Monthly Usage</span>
                    <span className="font-mono text-slate-300 font-bold">
                      {isUnlimited 
                        ? `${c.monthly_requests.toLocaleString()} requests (No limit)`
                        : `${c.monthly_requests.toLocaleString()} / ${c.monthly_limit.toLocaleString()} (${percent}%)`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-[#080a0f] h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isUnlimited ? "bg-emerald-500" : percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: isUnlimited ? "100%" : `${percent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Row Bottom: Actions */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-2 text-xs flex-wrap">
                {c.bot_id && (
                  <button
                    type="button"
                    onClick={() => {
                      const snippet = generateEmbedCode(c.bot_id!, c.bot_title || c.company || "AI Assistant");
                      navigator.clipboard.writeText(snippet);
                      alert("Embed snippet copied to clipboard!");
                    }}
                    className="px-3.5 py-2 min-h-[44px] rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation flex-1 sm:flex-initial"
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Copy Embed Tag</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRotateKey(c)}
                  className="px-3.5 py-2 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation flex-1 sm:flex-initial"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rotate Key</span>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleToggleStatus(c)}
                  className="px-3.5 py-2 min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation flex-1 sm:flex-initial"
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
                  className="px-3.5 py-2 min-h-[44px] rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 touch-manipulation flex-1 sm:flex-initial"
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

      {/* CREATE BOT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0f121d] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create Unlimited Admin Bot</h3>
                  <p className="text-xs text-slate-400">Provision a lifetime free bot for your personal websites with custom domain protection.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Created Bot Result View */}
            {createdBot ? (
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-emerald-300">Bot Created & Activated!</h4>
                    <p className="text-xs text-emerald-400/80">
                      Your bot is active with <strong>Unlimited Lifetime Quota</strong>. Paste the code snippet below before the closing <code>&lt;/body&gt;</code> tag of your website.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-red-400" /> Embed Script
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const snippet = generateEmbedCode(
                          createdBot.bot_id,
                          createdBot.bot_title,
                          createdBot.color,
                          createdBot.logo,
                          createdBot.greeting,
                          createdBot.prompts
                        );
                        navigator.clipboard.writeText(snippet);
                        setCopiedSnippet(true);
                        setTimeout(() => setCopiedSnippet(false), 2000);
                      }}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white flex items-center gap-1 transition-colors"
                    >
                      {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSnippet ? "Copied!" : "Copy Code"}</span>
                    </button>
                  </div>
                  <pre className="p-4 rounded-xl bg-[#080a0f] border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                    {generateEmbedCode(
                      createdBot.bot_id,
                      createdBot.bot_title,
                      createdBot.color,
                      createdBot.logo,
                      createdBot.greeting,
                      createdBot.prompts
                    )}
                  </pre>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">Bot Details:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                    <div>Bot ID: <span className="text-white font-bold">{createdBot.bot_id}</span></div>
                    <div>Domain Protection: <span className="text-white">{createdBot.domains || "Any Origin"}</span></div>
                    <div className="col-span-2 truncate">API Key: <span className="text-white">{createdBot.key}</span></div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCreatedBot(null);
                      setFormCompany("");
                      setFormDomains("");
                      setFormTitle("");
                      setFormLogo("");
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                  >
                    Create Another Bot
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Create Form */
              <form onSubmit={handleCreateBot} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Website / Project Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. My Portfolio, TechBlog"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      className="w-full bg-[#080a0f] border border-white/10 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Allowed Domains (Whitelist)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. mywebsite.com, blog.mywebsite.com, localhost:3000"
                      value={formDomains}
                      onChange={(e) => setFormDomains(e.target.value)}
                      className="w-full bg-[#080a0f] border border-white/10 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    />
                    <p className="text-[10px] text-slate-500">
                      Comma-separated domains. Requests from other sites or raw tools without Origin will be blocked with 403 Forbidden.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Widget Header Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Support Assistant, Brand AI"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full bg-[#080a0f] border border-white/10 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Brand Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-10 h-10 rounded-xl bg-transparent border border-white/10 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                        className="w-full bg-[#080a0f] border border-white/10 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Custom Logo Image URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://yourwebsite.com/logo.png"
                    value={formLogo}
                    onChange={(e) => setFormLogo(e.target.value)}
                    className="w-full bg-[#080a0f] border border-white/10 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-500">
                    If left blank, no avatar circle will be shown, keeping the widget clean and modern.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Welcome Greeting</label>
                  <input
                    type="text"
                    value={formGreeting}
                    onChange={(e) => setFormGreeting(e.target.value)}
                    className="w-full bg-[#080a0f] border border-white/10 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Starter Questions (Comma-separated)</label>
                  <input
                    type="text"
                    value={formPrompts}
                    onChange={(e) => setFormPrompts(e.target.value)}
                    className="w-full bg-[#080a0f] border border-white/10 focus:border-red-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Provisioning...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Create Bot (Unlimited)</span>
                      </>
                    )}
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
