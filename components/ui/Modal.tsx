"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode, type SyntheticEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./IconButton";

export type OverlayProps = {
  open: boolean;
  /** Called on Esc, a backdrop click and the close button. The parent sets `open` to false. */
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  /** Hide the header (the title stays for screen readers), for dialogs that open straight on a field. */
  hideHeader?: boolean;
};

/**
 * Shared native-<dialog> mechanics for Modal and Drawer (not exported from the README list; use those).
 * showModal() gives the top layer, inert background and focus containment for free.
 * Known ceiling: toasts render below an open dialog's backdrop (top layer). Upgrade path: render the
 * toast region as a manual popover and re-show it after each modal opens.
 */
export function Overlay({ open, onClose, title, description, footer, children, className, hideHeader }: OverlayProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const onCloseRef = useRef(onClose);
  const shown = useRef(false);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const trigger = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    shown.current = true;
    return () => {
      shown.current = false;
      if (dialog.open) dialog.close();
      root.style.overflow = overflow;
      // Browsers that restore focus on close() already did; this covers the rest and unmount-while-open.
      if (trigger?.isConnected) trigger.focus();
    };
  }, [open]);

  // Esc fires `cancel`; keep the dialog open and let the parent decide via onClose.
  const onCancel = (e: SyntheticEvent) => {
    e.preventDefault();
    onCloseRef.current();
  };
  // The panel has no padding of its own, so a click whose target is the <dialog> itself hit the backdrop.
  const onClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) onCloseRef.current();
  };

  return (
    // The click handler is for the backdrop only; Esc (cancel) and the close button are the keyboard paths.
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={onCancel}
      // Chrome may close without a cancelable cancel (repeated Esc); keep the parent's state in sync.
      // `close` is queued, so one from our own effect cleanup can land after a Strict Mode remount
      // reopened the dialog; a dialog that is open again was not closed, so ignore it.
      onClose={(e) => shown.current && !e.currentTarget.open && onCloseRef.current()}
      onClick={onClick}
      className={cn(
        "flex-col overflow-hidden border border-border bg-surface p-0 font-ui text-body text-text shadow-overlay open:flex",
        "backdrop:bg-black/50 motion-safe:backdrop:backdrop-blur-xs",
        "motion-safe:transition motion-safe:duration-200 motion-safe:ease-out",
        className,
      )}
    >
      <header className={hideHeader ? "sr-only" : "flex items-start gap-3 px-5 pt-5 pb-3"}>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-title font-semibold">{title}</h2>
          {description && <p id={descriptionId} className="mt-1 text-text-muted">{description}</p>}
        </div>
        {!hideHeader && <IconButton label="Close" icon={<X className="size-4" aria-hidden />} onClick={onClose} className="-mt-1 -mr-2" />}
      </header>
      <div className={cn("flex-1 overflow-y-auto px-5 pb-5", hideHeader && "pt-5")}>{children}</div>
      {footer && (
        <footer className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-sunken px-5 py-3.5">
          {footer}
        </footer>
      )}
    </dialog>
  );
}

const SIZES = { sm: "max-w-sm", md: "max-w-120", lg: "max-w-2xl" } as const; // md = 480px

export type ModalProps = OverlayProps & { size?: keyof typeof SIZES };

/** Centred dialog (m-auto restores the UA margin Tailwind's preflight removes). inset-x-4 + w-auto keeps a 16px gutter on phones; max-w caps it on wide screens. */
export function Modal({ size = "md", className, ...props }: ModalProps) {
  return (
    <Overlay
      {...props}
      className={cn(
        "inset-x-4 m-auto w-auto rounded-card motion-safe:starting:open:translate-y-1.5 motion-safe:starting:open:opacity-0",
        SIZES[size],
        className,
      )}
    />
  );
}
