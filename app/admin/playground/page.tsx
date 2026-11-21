"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { AdminPlaygroundTab } from "@/components/admin/AdminPlaygroundTab";
import type { ProviderItem } from "@/components/admin/AdminProvidersTab";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

export default function AdminPlaygroundPage() {
  const { data, error, reload } = useAdminData<{ providers?: ProviderItem[] }>("/api/admin/providers");

  return (
    <>
      <PageHeader title="Playground" description="Send a test message through the gateway and see which provider answers." />
      {error && <LoadError what="providers" error={error} onRetry={reload} />}
      {data ? <AdminPlaygroundTab providers={data.providers ?? []} /> : !error && <PageLoader label="Loading providers" />}
    </>
  );
}
