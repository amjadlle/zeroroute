"use client";

import { PageHeader } from "@/components/shell/PageHeader";
import { PageLoader } from "@/components/ui/PageLoader";
import { AdminKnowledgeTab } from "@/components/admin/AdminKnowledgeTab";
import type { CustomerAdminItem } from "@/components/admin/AdminCustomersTab";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

export default function AdminKnowledgePage() {
  const { data, error, reload } = useAdminData<{ customers?: CustomerAdminItem[] }>("/api/admin/customers");

  return (
    <>
      <PageHeader title="Knowledge" description="Files and web pages a bot answers from. Pick a bot, then add or remove sources." />
      {error && <LoadError what="bots" error={error} onRetry={reload} />}
      {data ? <AdminKnowledgeTab customers={data.customers ?? []} /> : !error && <PageLoader label="Loading bots" />}
    </>
  );
}
