import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BUTTON_BASE, BUTTON_VARIANTS } from "./Button";

const SIZES = { md: "size-control-md", lg: "size-control-lg" } as const;

export type IconButtonProps = Omit<ComponentPropsWithRef<"button">, "children" | "aria-label" | "title"> & {
  /** Accessible name and hover tooltip. Required: an icon alone says nothing to a screen reader. */
  label: string;
  icon: ReactNode;
  variant?: Exclude<keyof typeof BUTTON_VARIANTS, "link">;
  size?: keyof typeof SIZES;
};

/** Square icon-only button: 32px (md) / 36px (lg), growing to 44px on touch screens. */
export function IconButton({ label, icon, variant = "ghost", size = "md", type = "button", className, ...rest }: IconButtonProps) {
  return (
    <button
      {...rest}
      type={type}
      aria-label={label}
      title={label}
      className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], SIZES[size], "pointer-coarse:size-11", className)}
    >
      {icon}
    </button>
  );
}
