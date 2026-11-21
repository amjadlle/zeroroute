"use client";

import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { useCopy, type CopyState } from "./useCopy";

type CopyButtonProps = {
  value: string;
  /** Idle label: the visible text, or the accessible name of the icon variant. */
  label?: string;
  variant?: "icon" | "text";
  onError?: (error: unknown) => void;
  className?: string;
};

const ICON = { idle: Copy, copied: Check, failed: X } as const;
const TONE: Record<CopyState, string> = { idle: "", copied: "text-success-fg", failed: "text-danger-fg" };

export function CopyButton({ value, label = "Copy", variant = "icon", onError, className }: CopyButtonProps) {
  const { copy, state } = useCopy({ onError });
  const text = state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : label;
  const Icon = ICON[state];
  const icon = <Icon aria-hidden className={cn("size-4", TONE[state])} />;
  const onClick = () => void copy(value);

  return (
    <>
      {variant === "icon" ? (
        <IconButton label={text} icon={icon} onClick={onClick} className={className} />
      ) : (
        <Button variant="secondary" size="sm" leftIcon={icon} onClick={onClick} className={className}>
          {text}
        </Button>
      )}
      {/* Announces the result: a button's name change is not read out by every screen reader. */}
      <span role="status" className="sr-only">
        {state === "idle" ? "" : text}
      </span>
    </>
  );
}
