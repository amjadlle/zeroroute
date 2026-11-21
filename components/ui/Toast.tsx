"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

const TONES = {
  success: { Icon: CircleCheck, color: "text-success" },
  info: { Icon: Info, color: "text-info" },
  warning: { Icon: TriangleAlert, color: "text-warning" },
  danger: { Icon: CircleAlert, color: "text-danger" },
} as const;

export type ToastOptions = {
  tone?: keyof typeof TONES;
  /** For example Undo. Clicking it runs onClick and dismisses the toast. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before auto-dismiss. Paused while hovered or focused. */
  duration?: number;
};

type ToastItem = ToastOptions & { id: number; message: ReactNode };
type ShowToast = (message: ReactNode, options?: ToastOptions) => number;

const ToastContext = createContext<ShowToast | null>(null);
let nextId = 0;

/** Mounted once by UiProviders. Toasts stack top-right (newest first), inside the safe area. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const show = useCallback<ShowToast>((message, options) => {
    const id = ++nextId;
    setToasts((all) => [{ ...options, id, message }, ...all]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-60 flex flex-col items-end gap-2"
        style={{
          padding: "max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) 0 max(1rem, env(safe-area-inset-left))",
        }}
      >
        {toasts.map((t) => <Toast key={t.id} {...t} onDismiss={() => dismiss(t.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ message, tone = "success", action, duration = 4000, onDismiss }: ToastItem & { onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(duration);

  useEffect(() => {
    if (paused) return;
    const started = Date.now();
    const timer = setTimeout(onDismiss, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, onDismiss]);

  const { Icon, color } = TONES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full items-center gap-2.5 rounded-control border border-border bg-surface py-2.5 pr-2 pl-3.5 font-ui text-body text-text shadow-overlay sm:w-90",
        "motion-safe:transition motion-safe:duration-200 motion-safe:ease-out motion-safe:starting:-translate-y-1.5 motion-safe:starting:opacity-0",
      )}
    >
      <Icon className={cn("size-4 shrink-0", color)} aria-hidden />
      <p className="min-w-0 flex-1">{message}</p>
      {action && (
        <Button variant="ghost" size="sm" onClick={() => { action.onClick(); onDismiss(); }}>{action.label}</Button>
      )}
      <IconButton label="Dismiss" icon={<X className="size-4" aria-hidden />} onClick={onDismiss} />
    </div>
  );
}

/** `const toast = useToast(); toast("Saved"); toast("Couldn't save", { tone: "danger" });` */
export function useToast(): ShowToast {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast() needs <UiProviders> (or <ToastProvider>) above it.");
  return toast;
}
