"use client";

import { Activity, CircleCheck, Gauge, Layers, RefreshCw, Users, Zap } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { StatTile } from "@/components/ui/StatTile";
import { ProviderHealth, RecentErrors, median, providerStatus, useNow } from "@/components/admin/AdminOverview";
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

// Median latency and recent errors come from this many newest requests; totals come from the server.
const SAMPLE = 200;

export default function AdminOverviewPage() {
  const providers = useAdminData<{ providers?: ProviderItem[] }>("/api/admin/providers");
  const logs = useAdminData<{ logs?: GlobalLogItem[]; metrics?: Metrics }>(`/api/admin/logs?limit=${SAMPLE}`);
  const customers = useAdminData<{ customers?: CustomerAdminItem[] }>("/api/admin/customers");

  const all = [providers, logs, customers];
  const refreshing = all.some((r) => r.loading);
  const refresh = async () => {
    await Promise.all(all.map((r) => r.reload()));
  };

  const providerList = providers.data?.providers ?? [];
  const now = useNow(Math.max(0, ...providerList.map((p) => p.cooldownUntil || 0)));
  const readyProviders = providerList.filter((p) => providerStatus(p, now).ready).length;

  const m = logs.data?.metrics;
  const hasRequests = !!m && m.totalRequests > 0;
  const recent = logs.data?.logs ?? [];
  const p50 = median(recent.map((l) => l.latency_ms));

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

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile icon={Activity} label="Requests" value={m ? m.totalRequests.toLocaleString() : "—"} hint={hasRequests ? "All time" : "No requests yet"} />
        <StatTile icon={CircleCheck} label="Success rate" value={hasRequests ? `${m.successRate}%` : "—"} hint="All time" />
        <StatTile
          icon={Gauge}
          label="Response time"
          value={p50 !== undefined ? `${p50.toLocaleString()} ms` : "—"}
          hint={recent.length ? `Median of the last ${recent.length.toLocaleString()} requests` : "No requests yet"}
        />
        <StatTile
          icon={Zap}
          label="Cache hit rate"
          value={hasRequests ? `${m.cacheHitRatio}%` : "—"}
          hint={hasRequests ? `${m.cacheHits.toLocaleString()} answered from cache` : "All time"}
        />
        <StatTile
          icon={Users}
          label="Customers"
          value={customers.data ? (customers.data.customers?.length ?? 0).toLocaleString() : "—"}
          hint="Accounts and admin bots"
        />
        <StatTile
          icon={Layers}
          label="Providers ready"
          value={providers.data ? `${readyProviders} / ${providerList.length}` : "—"}
          hint="On, have a key and not paused"
        />
      </div>

      {providers.data && logs.data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <ProviderHealth providers={providerList} now={now} />
          <RecentErrors logs={recent} />
        </div>
      ) : (
        !providers.error && !logs.error && <PageLoader label="Loading activity" />
      )}
    </>
  );
}
