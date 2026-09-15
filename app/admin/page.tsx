"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminProvidersTab, ProviderItem } from "@/components/admin/AdminProvidersTab";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminPlaygroundTab } from "@/components/admin/AdminPlaygroundTab";
import { AdminLogsTab, GlobalLogItem } from "@/components/admin/AdminLogsTab";
import { AdminKnowledgeTab } from "@/components/admin/AdminKnowledgeTab";
import { AdminCustomersTab, CustomerAdminItem } from "@/components/admin/AdminCustomersTab";
import { AdminApiKeysModal } from "@/components/admin/AdminApiKeysModal";
import {
  SlidersHorizontal,
  BarChart3,
  Terminal,
  Activity,
  BookOpen,
  Users,
  Loader2
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "providers" | "analytics" | "playground" | "logs" | "knowledge" | "customers"
  >("providers");
  const [loading, setLoading] = useState(true);
  const [showKeysModal, setShowKeysModal] = useState(false);

  const [providersList, setProvidersList] = useState<ProviderItem[]>([]);
  const [customersList, setCustomersList] = useState<CustomerAdminItem[]>([]);
  const [logsList, setLogsList] = useState<GlobalLogItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const getAdminHeaders = () => {
    const adminKey = typeof window !== "undefined" ? localStorage.getItem("admin_key") || "" : "";
    return {
      "Content-Type": "application/json",
      "Authorization": adminKey ? `Bearer ${adminKey}` : "",
    };
  };

  const fetchAdminData = async () => {
    try {
      const headers = getAdminHeaders();
      const [provRes, custRes, logsRes] = await Promise.all([
        fetch("/api/admin/providers", { headers }),
        fetch("/api/admin/customers", { headers }),
        fetch("/api/admin/logs", { headers }),
      ]);

      if (provRes.status === 401 || custRes.status === 401) {
        router.replace("/login");
        return;
      }

      const provData = await provRes.json();
      const custData = await custRes.json();
      const logsData = await logsRes.json();

      if (provData.providers) setProvidersList(provData.providers);
      if (custData.customers) setCustomersList(custData.customers);
      if (logsData.logs) setLogsList(logsData.logs);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      const headers = getAdminHeaders();
      const [provRes, custRes, logsRes] = await Promise.all([
        fetch("/api/admin/providers", { headers }),
        fetch("/api/admin/customers", { headers }),
        fetch("/api/admin/logs", { headers }),
      ]);
      const provData = await provRes.json();
      const custData = await custRes.json();
      const logsData = await logsRes.json();

      if (provData.providers) setProvidersList(provData.providers);
      if (custData.customers) setCustomersList(custData.customers);
      if (logsData.logs) setLogsList(logsData.logs);
    } catch {}
    setRefreshing(false);
  };

  const handleUpdateProviders = async (updated: ProviderItem[]) => {
    try {
      const res = await fetch("/api/admin/providers", {
        method: "PUT",
        headers: getAdminHeaders(),
        body: JSON.stringify({ providers: updated }),
      });
      const data = await res.json();
      if (data.providers) setProvidersList(data.providers);
    } catch (e) {
      console.error("Failed to update providers:", e);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
        <span>Loading ZeroRoute Master Admin Console…</span>
      </div>
    );
  }

  const activeProvidersCount = providersList.filter((p) => p.enabled && p.configured).length;
  const totalVolume = customersList.reduce((acc, c) => acc + (c.monthly_requests || 0), 0) + logsList.length;

  const tabs = [
    { id: "providers", label: "Provider Routing", icon: SlidersHorizontal },
    { id: "analytics", label: "Analytics & Quotas", icon: BarChart3 },
    { id: "playground", label: "Playground", icon: Terminal },
    { id: "logs", label: `Logs & Failovers (${logsList.length})`, icon: Activity },
    { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
    { id: "customers", label: `Subscribers & Bots (${customersList.length})`, icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col font-sans selection:bg-red-500/30 selection:text-white pb-12">
      <AdminHeader
        totalCustomers={customersList.length}
        activeProviders={activeProvidersCount}
        totalProvidersCount={providersList.length}
        totalRequests={totalVolume}
        onLogout={handleLogout}
        onOpenKeysModal={() => setShowKeysModal(true)}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-none text-xs font-semibold -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x">
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
                    ? "bg-red-600 text-white font-bold shadow-lg shadow-red-600/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Provider Routing */}
        {activeTab === "providers" && (
          <AdminProvidersTab providers={providersList} onUpdateProviders={handleUpdateProviders} />
        )}

        {/* Tab 2: Analytics & Multi-Tenant Quotas */}
        {activeTab === "analytics" && (
          <AdminAnalyticsTab
            providers={providersList}
            logs={logsList}
            onRefresh={handleRefreshData}
            loading={refreshing}
          />
        )}

        {/* Tab 3: Live Playground */}
        {activeTab === "playground" && (
          <AdminPlaygroundTab providers={providersList} />
        )}

        {/* Tab 4: Logs & Failovers */}
        {activeTab === "logs" && (
          <AdminLogsTab logs={logsList} onRefresh={handleRefreshData} loading={refreshing} />
        )}

        {/* Tab 5: Knowledge Base */}
        {activeTab === "knowledge" && (
          <AdminKnowledgeTab customers={customersList} />
        )}

        {/* Tab 6: Subscribers & Bots Directory */}
        {activeTab === "customers" && (
          <AdminCustomersTab customers={customersList} onRefresh={handleRefreshData} />
        )}
      </div>

      {/* API Keys Credentials Modal */}
      <AdminApiKeysModal
        isOpen={showKeysModal}
        onClose={() => setShowKeysModal(false)}
        providers={providersList}
      />
    </div>
  );
}
