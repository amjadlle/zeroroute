"use client";

import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { move } from "./helpers";

type Props = {
  providerName: string;
  models: string[];
  /** Disables every control while a save is in flight. */
  busy?: boolean;
  onChange: (models: string[]) => void;
  /** When set, each model name is a button (opens the model list). */
  onModelClick?: (model: string) => void;
};

const icon = "size-4";

/** The provider's fallback models in order: move up, move down, remove. At least one model always stays. */
export function FallbackChainEditor({ providerName, models, busy, onChange, onModelClick }: Props) {
  return (
    <ol aria-label={`${providerName} fallback models`} className="divide-y divide-border rounded-control border border-border">
      {models.map((m, i) => (
        <li key={m} className="flex min-w-0 items-center gap-2 px-2.5 py-1.5">
          <span className="w-5 shrink-0 text-right font-ui-mono text-meta text-text-subtle">{i + 1}</span>
          {onModelClick ? (
            <button
              type="button"
              onClick={() => onModelClick(m)}
              className="min-w-0 truncate rounded-control text-left font-ui-mono text-meta text-text hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring"
              title={m}
            >
              {m}
            </button>
          ) : (
            <span className="min-w-0 truncate font-ui-mono text-meta text-text" title={m}>{m}</span>
          )}
          {i === 0 && <Badge tone="accent">Tried first</Badge>}
          <span className="ml-auto flex shrink-0 items-center">
            <IconButton
              label={`Move ${m} up`}
              icon={<ChevronUp className={icon} aria-hidden />}
              disabled={busy || i === 0}
              onClick={() => onChange(move(models, i, i - 1))}
            />
            <IconButton
              label={`Move ${m} down`}
              icon={<ChevronDown className={icon} aria-hidden />}
              disabled={busy || i === models.length - 1}
              onClick={() => onChange(move(models, i, i + 1))}
            />
            <IconButton
              label={`Remove ${m}`}
              icon={<X className={icon} aria-hidden />}
              disabled={busy || models.length === 1}
              onClick={() => onChange(models.filter((x) => x !== m))}
            />
          </span>
        </li>
      ))}
    </ol>
  );
}
