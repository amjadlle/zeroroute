"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OverviewTab } from "@/components/dashboard/OverviewTab";
import { WidgetTab } from "@/components/dashboard/WidgetTab";
import { KnowledgeTab, KnowledgeDoc } from "@/components/dashboard/KnowledgeTab";
import { PersonaTab } from "@/components/dashboard/PersonaTab";
import { DocsTab } from "@/components/dashboard/DocsTab";
import { BillingModal } from "@/components/dashboard/BillingTab";
import { Activity, Bot, BookOpen, SlidersHorizontal, Code2, Loader2 } from "lucide-react";

interface CustomerProfile {
  id: string;
  key: string;
  email: string;
  name: string;
  company?: string;
  website?: string;
  bot_title: string;
  bot_role: string;
  tone: string;
  greeting: string;
  prompts: string[];
  persona: string;
  status: string;
  subscription_expires?: number;
  days_remaining: number;
  monthly_requests: number;
  monthly_limit: number;
  bot_id: string;
  knowledge_docs_count: number;
  is_admin?: boolean;
}

export default function AppDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "widget" | "knowledge" | "persona" | "docs">("overview");
  const [billingOpen, setBillingOpen] = useState(false);

  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [rotatingKey, setRotatingKey] = useState(false);
  const [addingDoc, setAddingDoc] = useState(false);
  const [savingPersona, setSavingPersona] = useState(false);

  const fetchProfile = async () => {
    try {
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const queryKey = urlParams?.get("key");
      const headers: Record<string, string> = {};
      if (queryKey) {
        headers["Authorization"] = `Bearer ${queryKey}`;
      }

      const res = await fetch("/api/customer/profile", { headers });
      if (!res.ok) {
        // Use replace to prevent redirect loop in browser history
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (data.customer) {
        setProfile(data.customer);
      }
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async () => {
    try {
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const queryKey = urlParams?.get("key");
      const headers: Record<string, string> = {};
      if (queryKey) {
        headers["Authorization"] = `Bearer ${queryKey}`;
      }

      const res = await fetch("/api/knowledge", { headers });
      const data = await res.json();
      if (data.documents) {
        setDocs(data.documents);
      }
    } catch {}
  };

  useEffect(() => {
    Promise.all([fetchProfile(), fetchDocs()]);
  }, []);

  const handleRotateKey = async () => {
    if (!confirm("Are you sure you want to rotate your API key? All applications using the old key will need to be updated.")) return;
    setRotatingKey(true);
    try {
      const res = await fetch("/api/customer/key/regenerate", { method: "POST" });
      const data = await res.json();
      if (data.key && profile) {
        setProfile({ ...profile, key: data.key });
      }
    } catch {}
    setRotatingKey(false);
  };

  const handleAddDoc = async (title: string, content: string) => {
    setAddingDoc(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, type: "manual_text" }),
      });
      if (res.ok) {
        await fetchDocs();
        await fetchProfile();
      }
    } catch {}
    setAddingDoc(false);
  };

  const handleDeleteDoc = async (id: string) => {
    if (!confirm("Delete this document from knowledge base?")) return;
    try {
      await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
      await fetchDocs();
      await fetchProfile();
    } catch {}
  };

  const handleSavePersona = async (data: {
    bot_title: string;
    bot_role: string;
    tone: string;
    greeting: string;
    persona: string;
  }) => {
    setSavingPersona(true);
    try {
      const res = await fetch("/api/customer/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchProfile();
      }
    } catch {}
    setSavingPersona(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
        <span>Loading subscriber console…</span>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview & Telemetry", icon: Activity },
    { id: "widget", label: "Chatbot & Live Test", icon: Bot },
    { id: "knowledge", label: `Knowledge Base (${docs.length})`, icon: BookOpen },
    { id: "persona", label: "Persona & Prompts", icon: SlidersHorizontal },
    { id: "docs", label: "API Quickstart", icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-white">
      <DashboardHeader
        name={profile?.name}
        email={profile?.email}
        isAdmin={Boolean(profile?.is_admin)}
        onLogout={handleLogout}
        onOpenBilling={() => setBillingOpen(true)}
      />

      <div className="flex-1 max-w-[1700px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-dark-border scrollbar-none text-xs font-semibold -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl transition-all whitespace-nowrap cursor-pointer touch-manipulation shrink-0 ${
                  isSelected
                    ? "bg-red-600/15 text-red-400 border border-red-500/30 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        {activeTab === "overview" && (
          <OverviewTab
            apiKey={profile?.key || "zr_live_demo"}
            botId={profile?.bot_id || "bot_live_demo"}
            monthlyRequests={profile?.monthly_requests || 0}
            monthlyLimit={profile?.monthly_limit || 2000}
            daysRemaining={profile?.days_remaining || 0}
            onRotateKey={handleRotateKey}
            rotatingKey={rotatingKey}
          />
        )}

        {activeTab === "widget" && (
          <WidgetTab
            botTitle={profile?.bot_title || "ZeroRoute AI"}
            greeting={profile?.greeting || "Hi there!"}
            botId={profile?.bot_id || "bot_live_demo"}
            prompts={profile?.prompts || []}
            apiKey={profile?.key}
          />
        )}

        {activeTab === "knowledge" && (
          <KnowledgeTab
            docs={docs}
            onAddDoc={handleAddDoc}
            onDeleteDoc={handleDeleteDoc}
            onRefresh={fetchDocs}
            addingDoc={addingDoc}
          />
        )}

        {activeTab === "persona" && (
          <PersonaTab
            initialBotTitle={profile?.bot_title || "ZeroRoute AI"}
            initialBotRole={profile?.bot_role || "AI Assistant"}
            initialTone={profile?.tone || "helpful and concise"}
            initialGreeting={profile?.greeting || "Hi there! How can I help you today?"}
            initialPersona={profile?.persona || ""}
            onSave={handleSavePersona}
            saving={savingPersona}
          />
        )}

        {activeTab === "docs" && (
          <DocsTab
            apiKey={profile?.key || "zr_live_demo"}
            botId={profile?.bot_id || "bot_live_demo"}
            initialBotTitle={profile?.bot_title || "ZeroRoute AI"}
            initialGreeting={profile?.greeting || "Hi! 👋 How can I help you today?"}
            initialPrompts={profile?.prompts || []}
          />
        )}
      </div>

      {/* Plan & Billing Modal */}
      <BillingModal
        isOpen={billingOpen}
        onClose={() => setBillingOpen(false)}
        daysRemaining={profile?.days_remaining || 0}
        monthlyRequests={profile?.monthly_requests || 0}
        monthlyLimit={profile?.monthly_limit || 2000}
        email={profile?.email}
      />
    </div>
  );
}
