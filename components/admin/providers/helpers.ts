import type { Tone } from "@/components/ui/StatusDot";
import type { RateLimitTelemetry } from "@/lib/providers/types";

export interface ProviderItem {
  id: string;
  name: string;
  model: string;
  models: string[];
  enabled: boolean;
  order: number;
  configured: boolean;
  consecutiveFailures: number;
  cooldownUntil: number;
  lastLatencyMs?: number;
  lastError?: string;
  rateLimits?: RateLimitTelemetry;
  lastUsedAt?: number;
  /** Name of the server environment variable the key is read from. */
  keyEnvVar?: string;
}

/** The only fields the PUT route reads. Runtime fields (latency, failures) are never sent back. */
export type ProviderChange = Pick<ProviderItem, "id" | "enabled" | "order" | "models">;

export const toChange = (p: ProviderItem, patch: Partial<ProviderChange> = {}): ProviderChange => ({
  id: p.id,
  enabled: p.enabled,
  order: p.order,
  models: modelsOf(p),
  ...patch,
});

export interface TestResult {
  ok: boolean;
  latencyMs: number;
  response?: string;
  error?: string;
  telemetry?: {
    remainingRequests?: string | number;
    limitRequests?: string | number;
    remainingTokens?: string | number;
    resetRequests?: string;
  } | null;
}

export const modelsOf = (p: { model: string; models?: string[] }) => (p.models?.length ? p.models : [p.model]);

export function move<T>(list: readonly T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const UNITS: [RegExp, string][] = [
  [/\bRPM\b/, "requests a minute"],
  [/\bTPM\b/, "tokens a minute"],
  [/\bRPD\b/, "requests a day"],
  [/\bTPD\b/, "tokens a day"],
];

/** "30 RPM" -> "30 requests a minute". Empty and "—" values are dropped. */
export const plainLimit = (value?: string) =>
  value && value !== "—" ? UNITS.reduce((s, [re, words]) => s.replace(re, words), value) : undefined;

/** Models that passed a test, fastest first, limited to ones this provider knows about. */
export const recommendedChain = (results: Record<string, TestResult>, known: Set<string>) =>
  Object.entries(results)
    .filter(([id, r]) => r.ok && known.has(id))
    .sort(([, a], [, b]) => a.latencyMs - b.latencyMs)
    .map(([id]) => id);

export function providerStatus(p: ProviderItem, now = Date.now()): { tone: Tone; label: string } {
  if (!p.enabled) return { tone: "neutral", label: "Off" };
  if (!p.configured) return { tone: "warning", label: "Not ready" };
  if (p.cooldownUntil > now) return { tone: "warning", label: "Paused after errors" };
  if (p.consecutiveFailures > 0) return { tone: "danger", label: "Failing" };
  return { tone: "success", label: "Ready" };
}
