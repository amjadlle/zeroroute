import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

/** Centred spinner for a whole page or panel while its data loads. */
export function PageLoader({ label = "Loading", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex min-h-60 w-full items-center justify-center text-text-muted", className)}>
      <Spinner size="lg" label={label} />
    </div>
  );
}
