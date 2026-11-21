import Link from "next/link";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

/** Shared by IconButton. Each variant sets its own border colour (cn() does not resolve class conflicts). Neutral hovers use surface-sunken: surface and surface-raised are both white in light. */
export const BUTTON_BASE =
  "relative inline-flex shrink-0 items-center justify-center rounded-control border font-ui font-medium whitespace-nowrap select-none transition-colors active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:pointer-events-none disabled:opacity-55";

export const BUTTON_VARIANTS = {
  primary: "border-transparent bg-accent text-accent-fg hover:bg-accent-hover",
  secondary: "border-border-strong bg-surface text-text hover:bg-surface-sunken",
  ghost: "border-transparent text-text-muted hover:bg-surface-sunken hover:text-text",
  danger: "border-transparent bg-danger text-white hover:brightness-110",
  link: "border-transparent text-accent underline-offset-2 hover:underline",
} as const;

const SIZES = {
  sm: "h-control-sm px-2.5 text-meta",
  md: "h-control-md px-3.5 text-body",
  lg: "h-control-lg px-4 text-body",
} as const;

type Common = {
  variant?: keyof typeof BUTTON_VARIANTS;
  /** Ignored by the link variant, which sizes to its text. */
  size?: keyof typeof SIZES;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export type ButtonProps =
  | (Common & ComponentPropsWithRef<"button"> & { href?: undefined; loading?: boolean })
  | (Common & ComponentPropsWithRef<"a"> & { href: string; loading?: never });

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", leftIcon, rightIcon, loading = false, className, children, ...rest } = props;
  const classes = cn(
    BUTTON_BASE,
    BUTTON_VARIANTS[variant],
    variant === "link" ? "text-body" : SIZES[size],
    className,
  );
  // opacity (not visibility) keeps the label in the accessibility tree and the width unchanged.
  const content = (
    <>
      <span className={cn("inline-flex items-center gap-1.5", loading && "opacity-0")}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={size === "lg" ? "md" : "sm"} />
        </span>
      )}
    </>
  );

  if (rest.href !== undefined) {
    // Next Link for in-app paths (client navigation, prefetch); a plain <a> for external, mailto: and #hash.
    return rest.href.startsWith("/") ? (
      <Link {...rest} href={rest.href} className={classes}>{content}</Link>
    ) : (
      <a {...rest} className={classes}>{content}</a>
    );
  }

  const { disabled, type = "button", ...button } = rest;
  return (
    <button
      {...button}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
    >
      {content}
    </button>
  );
}
