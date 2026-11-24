"use client";

import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { OverviewKpis, ProviderHealth, RecentErrors, useNow, type TrendDay } from "@/components/admin/AdminOverview";
import type { ProviderItem } from "@/components/admin/AdminProvidersTab";
import type { GlobalLogItem } from "@/components/admin/AdminLogsTab";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

// Recent failures come from this many newest requests; the KPIs come from the server's daily totals.
const SAMPLE = 200;

export default function AdminOverviewPage() {
  const providers = useAdminData<{ providers?: ProviderItem[] }>("/api/admin/providers");
  const logs = useAdminData<{ logs?: GlobalLogItem[]; metrics?: { daily?: TrendDay[] } }>(`/api/admin/logs?limit=${SAMPLE}`);

  const all = [providers, logs];
  const refreshing = all.some((r) => r.loading);
  const refresh = async () => {
    await Promise.all(all.map((r) => r.reload()));
  };

  const providerList = providers.data?.providers ?? [];
  const now = useNow(Math.max(0, ...providerList.map((p) => p.cooldownUntil || 0)));

  return (
    <>
      <PageHeader
        title="Overview"
        description="How the gateway did over the last 7 days, across all providers and customers."
        actions={
          <Button variant="secondary" size="sm" onClick={refresh} loading={refreshing} leftIcon={<RefreshCw className="size-3.5" />}>
            Refresh
          </Button>
        }
      />

      {providers.error && <LoadError what="providers" error={providers.error} onRetry={providers.reload} />}
      {logs.error && <LoadError what="request stats" error={logs.error} onRetry={logs.reload} />}

      {logs.data && <OverviewKpis daily={logs.data.metrics?.daily ?? []} />}

      {providers.data && logs.data ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <ProviderHealth providers={providerList} now={now} />
          <RecentErrors logs={logs.data.logs ?? []} />
        </div>
      ) : (
        !providers.error && !logs.error && <PageLoader label="Loading activity" />
      )}
    </>
  );
}
