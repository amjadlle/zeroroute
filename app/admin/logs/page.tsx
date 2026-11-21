"use client";

import { Suspense, useEffect, useState } from "react";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { AdminLogsTab, LOG_FILTER_KEY, type GlobalLogItem } from "@/components/admin/AdminLogsTab";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

/** Customer key handed over by "View logs" on the customers page. Read-only: Strict Mode runs state initializers twice. */
function readFilter() {
  try {
    return sessionStorage.getItem(LOG_FILTER_KEY) ?? "";
  } catch {
    return "";
  }
}

function Logs({ customer, onClearCustomer }: { customer: string; onClearCustomer: () => void }) {
  // Filter on the server so a quiet customer's requests aren't crowded out of the newest 200 overall.
  const query = customer ? `&customer_key=${encodeURIComponent(customer)}` : "";
  const { data, error, loading, reload } = useAdminData<{ logs?: GlobalLogItem[] }>(`/api/admin/logs?limit=200${query}`);

  return (
    <>
      {error && <LoadError what="requests" error={error} onRetry={reload} />}
      {data ? (
        <AdminLogsTab
          logs={data.logs ?? []}
          onRefresh={reload}
          loading={loading}
          customer={customer}
          onClearCustomer={onClearCustomer}
        />
      ) : (
        !error && <PageLoader label="Loading requests" />
      )}
    </>
  );
}

export default function AdminLogsPage() {
  // The key stays in memory, never in the address bar, so it can't leak through history or screenshots.
  // Lazy init runs during render on the server too; Logs shows a loader until the client fetch, so no mismatch.
  const [customer, setCustomer] = useState(() => (typeof window === "undefined" ? "" : readFilter()));
  // One-shot: clear it so a later visit opens unfiltered; "View logs" sets it again each time.
  useEffect(() => {
    try { sessionStorage.removeItem(LOG_FILTER_KEY); } catch { /* storage blocked */ }
  }, []);

  return (
    <>
      <PageHeader title="Request log" description="Recent requests, which provider answered, and any retries." />
      {/* Filters live in the URL (useSearchParams), which needs a Suspense boundary. key: a new customer filter starts a fresh load. */}
      <Suspense fallback={<PageLoader label="Loading requests" />}>
        <Logs key={customer} customer={customer} onClearCustomer={() => setCustomer("")} />
      </Suspense>
    </>
  );
}
