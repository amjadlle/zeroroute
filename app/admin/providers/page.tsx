"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { apiFetch } from "@/lib/client/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { AdminProvidersTab, type ProviderItem } from "@/components/admin/AdminProvidersTab";
import { AdminApiKeysModal } from "@/components/admin/AdminApiKeysModal";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

type ProvidersResponse = { providers?: ProviderItem[] };

export default function AdminProvidersPage() {
  const { data, error, reload, setData } = useAdminData<ProvidersResponse>("/api/admin/providers");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [keysOpen, setKeysOpen] = useState(false);
  const providers = data?.providers ?? [];

  const save = async (updated: ProviderItem[]) => {
    try {
      const res = await apiFetch<ProvidersResponse>("/api/admin/providers", { method: "PUT", body: { providers: updated } });
      if (res.providers) setData(res);
      setSaveError(null);
    } catch (e) {
      setSaveError((e as Error).message || "Something went wrong.");
    }
  };

  return (
    <>
      <PageHeader
        title="Providers"
        description="Turn AI providers on or off and set the order they are tried in."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setKeysOpen(true)} leftIcon={<KeyRound className="size-3.5" />}>
            API keys
          </Button>
        }
      />
      {error && <LoadError what="providers" error={error} onRetry={reload} />}
      {saveError && (
        <Alert tone="danger" title="Couldn't save providers" className="mb-4">
          {saveError}
        </Alert>
      )}
      {data ? <AdminProvidersTab providers={providers} onUpdateProviders={save} /> : !error && <PageLoader label="Loading providers" />}
      <AdminApiKeysModal isOpen={keysOpen} onClose={() => setKeysOpen(false)} providers={providers} />
    </>
  );
}
