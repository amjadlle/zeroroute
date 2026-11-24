import Image from "next/image";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: { mark: "size-6", px: 24, word: "text-body" },
  md: { mark: "size-6.5", px: 26, word: "text-body-lg" },
  lg: { mark: "size-9", px: 36, word: "text-title" },
} as const;

type BrandMarkProps = {
  size?: keyof typeof SIZES;
  /** Optional line under the wordmark, e.g. "Admin console". Rendered at text-meta (12px, the minimum). */
  tagline?: string;
  className?: string;
};

/** ZeroRoute logo: the brand bolt (public/logo.png, same as the landing page) plus the wordmark. */
export function BrandMark({ size = "md", tagline, className }: BrandMarkProps) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-ui", className)}>
      <Image src="/logo.png" alt="" width={s.px} height={s.px} className={cn("shrink-0 object-contain", s.mark)} />
      <span className="flex min-w-0 flex-col">
        <span className={cn("font-bold tracking-tight text-text", s.word)}>ZeroRoute</span>
        {tagline && <span className="truncate text-meta text-text-subtle">{tagline}</span>}
      </span>
    </span>
  );
}
