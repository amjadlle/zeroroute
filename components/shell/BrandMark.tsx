import { Route } from "lucide-react";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: { mark: "size-6 rounded-control", icon: "size-3.5", word: "text-body" },
  md: { mark: "size-6.5 rounded-control", icon: "size-4", word: "text-body-lg" },
  lg: { mark: "size-9 rounded-card", icon: "size-5", word: "text-title" },
} as const;

type BrandMarkProps = {
  size?: keyof typeof SIZES;
  /** Optional line under the wordmark, e.g. "Admin console". Rendered at text-meta (12px, the minimum). */
  tagline?: string;
  className?: string;
};

/** ZeroRoute logo: accent tile with the route glyph plus the wordmark. */
export function BrandMark({ size = "md", tagline, className }: BrandMarkProps) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-ui", className)}>
      <span aria-hidden className={cn("grid shrink-0 place-items-center bg-accent text-accent-fg", s.mark)}>
        <Route className={s.icon} strokeWidth={2.2} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("font-bold tracking-tight text-text", s.word)}>ZeroRoute</span>
        {tagline && <span className="truncate text-meta text-text-subtle">{tagline}</span>}
      </span>
    </span>
  );
}
