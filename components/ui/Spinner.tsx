import { cn } from "@/lib/cn";

const SIZES = { sm: "size-3.5 border-2", md: "size-4 border-2", lg: "size-6 border-3" } as const;

export type SpinnerProps = {
  size?: keyof typeof SIZES;
  /** Announced to screen readers (role="status"). Leave out when the parent already says it is busy. */
  label?: string;
  className?: string;
};

/** A ring in the current text colour. Spins under reduced motion too: it is the only sign of progress. */
export function Spinner({ size = "md", label, className }: SpinnerProps) {
  return (
    <span
      {...(label ? { role: "status", "aria-label": label } : { "aria-hidden": true })}
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent",
        SIZES[size],
        className,
      )}
    />
  );
}
