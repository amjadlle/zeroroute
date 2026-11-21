"use client";

import { useState } from "react";
import { Server } from "lucide-react";
import { apiFetch } from "@/lib/client/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ProviderModelCatalogModal } from "./ProviderModelCatalogModal";
import { ErrorDialog } from "./providers/ErrorDialog";
import { ProviderRow } from "./providers/ProviderRow";
import { modelsOf, move, toChange, type ProviderChange, type ProviderItem, type TestResult } from "./providers/helpers";

export type { ProviderItem } from "./providers/helpers";

type Props = {
  providers: ProviderItem[];
  /** PUTs only the given providers; rejects when the server refuses. */
  onSave: (changes: ProviderChange[]) => Promise<void>;
  /** Re-reads providers (a test updates latency and failure counts on the server). */
  onRefresh: () => void;
};

const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong.");

export function AdminProvidersTab({ providers, onSave, onRefresh }: Props) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [modelsFor, setModelsFor] = useState<string | null>(null);
  const [errorFor, setErrorFor] = useState<string | null>(null);

  const sorted = [...providers].sort((a, b) => a.order - b.order);
  const byId = (id: string | null) => providers.find((p) => p.id === id) ?? null;
  const modelsProvider = byId(modelsFor);

  // The list always shows what the server returned, so a failed save leaves the old state on screen.
  const save = async (changes: ProviderChange[]) => {
    setBusy(true);
    try {
      await onSave(changes);
    } catch (e) {
      toast(`Couldn't save: ${message(e)}`, { tone: "danger" });
    } finally {
      setBusy(false);
    }
  };

  const moveProvider = (index: number, delta: -1 | 1) => {
    const list = move(sorted, index, index + delta);
    // Renumber 1..N and send only the providers whose position changed.
    void save(list.flatMap((p, i) => (p.order === i + 1 ? [] : [toChange(p, { order: i + 1 })])));
  };

  const test = async (p: ProviderItem) => {
    setTesting((t) => ({ ...t, [p.id]: true }));
    let result: TestResult;
    try {
      const d = await apiFetch<Partial<TestResult>>("/api/admin/providers/test", {
        method: "POST",
        body: { providerId: p.id, model: modelsOf(p)[0] },
      });
      result = { ok: Boolean(d.ok), latencyMs: d.latencyMs || 0, response: d.response, error: d.error, telemetry: d.telemetry };
    } catch (e) {
      result = { ok: false, latencyMs: 0, error: message(e) };
    }
    setResults((r) => ({ ...r, [p.id]: result }));
    setTesting((t) => ({ ...t, [p.id]: false }));
    onRefresh();
  };

  if (sorted.length === 0) return <EmptyState icon={Server} title="No providers" description="The gateway has no providers set up." />;

  return (
    <>
      <ol className="space-y-2">
        {sorted.map((p, i) => (
          <li key={p.id}>
            <ProviderRow
              provider={p}
              position={i + 1}
              isFirst={i === 0}
              isLast={i === sorted.length - 1}
              busy={busy}
              testing={Boolean(testing[p.id])}
              result={results[p.id]}
              onMove={(delta) => moveProvider(i, delta)}
              onToggle={(enabled) => save([toChange(p, { enabled })])}
              onTest={() => test(p)}
              onModelsChange={(models) => save([toChange(p, { models })])}
              onOpenModels={() => setModelsFor(p.id)}
              onShowError={() => setErrorFor(p.id)}
            />
          </li>
        ))}
      </ol>

      <ProviderModelCatalogModal
        provider={modelsProvider}
        onClose={() => setModelsFor(null)}
        onSave={(models) => onSave(modelsProvider ? [toChange(modelsProvider, { models })] : [])}
      />
      <ErrorDialog provider={byId(errorFor)} onClose={() => setErrorFor(null)} />
    </>
  );
}
