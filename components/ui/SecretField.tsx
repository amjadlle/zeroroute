"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { CopyButton } from "./CopyButton";
import { IconButton } from "./IconButton";

type SecretFieldProps = {
  value: string;
  /** What the secret is, e.g. "API key". Names the reveal and copy buttons. */
  label: string;
  onCopyError?: (error: unknown) => void;
  className?: string;
};

// Fixed length, so the mask does not leak how long the secret is.
const DOTS = "••••••••••••";

/** Masked secret (last 4 characters visible) with reveal and copy. */
export function SecretField({ value, label, onCopyError, className }: SecretFieldProps) {
  const [revealed, setRevealed] = useState(false);
  // Short values stay fully masked: four visible characters would give most of them away.
  const tail = value.length > 8 ? value.slice(-4) : "";
  const Icon = revealed ? EyeOff : Eye;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-1 rounded-control border border-border bg-surface-sunken py-0.5 pr-0.5 pl-3",
        className,
      )}
    >
      <code className="min-w-0 flex-1 truncate font-ui-mono text-body text-text">
        {revealed ? (
          value
        ) : (
          <>
            <span aria-hidden>{DOTS}</span>
            <span className="sr-only">{tail ? `${label} hidden, ending in ` : `${label} hidden`}</span>
            {tail}
          </>
        )}
      </code>
      <IconButton
        label={`Show ${label}`}
        aria-pressed={revealed}
        icon={<Icon aria-hidden className="size-4" />}
        onClick={() => setRevealed(!revealed)}
      />
      <CopyButton value={value} label={`Copy ${label}`} onError={onCopyError} />
    </div>
  );
}
