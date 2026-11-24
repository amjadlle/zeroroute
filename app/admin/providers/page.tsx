"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { apiFetch } from "@/lib/client/api";
import { PageHeader } from "@/components/shell/PageHeader";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { useToast } from "@/components/ui/Toast";
import { AdminProvidersTab, type ProviderItem } from "@/components/admin/AdminProvidersTab";
import { BenchmarkPanel, type BenchmarkResult } from "@/components/admin/providers/BenchmarkPanel";
import type { ProviderChange } from "@/components/admin/providers/helpers";
import { LoadError, useAdminData } from "@/components/admin/useAdminData";

type ProvidersResponse = { providers?: ProviderItem[] };

export default function AdminProvidersPage() {
  const { data, error, reload, setData } = useAdminData<ProvidersResponse>("/api/admin/providers");
  const toast = useToast();
  const [benchmark, setBenchmark] = useState<BenchmarkResult[] | null>(null);
  const [benchmarking, setBenchmarking] = useState(false);

  const save = async (changes: ProviderChange[]) => {
    const res = await apiFetch<ProvidersResponse>("/api/admin/providers", { method: "PUT", body: { providers: changes } });
    if (res.providers) setData(res);
  };

  const runBenchmark = async () => {
    setBenchmarking(true);
    try {
      const res = await apiFetch<{ results?: BenchmarkResult[] }>("/api/admin/providers/benchmark", { method: "POST" });
      setBenchmark(res.results ?? []);
    } catch (e) {
      toast(`Speed test failed: ${(e as Error).message || "Something went wrong."}`, { tone: "danger" });
    } finally {
      setBenchmarking(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Providers"
        description="Turn AI providers on or off and set the order they are tried in. The top provider answers first; if it fails, the next one does."
        actions={
          data && (
            <Button variant="secondary" size="sm" loading={benchmarking} onClick={runBenchmark} leftIcon={<Zap className="size-3.5" aria-hidden />}>
              Test all
            </Button>
          )
        }
      />
      {error && <LoadError what="providers" error={error} onRetry={reload} />}
      {benchmark && <BenchmarkPanel results={benchmark} onClose={() => setBenchmark(null)} />}
      {data ? (
        <AdminProvidersTab providers={data.providers ?? []} onSave={save} onRefresh={reload} />
      ) : (
        !error && <PageLoader label="Loading providers" />
      )}
    </>
  );
}
