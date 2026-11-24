"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { Modal } from "./Modal";

export type ConfirmOptions = {
  title: ReactNode;
  body?: ReactNode;
  /** Defaults to "Confirm". Name the action: "Delete", "Cancel Pro". */
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  /** Runs on confirm. While its promise is pending the button spins; if it rejects the dialog stays open with the error. */
  onConfirm?: () => unknown;
};

export type ConfirmDialogProps = ConfirmOptions & {
  open: boolean;
  /** Called on cancel, Esc, backdrop click, and after onConfirm succeeds. */
  onClose: () => void;
};

export function ConfirmDialog({ open, onClose, title, body, confirmLabel = "Confirm", cancelLabel = "Cancel", tone = "default", onConfirm }: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (pending) return;
    setError(null);
    onClose();
  };

  const confirm = async () => {
    setPending(true);
    setError(null);
    try {
      await onConfirm?.();
      setPending(false);
      onClose();
    } catch (err) {
      setPending(false);
      setError(err instanceof Error && err.message ? err.message : "Something went wrong. Try again.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      description={body}
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={pending}>{cancelLabel}</Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} loading={pending} onClick={confirm}>{confirmLabel}</Button>
        </>
      }
    >
      {error && <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-danger-fg">{error}</p>}
    </Modal>
  );
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<Confirm | null>(null);

/** Mounted once by UiProviders. Renders one ConfirmDialog driven by useConfirm(). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const [open, setOpen] = useState(false);

  const confirm = useCallback<Confirm>((options) => new Promise((resolve) => {
    setRequest({ ...options, resolve });
    setOpen(true);
  }), []);

  const onClose = () => {
    setOpen(false);
    request?.resolve(false); // no-op after a successful confirm: a promise settles once
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && (
        <ConfirmDialog
          {...request}
          open={open}
          onClose={onClose}
          onConfirm={async () => {
            await request.onConfirm?.();
            request.resolve(true);
          }}
        />
      )}
    </ConfirmContext.Provider>
  );
}

/** Promise-based replacement for window.confirm(): `if (await confirm({ title: "Delete?" })) …`. */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm() needs <UiProviders> (or <ConfirmProvider>) above it.");
  return confirm;
}
