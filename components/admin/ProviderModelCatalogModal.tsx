"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ExternalLink, Zap } from "lucide-react";
import { apiFetch } from "@/lib/client/api";
import { PROVIDER_CATALOGS, PROVIDER_PORTALS } from "@/lib/providers/catalog";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { FallbackChainEditor } from "./providers/FallbackChainEditor";
import { ModelPicker } from "./providers/ModelPicker";
import { modelsOf, recommendedChain, type ProviderItem, type TestResult } from "./providers/helpers";

type Props = {
  /** The provider to edit; null closes the dialog. */
  provider: ProviderItem | null;
  onClose: () => void;
  /** Saves the provider's fallback models; rejects when the server refuses. */
  onSave: (models: string[]) => Promise<void>;
};

const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong.");

/**
 * Pick a provider's fallback models from its known models (or by name) and test them.
 * The Modal stays mounted and only `open` changes (a Modal mounted already open is closed again by
 * React Strict Mode's effect replay in dev). The body unmounts on close, which cancels running tests.
 */
export function ProviderModelCatalogModal({ provider, onClose, onSave }: Props) {
  return (
    <Modal
      open={Boolean(provider)}
      onClose={onClose}
      size="lg"
      title={provider ? `${provider.name} models` : ""}
      description="Choose which models this provider tries, and in what order."
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {provider && <CatalogBody key={provider.id} provider={provider} onSave={onSave} />}
    </Modal>
  );
}

function CatalogBody({ provider, onSave }: { provider: ProviderItem; onSave: Props["onSave"] }) {
  const confirm = useConfirm();
  const [results, setResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "warning" | "danger"; text: string } | null>(null);
  const [custom, setCustom] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  const catalog = PROVIDER_CATALOGS[provider.id];
  const known = catalog?.categories.flatMap((c) => c.models) ?? [];
  const chain = modelsOf(provider);
  const portal = PROVIDER_PORTALS[provider.id];

  const test = async (model: string) => {
    const signal = (abort.current ??= new AbortController()).signal;
    setTesting((t) => ({ ...t, [model]: true }));
    let result: TestResult;
    try {
      const d = await apiFetch<Partial<TestResult>>("/api/admin/providers/test", {
        method: "POST",
        body: { providerId: provider.id, model },
        signal,
      });
      result = { ok: Boolean(d.ok), latencyMs: d.latencyMs || 0, response: d.response, error: d.error, telemetry: d.telemetry };
    } catch (e) {
      result = { ok: false, latencyMs: 0, error: message(e) };
    }
    if (signal.aborted) return;
    setResults((r) => ({ ...r, [model]: result }));
    setTesting((t) => ({ ...t, [model]: false }));
  };

  const testAll = async () => {
    const signal = (abort.current ??= new AbortController()).signal;
    let next = 0;
    let done = 0;
    setProgress(0);
    // Three at a time, so a free-tier rate limit isn't hit by our own test burst.
    const worker = async () => {
      while (next < known.length && !signal.aborted) {
        await test(known[next++].id);
        if (!signal.aborted) setProgress(++done);
      }
    };
    await Promise.all(Array.from({ length: Math.min(3, known.length) }, worker));
    if (!signal.aborted) setProgress(null);
  };

  const save = async (models: string[]) => {
    setBusy(true);
    setNotice(null);
    try {
      await onSave(models);
      return true;
    } catch (e) {
      setNotice({ tone: "danger", text: `Couldn't save: ${message(e)}` });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (model: string) => {
    if (chain.includes(model)) {
      setNotice({ tone: "warning", text: `${model} is already in the list.` });
      return false;
    }
    return save([...chain, model]);
  };

  const addCustom = async (e: FormEvent) => {
    e.preventDefault();
    const name = custom.trim();
    if (!name) return setNotice({ tone: "warning", text: "Type a model name first." });
    if (await add(name)) setCustom("");
  };

  const recommended = recommendedChain(results, new Set([...known.map((m) => m.id), ...chain]));
  const showRecommendation = recommended.length > 1 && recommended.join() !== chain.join();

  const reviewRecommendation = () => {
    const dropped = chain.filter((m) => !recommended.includes(m));
    void confirm({
      title: "Use the suggested order?",
      body: `New order: ${recommended.join(", ")}.${
        dropped.length ? ` These will be removed because they were not tested or failed: ${dropped.join(", ")}.` : ""
      }`,
      confirmLabel: "Use suggested order",
      onConfirm: () => onSave(recommended),
    });
  };

  return (
    <div className="space-y-5">
      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      <section className="space-y-2">
        <h3 className="text-body font-semibold text-text">Fallback models</h3>
        <FallbackChainEditor providerName={provider.name} models={chain} busy={busy} onChange={save} />
      </section>

      {showRecommendation && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-control bg-accent-soft p-3">
          <p className="min-w-0 text-meta text-text">
            Fastest working order from your tests: <span className="font-ui-mono">{recommended.join(" → ")}</span>
          </p>
          <Button size="sm" disabled={busy} onClick={reviewRecommendation}>Review suggestion</Button>
        </div>
      )}

      {known.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-body font-semibold text-text">Known models</h3>
              {catalog?.poolSummary && <p className="text-meta text-text-muted">{catalog.poolSummary}</p>}
            </div>
            <div className="flex items-center gap-2">
              {portal && (
                <Button href={portal} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm" rightIcon={<ExternalLink className="size-3.5" aria-hidden />}>
                  Provider dashboard
                </Button>
              )}
              <Button variant="secondary" size="sm" disabled={progress !== null} onClick={testAll} leftIcon={<Zap className="size-3.5" aria-hidden />}>
                {progress === null ? `Test all ${known.length}` : `Testing ${progress} of ${known.length}`}
              </Button>
            </div>
          </div>
          <ModelPicker
            categories={catalog.categories}
            chain={chain}
            results={results}
            testing={testing}
            busy={busy}
            onTest={test}
            onAdd={add}
            onMakeFirst={(m) => save([m, ...chain.filter((x) => x !== m)])}
            onRemove={(m) => save(chain.filter((x) => x !== m))}
          />
        </section>
      )}

      <form onSubmit={addCustom} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
        <Field label="Add any other model by its ID" className="min-w-0 flex-1">
          <Input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="e.g. llama-3.3-70b-versatile" className="font-ui-mono" />
        </Field>
        <Button type="submit" variant="secondary" disabled={busy}>Add</Button>
      </form>
    </div>
  );
}
