import { cn } from "@/lib/cn";

/**
 * Loading placeholder; size it with className (e.g. "h-4 w-32"). Decorative: the loading region
 * should announce itself, e.g. aria-busy="true" on the container.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("rounded-control bg-border motion-safe:animate-pulse", className)} />;
}
