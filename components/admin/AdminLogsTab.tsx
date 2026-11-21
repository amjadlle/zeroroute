"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Download, RefreshCw, SearchX, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { useSearchParamValue } from "@/components/ui/useSearchParamValue";
import { LogDetailDrawer, StatusBadge, formatTime, isSuccess, retriesOf, siteOf } from "./LogDetailDrawer";

export interface GlobalLogItem {
  id: string;
  customer_key: string;
  timestamp: number;
  origin?: string;
  prompt_preview?: string;
  response_preview?: string;
  provider: string;
  model: string;
  latency_ms: number;
  status: number;
  is_stream: number;
  is_cache_hit: number;
  failovers?: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** sessionStorage key the customers page uses to open this log filtered to one customer. */
export const LOG_FILTER_KEY = "zr_admin_log_filter";

const ALL = "all";
const REFRESH_MS = 5000;

const STATUS_OPTIONS = [
  { value: ALL, label: "All" },
  { value: "success", label: "Succeeded" },
  { value: "error", label: "Failed" },
] as const;

// AI answers routinely take a second or two; only flag the slow tail.
const latencyTone = (ms: number) => (ms < 3000 ? "neutral" : ms < 8000 ? "warning" : "danger");

/** [value, count] pairs, most common first. */
function countBy(logs: GlobalLogItem[], pick: (log: GlobalLogItem) => string) {
  const counts = new Map<string, number>();
  for (const log of logs) counts.set(pick(log), (counts.get(pick(log)) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}

/** Blob + object URL: a data: URI breaks on large exports. */
function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 0); // after the click has started the download
}

const COLUMNS: Column<GlobalLogItem>[] = [
  {
    key: "timestamp",
    header: "Time",
    sortable: true,
    cell: (log) => <span className="whitespace-nowrap tabular-nums">{formatTime(log.timestamp)}</span>,
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    cell: (log) => {
      const retries = retriesOf(log).length;
      return (
        <span className="inline-flex flex-wrap justify-end gap-1 sm:flex-nowrap sm:justify-start">
          <StatusBadge status={log.status} />
          {log.is_cache_hit ? <Badge tone="info">Cached</Badge> : null}
          {retries > 0 && <Badge tone="warning">{retries === 1 ? "1 retry" : `${retries} retries`}</Badge>}
        </span>
      );
    },
  },
  { key: "origin", header: "Site", sortable: true, cell: (log) => <span className="block max-w-48 truncate">{siteOf(log)}</span> },
  {
    key: "provider",
    header: "Provider",
    sortable: true,
    cell: (log) => (
      <span className="block max-w-56 truncate">
        <span className="capitalize">{log.provider}</span> <span className="font-ui-mono text-meta text-text-muted">{log.model}</span>
      </span>
    ),
  },
  {
    key: "latency_ms",
    header: "Response time",
    align: "right",
    sortable: true,
    cell: (log) => <Badge tone={latencyTone(log.latency_ms)} className="tabular-nums">{log.latency_ms.toLocaleString()} ms</Badge>,
  },
  {
    key: "prompt_preview",
    header: "Prompt",
    cell: (log) => <span className="block max-w-56 truncate text-text-muted sm:max-w-64">{log.prompt_preview || "—"}</span>,
  },
];

type AdminLogsTabProps = {
  logs: GlobalLogItem[];
  onRefresh: () => Promise<void>;
  loading: boolean;
  /** Customer key the server already filtered `logs` to; shown as a removable filter. */
  customer?: string;
  onClearCustomer?: () => void;
};

export function AdminLogsTab({ logs, onRefresh, loading, customer, onClearCustomer }: AdminLogsTabProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useSearchParamValue("status", ALL);
  const [provider, setProvider] = useSearchParamValue("provider", ALL);
  const [site, setSite] = useSearchParamValue("site", ALL);
  // Search stays local: a URL update per keystroke would lag the input.
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GlobalLogItem | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // The interval reads the latest onRefresh through a ref, so parent re-renders don't restart it.
  const refresh = useRef(onRefresh);
  useEffect(() => { refresh.current = onRefresh; });
  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(() => refresh.current(), REFRESH_MS);
    return () => clearInterval(id);
  }, [autoRefresh]);

  const sites = useMemo(() => countBy(logs, siteOf), [logs]);
  const providers = useMemo(() => countBy(logs, (l) => l.provider), [logs]);

  // Filters run over the loaded page (newest 200). Upgrade path: pass them to the API, which already supports them.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter(
      (log) =>
        (status === ALL || (status === "success") === isSuccess(log.status)) &&
        (provider === ALL || log.provider === provider) &&
        (site === ALL || siteOf(log) === site) &&
        (!q || [log.prompt_preview, log.response_preview, log.model, log.origin, log.id].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [logs, status, provider, site, query]);

  const filtering = status !== ALL || provider !== ALL || site !== ALL || query !== "" || !!customer;
  const clearFilters = () => {
    setQuery("");
    onClearCustomer?.();
    router.replace(pathname, { scroll: false }); // drops every URL filter in one navigation
  };

  return (
    <div className="space-y-4">
      {/* Grid on phones so each control (and Select's wrapper) spans the width. */}
      <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
        <SearchInput
          aria-label="Search requests"
          placeholder="Search prompt, response, model or ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="sm:w-72"
        />
        <Select aria-label="Site" value={site} onChange={(e) => setSite(e.target.value)} className="sm:w-44">
          <option value={ALL}>All sites</option>
          {sites.map(([value, count]) => (
            <option key={value} value={value}>{value} ({count})</option>
          ))}
        </Select>
        <Select aria-label="Provider" value={provider} onChange={(e) => setProvider(e.target.value)} className="sm:w-40">
          <option value={ALL}>All providers</option>
          {providers.map(([value, count]) => (
            <option key={value} value={value}>{value} ({count})</option>
          ))}
        </Select>
        <SegmentedControl label="Status" options={STATUS_OPTIONS} value={status} onValueChange={setStatus} className="justify-self-start" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-2 text-body text-text-muted">
          <span aria-live="polite">Showing {filtered.length} of {logs.length}</span>
          {customer && (
            <Badge tone="accent" className="pr-0.5">
              Customer key ending {customer.slice(-4)}
              <button
                type="button"
                onClick={onClearCustomer}
                aria-label="Remove customer filter"
                className="inline-flex size-4.5 cursor-pointer items-center justify-center rounded-full hover:bg-surface focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                <X aria-hidden className="size-3" />
              </button>
            </Badge>
          )}
          {filtering && (
            <Button variant="link" size="sm" onClick={clearFilters}>Clear filters</Button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Switch label="Auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Download aria-hidden className="size-3.5" />}
            disabled={filtered.length === 0}
            onClick={() => downloadJson(filtered, `zeroroute-requests-${Date.now()}.json`)}
          >
            Export JSON
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw aria-hidden className={loading ? "size-3.5 motion-safe:animate-spin" : "size-3.5"} />}
            disabled={loading}
            onClick={onRefresh}
          >
            Refresh
          </Button>
        </div>
      </div>

      <DataTable
        label="Requests"
        columns={COLUMNS}
        rows={filtered}
        getRowId={(log) => log.id}
        onRowClick={setSelected}
        className="sm:rounded-card sm:border sm:border-border"
        empty={
          logs.length === 0 ? (
            <EmptyState title="No requests yet" description="Requests show up here as soon as the gateway answers one." />
          ) : (
            <EmptyState icon={SearchX} title="No requests match these filters" />
          )
        }
      />

      <LogDetailDrawer log={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
