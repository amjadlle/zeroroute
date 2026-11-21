"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Keeps a Tabs/SegmentedControl value in a URL search param: `const [tab, setTab] = useSearchParamValue("tab", "html")`.
 * Uses replace (no history entry per click). On a prerendered route wrap the caller in <Suspense>
 * (see useSearchParams in node_modules/next/dist/docs).
 */
export function useSearchParamValue(key: string, fallback: string) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const set = (next: string) => {
    const query = new URLSearchParams(params.toString());
    if (next === fallback) query.delete(key);
    else query.set(key, next);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return [params.get(key) ?? fallback, set] as const;
}
