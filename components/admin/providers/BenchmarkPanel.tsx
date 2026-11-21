import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

export interface BenchmarkResult {
  providerId: string;
  providerName: string;
  model: string;
  status: "ok" | "error";
  latencyMs: number;
  error?: string | null;
}

/** Results of testing every fallback model of every provider that is on and has a key. */
export function BenchmarkPanel({ results, onClose }: { results: BenchmarkResult[]; onClose: () => void }) {
  return (
    <Card className="mb-4">
      <CardHeader
        title="Speed test results"
        description="One test request to each fallback model of every provider that is on and has a key."
        actions={<Button variant="ghost" size="sm" onClick={onClose}>Close</Button>}
      />
      {results.length === 0 ? (
        <p className="p-4.5 text-body text-text-muted">No provider is on with a key set, so nothing was tested.</p>
      ) : (
        <ul className="divide-y divide-border">
          {results.map((r) => (
            <li key={`${r.providerId}:${r.model}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4.5 py-2.5">
              <span className="w-28 shrink-0 text-body font-medium text-text">{r.providerName}</span>
              <span className="min-w-0 flex-1 truncate font-ui-mono text-meta text-text-muted" title={r.model}>{r.model}</span>
              {r.status === "ok" ? <Badge tone="success">{r.latencyMs} ms</Badge> : <Badge tone="danger">Failed</Badge>}
              {r.error && <p className="w-full truncate text-meta text-danger-fg" title={r.error}>{r.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
