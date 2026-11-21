"use client";

import { cn } from "@/lib/cn";
import { Overlay, type OverlayProps } from "./Modal";

export type DrawerProps = OverlayProps;

/** Full-height side panel from the right, up to 460px wide (full width on phones). Same mechanics as Modal. */
export function Drawer({ className, ...props }: DrawerProps) {
  return (
    <Overlay
      {...props}
      className={cn(
        "inset-y-0 right-0 left-auto m-0 h-full max-h-none w-full max-w-115 border-y-0 border-r-0",
        "motion-safe:starting:open:translate-x-6 motion-safe:starting:open:opacity-0",
        className,
      )}
    />
  );
}
