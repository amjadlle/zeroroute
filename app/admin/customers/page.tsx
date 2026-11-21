"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shell/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { AdminCustomersTab, type CustomerAdminItem } from "@/components/admin/AdminCustomersTab";
import { LOG_FILTER_KEY } from "@/components/admin/AdminLogsTab";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

export default function AdminCustomersPage() {
  const router = useRouter();
  const { data, error, reload } = useAdminData<{ customers?: CustomerAdminItem[] }>("/api/admin/customers");

  const viewLogs = (key: string) => {
    // Hand the key over in sessionStorage, not the URL, so it stays out of history and logs.
    try { sessionStorage.setItem(LOG_FILTER_KEY, key); } catch { /* storage blocked: open unfiltered */ }
    router.push("/admin/logs");
  };

  return (
    <>
      <PageHeader title="Customers" description="Everyone with a chatbot, plus the bots you made yourself." />
      {error && <LoadError what="customers" error={error} onRetry={reload} />}
      {data ? (
        <AdminCustomersTab customers={data.customers ?? []} onRefresh={reload} onViewCustomerLogs={viewLogs} />
      ) : (
        !error && <PageLoader label="Loading customers" />
      )}
    </>
  );
}
