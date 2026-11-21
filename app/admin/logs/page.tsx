"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { AdminLogsTab, LOG_FILTER_KEY, type GlobalLogItem } from "@/components/admin/AdminLogsTab";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

/** Search handed over by "View logs" on the customers page. Read-only: Strict Mode runs state initializers twice. */
function readFilter() {
  try {
    return sessionStorage.getItem(LOG_FILTER_KEY) ?? "";
  } catch {
    return "";
  }
}

export default function AdminLogsPage() {
  const { data, error, loading, reload } = useAdminData<{ logs?: GlobalLogItem[] }>("/api/admin/logs?limit=200");
  // Lazy init runs during render on the server too; the tab only renders after the client fetch, so no mismatch.
  const [initialSearch] = useState(() => (typeof window === "undefined" ? "" : readFilter()));
  // One-shot: clear it so a later visit opens unfiltered.
  useEffect(() => {
    try { sessionStorage.removeItem(LOG_FILTER_KEY); } catch { /* storage blocked */ }
  }, []);

  return (
    <>
      <PageHeader title="Request log" description="Recent requests, which provider answered, and any retries." />
      {error && <LoadError what="requests" error={error} onRetry={reload} />}
      {data ? (
        <AdminLogsTab logs={data.logs ?? []} onRefresh={reload} loading={loading} initialSearch={initialSearch} />
      ) : (
        !error && <PageLoader label="Loading requests" />
      )}
    </>
  );
}
