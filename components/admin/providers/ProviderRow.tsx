"use client";

import { useId, useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Play } from "lucide-react";
import { PROVIDER_PORTALS } from "@/lib/providers/catalog";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Switch } from "@/components/ui/Switch";
import { FallbackChainEditor } from "./FallbackChainEditor";
import { TestResultBox } from "./TestResultBox";
import { modelsOf, providerStatus, type ProviderItem, type TestResult } from "./helpers";

type Props = {
  provider: ProviderItem;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  testing: boolean;
  result?: TestResult;
  onMove: (delta: -1 | 1) => void;
  onToggle: (enabled: boolean) => void;
  onTest: () => void;
  onModelsChange: (models: string[]) => void;
  onOpenModels: () => void;
  onShowError: () => void;
};

const icon = "size-4";

export function ProviderRow({ provider: p, position, isFirst, isLast, busy, testing, result, onMove, onToggle, onTest, onModelsChange, onOpenModels, onShowError }: Props) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const status = providerStatus(p);
  const portal = PROVIDER_PORTALS[p.id];
  const models = modelsOf(p);

  return (
    <Card className={cn(!p.enabled && "bg-surface-sunken")}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5">
        <div className="flex items-center">
          <span className="w-6 text-center font-ui-mono text-meta text-text-subtle">{position}</span>
          <IconButton label={`Move ${p.name} up`} icon={<ChevronUp className={icon} aria-hidden />} disabled={busy || isFirst} onClick={() => onMove(-1)} />
          <IconButton label={`Move ${p.name} down`} icon={<ChevronDown className={icon} aria-hidden />} disabled={busy || isLast} onClick={() => onMove(1)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-body font-semibold text-text">{p.name}</h2>
            <Badge tone={status.tone} dot>{status.label}</Badge>
            <Badge tone={p.configured ? "success" : "warning"}>{p.configured ? "Key set" : "Key missing"}</Badge>
          </div>
          <p className="truncate text-meta text-text-muted">
            <span className="font-ui-mono">{models[0]}</span>
            {models.length > 1 && ` + ${models.length - 1} fallback`}
            {p.lastLatencyMs ? ` · last reply ${p.lastLatencyMs} ms` : ""}
          </p>
          {!p.configured && (
            <p className="text-meta text-text-muted">
              To add a key, set <code className="font-ui-mono text-text">{p.keyEnvVar}</code> in the server environment and restart.
              {p.id === "cloudflare" && <> Cloudflare also needs <code className="font-ui-mono text-text">CLOUDFLARE_ACCOUNT_ID</code>.</>}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={p.enabled}
            disabled={busy}
            onCheckedChange={onToggle}
            aria-label={`Use ${p.name}`}
          />
          <Button variant="secondary" size="sm" loading={testing} disabled={busy} onClick={onTest} leftIcon={<Play className="size-3.5" aria-hidden />}>
            Test
          </Button>
          <IconButton
            label={open ? `Hide ${p.name} details` : `Show ${p.name} details`}
            icon={open ? <ChevronUp className={icon} aria-hidden /> : <ChevronDown className={icon} aria-hidden />}
            aria-expanded={open}
            aria-controls={detailsId}
            onClick={() => setOpen(!open)}
          />
        </div>
      </div>

      {result && <TestResultBox result={result} className="mx-3 mb-3" />}

      {open && (
        <div id={detailsId} className="space-y-4 border-t border-border px-3 py-3">
          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-body font-medium text-text">Fallback models</h3>
                <p className="text-meta text-text-muted">Tried top to bottom before moving to the next provider.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={onOpenModels}>Choose models</Button>
            </div>
            <FallbackChainEditor providerName={p.name} models={models} busy={busy} onChange={onModelsChange} onModelClick={onOpenModels} />
          </section>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-meta text-text-muted">
            <span>Failures in a row: <span className="text-text">{p.consecutiveFailures || 0}</span></span>
            {p.lastError && (
              <button type="button" onClick={onShowError} className="rounded-control text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring">
                See last error
              </button>
            )}
            {portal && (
              <a href={portal} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline">
                Provider dashboard <ExternalLink className="size-3.5" aria-hidden />
              </a>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
