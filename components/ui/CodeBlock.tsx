"use client";

import { WrapText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { CopyButton } from "./CopyButton";
import { IconButton } from "./IconButton";

type CodeBlockProps = {
  code: string;
  /** Shown as a label in the toolbar, e.g. "html" or "bash". */
  language?: string;
  className?: string;
};

/** Plain-text code with copy and a wrap toggle. Scrolls horizontally when not wrapped. */
export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [wrap, setWrap] = useState(false);
  return (
    <div className={cn("min-w-0 overflow-hidden rounded-card border border-border bg-surface-sunken", className)}>
      <div className="flex items-center gap-1 border-b border-border py-0.5 pr-0.5 pl-3">
        <span className="min-w-0 flex-1 truncate font-ui-mono text-meta text-text-subtle">{language}</span>
        <IconButton
          label="Wrap lines"
          aria-pressed={wrap}
          icon={<WrapText aria-hidden className="size-4" />}
          onClick={() => setWrap(!wrap)}
          className="aria-pressed:bg-surface aria-pressed:text-text"
        />
        <CopyButton value={code} label="Copy code" />
      </div>
      {/* Focusable so keyboard users can scroll long lines. */}
      <pre
        tabIndex={0}
        className={cn(
          "overflow-x-auto p-4 font-ui-mono text-body text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring",
          wrap ? "whitespace-pre-wrap break-words" : "whitespace-pre",
        )}
      >
        <code className="font-ui-mono">{code}</code>
      </pre>
    </div>
  );
}
