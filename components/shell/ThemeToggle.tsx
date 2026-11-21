"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

// The tokens read data-theme on <html> (see the globals.css header). No attribute = follow the OS.
const KEY = "zr-theme";
const ORDER = ["system", "light", "dark"] as const;
type Theme = (typeof ORDER)[number];
const META = {
  system: { label: "System", Icon: Monitor },
  light: { label: "Light", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
} as const;

const parse = (value: string | null): Theme => (value === "light" || value === "dark" ? value : "system");

function apply(theme: Theme) {
  if (theme === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}

// In-memory copy so the toggle still cycles when storage is blocked (private mode, sandboxed iframes).
let current: Theme | undefined;
const listeners = new Set<() => void>();

function getSnapshot(): Theme {
  if (current === undefined) {
    try { current = parse(localStorage.getItem(KEY)); } catch { current = "system"; }
  }
  return current;
}

function subscribe(onChange: () => void) {
  // Another tab changed the theme.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    current = parse(e.newValue);
    apply(current);
    onChange();
  };
  listeners.add(onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function setTheme(theme: Theme) {
  current = theme;
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch { /* storage blocked: the choice lasts for this page only */ }
  apply(theme);
  listeners.forEach((l) => l());
}

const SCRIPT = `try{var t=localStorage.getItem("${KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

/**
 * Applies the saved theme while the HTML is parsed, before first paint (no flash on hard loads).
 * Rendered first inside ConsoleShell. text/plain on the client keeps React from warning about
 * script tags; client navigations are covered by ThemeToggle's layout effect.
 * Pattern: node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
export function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: SCRIPT }}
    />
  );
}

/** Cycles System → Light → Dark and remembers the choice in localStorage. */
export function ThemeToggle() {
  // Server snapshot is "system", so hydration never mismatches; React re-renders with the stored value.
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "system" as Theme);
  // Re-apply after client navigations and React's dev remount, which clears attributes on <html>.
  useLayoutEffect(() => apply(getSnapshot()), []);

  const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
  const { label, Icon } = META[theme];
  return (
    <IconButton
      label={`Theme: ${label}. Switch to ${META[next].label.toLowerCase()}`}
      icon={<Icon className="size-4" aria-hidden />}
      onClick={() => setTheme(next)}
    />
  );
}
