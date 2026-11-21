"use client";

import { Play, Plus } from "lucide-react";
import type { CatalogCategory } from "@/lib/providers/catalog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TestResultBox } from "./TestResultBox";
import { plainLimit, type TestResult } from "./helpers";

type Props = {
  categories: CatalogCategory[];
  chain: string[];
  results: Record<string, TestResult>;
  testing: Record<string, boolean>;
  busy: boolean;
  onTest: (id: string) => void;
  onAdd: (id: string) => void;
  onMakeFirst: (id: string) => void;
  onRemove: (id: string) => void;
};

/** The provider's known models by category, each with test, add, make first and remove. */
export function ModelPicker({ categories, chain, results, testing, busy, onTest, onAdd, onMakeFirst, onRemove }: Props) {
  return (
    <div className="space-y-5">
      {categories.map((cat) => (
        <section key={cat.name} className="space-y-2">
          <div>
            <h3 className="text-body font-semibold text-text">{cat.name}</h3>
            <p className="text-meta text-text-muted">{cat.description}</p>
          </div>
          <ul className="grid gap-2 md:grid-cols-2">
            {cat.models.map((m) => {
              const pos = chain.indexOf(m.id);
              const limits = [plainLimit(m.rpm), plainLimit(m.rpd), m.ctx && `${m.ctx} context`].filter(Boolean);
              return (
                <li key={m.id} className="flex flex-col gap-2 rounded-control border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="min-w-0 break-all font-ui-mono text-meta font-medium text-text">{m.id}</code>
                    {m.kind && m.kind !== "Chat" && <Badge tone="info">{m.kind}</Badge>}
                    {pos === 0 && <Badge tone="accent">Tried first</Badge>}
                    {pos > 0 && <Badge>Fallback {pos + 1}</Badge>}
                  </div>
                  <p className="text-meta text-text-muted">{m.role}</p>
                  {limits.length > 0 && <p className="text-meta text-text-subtle">Limits: {limits.join(" · ")}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" loading={testing[m.id]} onClick={() => onTest(m.id)} leftIcon={<Play className="size-3.5" aria-hidden />}>
                      Test
                    </Button>
                    {pos !== 0 && (
                      <Button variant="secondary" size="sm" disabled={busy} onClick={() => onMakeFirst(m.id)}>
                        Make first
                      </Button>
                    )}
                    {pos === -1 ? (
                      <Button variant="secondary" size="sm" disabled={busy} onClick={() => onAdd(m.id)} leftIcon={<Plus className="size-3.5" aria-hidden />}>
                        Add as fallback
                      </Button>
                    ) : (
                      chain.length > 1 && (
                        <Button variant="ghost" size="sm" disabled={busy} onClick={() => onRemove(m.id)}>
                          Remove
                        </Button>
                      )
                    )}
                  </div>
                  {results[m.id] && <TestResultBox result={results[m.id]} />}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
