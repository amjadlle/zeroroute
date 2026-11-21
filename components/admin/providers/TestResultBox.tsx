import { cn } from "@/lib/cn";
import { CopyButton } from "@/components/ui/CopyButton";
import type { TestResult } from "./helpers";

/** Outcome of one test request: reply or error text, plus any quota the provider reported. */
export function TestResultBox({ result, className }: { result: TestResult; className?: string }) {
  const text = result.ok ? result.response || "OK" : result.error || "Test failed";
  const t = result.telemetry;
  const quota = [
    t?.remainingRequests && `Requests left: ${t.remainingRequests}${t.limitRequests ? ` of ${t.limitRequests}` : ""}`,
    t?.remainingTokens && `Tokens left: ${t.remainingTokens}`,
    t?.resetRequests && `Resets in ${t.resetRequests}`,
  ].filter(Boolean);

  return (
    <div className={cn("space-y-1.5 rounded-control p-2.5 text-meta", result.ok ? "bg-success-soft" : "bg-danger-soft", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className={cn("font-medium", result.ok ? "text-success-fg" : "text-danger-fg")}>
          {result.ok ? `Replied in ${result.latencyMs} ms` : "Test failed"}
        </span>
        <CopyButton value={text} label="Copy result" />
      </div>
      <pre className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words font-ui-mono text-text">{text}</pre>
      {quota.length > 0 && <p className="text-text-muted">{quota.join(" · ")}</p>}
    </div>
  );
}
