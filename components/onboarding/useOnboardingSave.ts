"use client";

import { useCallback, useState } from "react";
import { apiFetch } from "@/lib/client/api";

/**
 * Awaited step saves. `save` resolves true only when the server confirmed; on failure it keeps
 * the error for the step to show, and the caller keeps the user's input so they can retry.
 */
export function useOnboardingSave() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async (path: string, body: object): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(path, { method: "POST", body });
      return true;
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't save. Check your connection and try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { save, saving, error, clearError };
}
