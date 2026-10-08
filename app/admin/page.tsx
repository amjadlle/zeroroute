"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [tabLoading, setTabLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);

  // Tab Data Cache
  const [providersList, setProvidersList] = useState<ProviderItem[]>([]);
  const [customersList, setCustomersList] = useState<CustomerAdminItem[]>([]);
  const [logsList, setLogsList] = useState<GlobalLogItem[]>([]);

  // Telemetry Aggregations
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    avgLatencyMs: 450,
    successRate: 100,
    cacheHits: 0,
    cacheSavings: "$0.0000",
    cacheHitRatio: 0
  });

  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set());

  const getAdminHeaders = useCallback(() => {
    const adminKey = typeof window !== "undefined" ? localStorage.getItem("admin_key") || "" : "";
    return {
      "Content-Type": "application/json",
      "Authorization": adminKey ? `Bearer ${adminKey}` : "",
    };
  }, []);

  // Fetch Providers Tab Data
  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/providers", { headers: getAdminHeaders() });
      if (res.status === 401) { router.replace("/login"); return; }
      const data = await res.json();
      if (data.providers) setProvidersList(data.providers);
      setLoadedTabs((prev) => new Set(prev).add("providers"));
    } catch (e) {
      console.error("Failed to load providers:", e);
    }
  }, [getAdminHeaders, router]);

  // Fetch Logs & Aggregated Telemetry
  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/logs?limit=200", { headers: getAdminHeaders() });
      if (res.status === 401) { router.replace("/login"); return; }
      const data = await res.json();
      if (data.logs) setLogsList(data.logs);
      if (data.metrics) setMetrics(data.metrics);
      setLoadedTabs((prev) => new Set(prev).add("logs"));
    } catch (e) {
      console.error("Failed to load logs:", e);
    }
  }, [getAdminHeaders, router]);

  // Fetch Customers & Bots
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/customers", { headers: getAdminHeaders() });
      if (res.status === 401) { router.replace("/login"); return; }
      const data = await res.json();
      if (data.customers) setCustomersList(data.customers);
      setLoadedTabs((prev) => new Set(prev).add("customers"));
    } catch (e) {
      console.error("Failed to load customers:", e);
    }
  }, [getAdminHeaders, router]);

  // Initial Load: Load core providers + telemetry metrics in parallel
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Promise.all([fetchProviders(), fetchLogs()]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [fetchProviders, fetchLogs]);

  // Lazy load tab data when switching
  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);

    if (tab === "customers" && !loadedTabs.has("customers")) {
      setTabLoading(true);
      await fetchCustomers();
      setTabLoading(false);
    } else if (tab === "logs" && !loadedTabs.has("logs")) {
      setTabLoading(true);
      await fetchLogs();
      setTabLoading(false);
    } else if (tab === "knowledge" && !loadedTabs.has("customers")) {
      setTabLoading(true);
      await fetchCustomers();
      setTabLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      if (activeTab === "logs" || activeTab === "analytics") {
        await fetchLogs();
      } else if (activeTab === "customers" || activeTab === "knowledge") {
        await fetchCustomers();
      } else {
        await fetchProviders();
      }
    } finally {
      setRefreshing(false);
    }
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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050608] flex items-center justify-center text-slate-400 text-xs gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
        <span>Loading ZeroRoute Master Admin Console…</span>
      </div>
    );
  }

  const activeProvidersCount = providersList.filter((p) => p.enabled && p.configured).length;
  const totalVolume = Math.max(metrics.totalRequests, logsList.length);

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
        avgLatencyMs={metrics.avgLatencyMs}
        cacheSavings={metrics.cacheSavings}
        cacheHitRatio={metrics.cacheHitRatio}
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
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 min-h-[44px] rounded-xl transition-all whitespace-nowrap cursor-pointer touch-manipulation shrink-0 ${
                  isSelected
                    ? "bg-gradient-to-b from-[#e5333b] to-[#c71d25] text-white font-bold border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.4)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {tabLoading && (
          <div className="py-12 flex items-center justify-center gap-2 text-slate-400 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
            <span>Loading {activeTab} data…</span>
          </div>
        )}

        {!tabLoading && (
          <>
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
          </>
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

