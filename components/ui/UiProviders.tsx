"use client";

import type { ReactNode } from "react";
import { ConfirmProvider } from "./ConfirmDialog";
import { ToastProvider } from "./Toast";

/** Mount once per screen tree: enables useToast() and useConfirm(). */
export function UiProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </ToastProvider>
  );
}
