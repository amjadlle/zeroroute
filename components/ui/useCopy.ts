"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "failed";

type UseCopyOptions = {
  /** How long "copied" / "failed" stays before going back to idle, in ms. */
  resetAfter?: number;
  onError?: (error: unknown) => void;
};

/** Copies text to the clipboard and reports whether it worked. `copy` resolves to true on success. */
export function useCopy({ resetAfter = 2000, onError }: UseCopyOptions = {}) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(
    async (text: string) => {
      clearTimeout(timer.current);
      let ok = false;
      try {
        // Throws a TypeError where the Clipboard API is missing (insecure origin); caught below.
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (error) {
        onError?.(error);
      }
      setState(ok ? "copied" : "failed");
      timer.current = setTimeout(() => setState("idle"), resetAfter);
      return ok;
    },
    [resetAfter, onError],
  );

  return { copy, state };
}
