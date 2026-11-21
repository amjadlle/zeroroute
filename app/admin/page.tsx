"use client";

import { Activity, Gauge, Layers, RefreshCw, Users, Zap } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { StatTile } from "@/components/ui/StatTile";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import type { ProviderItem } from "@/components/admin/AdminProvidersTab";
import type { GlobalLogItem } from "@/components/admin/AdminLogsTab";
import type { CustomerAdminItem } from "@/components/admin/AdminCustomersTab";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

// Shape of `metrics` from GET /api/admin/logs (all requests, not just the returned page).
type Metrics = {
  totalRequests: number;
  avgLatencyMs: number;
  successRate: number;
  cacheHits: number;
  cacheSavings: string;
  cacheHitRatio: number;
};

export default function AdminOverviewPage() {
  const providers = useAdminData<{ providers?: ProviderItem[] }>("/api/admin/providers");
  const logs = useAdminData<{ logs?: GlobalLogItem[]; metrics?: Metrics }>("/api/admin/logs?limit=200");
  const customers = useAdminData<{ customers?: CustomerAdminItem[] }>("/api/admin/customers");

  const all = [providers, logs, customers];
  const refreshing = all.some((r) => r.loading);
  const refresh = async () => {
    await Promise.all(all.map((r) => r.reload()));
  };

  const providerList = providers.data?.providers ?? [];
  const m = logs.data?.metrics;
  const hasRequests = !!m && m.totalRequests > 0;
  const activeProviders = providerList.filter((p) => p.enabled && p.configured).length;

  return (
    <>
      <PageHeader
        title="Overview"
        description="How the gateway is doing across all providers and customers."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={refreshing} leftIcon={<RefreshCw className="size-3.5" />}>
            Refresh
          </Button>
        }
      />

      {providers.error && <LoadError what="providers" error={providers.error} onRetry={providers.reload} />}
      {logs.error && <LoadError what="request stats" error={logs.error} onRetry={logs.reload} />}
      {customers.error && <LoadError what="customers" error={customers.error} onRetry={customers.reload} />}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          icon={Activity}
          label="Requests"
          value={m ? m.totalRequests.toLocaleString() : "—"}
          hint={hasRequests ? `${m.successRate}% succeeded` : "No requests yet"}
        />
        <StatTile
          icon={Gauge}
          label="Average response time"
          value={hasRequests ? `${m.avgLatencyMs.toLocaleString()} ms` : "—"}
          hint="Across all requests"
        />
        <StatTile
          icon={Zap}
          label="Cache hits"
          value={m ? m.cacheHits.toLocaleString() : "—"}
          hint={m ? `${m.cacheHitRatio}% of requests, about ${m.cacheSavings} saved` : undefined}
        />
        <StatTile
          icon={Layers}
          label="Providers on"
          value={providers.data ? `${activeProviders} / ${providerList.length}` : "—"}
          hint="Turned on and have a key"
        />
        <StatTile
          icon={Users}
          label="Customers"
          value={customers.data ? (customers.data.customers?.length ?? 0).toLocaleString() : "—"}
          hint="Accounts and admin bots"
        />
      </div>

      {providers.data && logs.data ? (
        <AdminAnalyticsTab providers={providerList} logs={logs.data.logs ?? []} onRefresh={refresh} loading={refreshing} />
      ) : (
        !providers.error && !logs.error && <PageLoader label="Loading activity" />
      )}
    </>
  );
}
