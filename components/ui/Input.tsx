import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Shared look for Input, Textarea and Select. text-base (16px) below md stops iOS zoom-on-focus;
 * md and up use the console body size. Disabled keeps token text colours (no opacity) so it stays AA.
 */
export const controlClass = cn(
  "w-full min-w-0 rounded-control border border-border-strong bg-surface-sunken px-3 text-base md:text-body text-text",
  "placeholder:text-text-subtle transition-colors hover:border-text-subtle",
  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring",
  "aria-invalid:border-danger aria-invalid:focus-visible:outline-danger",
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface disabled:text-text-muted",
);

/** Read-only text fields: same text colour (people copy from them), flatter frame. Not for <select>, which is always :read-only. */
export const readOnlyClass = "read-only:border-border read-only:bg-surface read-only:hover:border-border";

export type InputProps = ComponentProps<"input"> & { leftIcon?: ReactNode };

export function Input({ leftIcon, className, ...props }: InputProps) {
  const input = (
    <input className={cn(controlClass, readOnlyClass, "h-control-md", leftIcon != null && "pl-8", className)} {...props} />
  );
  if (leftIcon == null) return input;
  return (
    <div className="relative">
      <span aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 flex -translate-y-1/2 text-text-subtle *:size-4">
        {leftIcon}
      </span>
      {input}
    </div>
  );
}
