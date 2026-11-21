"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/client/api";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";

type State<T> = { data?: T; error?: string; loading: boolean };

const message = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong.");

/**
 * GET an admin API once on mount; `reload()` fetches again and keeps the old data while it runs.
 * Each admin page loads what it needs, so there is no cross-page cache to go stale.
 */
export function useAdminData<T>(path: string) {
  const [state, setState] = useState<State<T>>({ loading: true });
  // Only the newest request may write state, so a slow older reply can't overwrite a newer one.
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    try {
      const data = await apiFetch<T>(path);
      if (id === latest.current) setState({ data, loading: false });
    } catch (e) {
      if (id === latest.current) setState((s) => ({ ...s, error: message(e), loading: false }));
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    await load();
  }, [load]);

  /** Replace the data with a mutation's response, skipping a refetch. */
  const setData = useCallback((data: T) => {
    latest.current++;
    setState({ data, loading: false });
  }, []);

  return { ...state, reload, setData };
}

/** The danger Alert every admin fetch error shows, with a retry button. */
export function LoadError({ what, error, onRetry }: { what: string; error: string; onRetry?: () => void }) {
  return (
    <Alert tone="danger" title={`Couldn't load ${what}`} className="mb-4">
      <p>{error}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Alert>
  );
}
