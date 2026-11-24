"use client";

import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { NavItem } from "./ConsoleShell";

export type PaletteAction = { label: string; icon?: ReactNode; run: () => void };

type Entry = { key: string; label: string; icon?: ReactNode; kind: "Page" | "Action"; choose: () => void };

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pages: readonly NavItem[];
  actions?: readonly PaletteAction[];
};

const TYPING = 'input, textarea, [contenteditable]:not([contenteditable="false"])';

/**
 * Ctrl/Cmd+K palette over the shell's pages and extra actions. Combobox + listbox with
 * aria-activedescendant: focus stays in the input while ArrowUp/Down move the highlight.
 */
export function CommandPalette({ open, onOpenChange, pages, actions = [] }: CommandPaletteProps) {
  const onHotkey = useEffectEvent((e: globalThis.KeyboardEvent) => {
    if (e.key.toLowerCase() !== "k" || !(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const target = e.target instanceof Element ? e.target : null;
    // Leave Ctrl+K to the field the user is typing in, except the palette's own input.
    if (target?.closest(TYPING) && !target.closest("[data-command-palette]")) return;
    e.preventDefault();
    onOpenChange(!open);
  });

  useEffect(() => {
    document.addEventListener("keydown", onHotkey);
    return () => document.removeEventListener("keydown", onHotkey);
  }, []);

  return (
    // Opens straight on the search field, a little above centre (Graphite+ prototype).
    <Modal open={open} onClose={() => onOpenChange(false)} title="Search or jump to" hideHeader className="mt-[12vh] max-w-140">
      {/* Mounted only while open, so every open starts with an empty query. */}
      {open && <PaletteBody pages={pages} actions={actions} close={() => onOpenChange(false)} />}
    </Modal>
  );
}

function PaletteBody({ pages, actions, close }: { pages: readonly NavItem[]; actions: readonly PaletteAction[]; close: () => void }) {
  const router = useRouter();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  // showModal() runs in the parent's effect after this one and focuses the first button, so wait a microtask.
  useEffect(() => queueMicrotask(() => input.current?.focus()), []);

  const entries: Entry[] = [
    ...pages.map((p): Entry => ({ key: `p:${p.href}`, label: p.label, icon: p.icon, kind: "Page", choose: () => router.push(p.href) })),
    ...actions.map((a, i): Entry => ({ key: `a:${i}`, label: a.label, icon: a.icon, kind: "Action", choose: a.run })),
  ];
  const q = query.trim().toLowerCase();
  const results = q ? entries.filter((e) => e.label.toLowerCase().includes(q)) : entries;
  const current = Math.min(active, results.length - 1);
  const optionId = (i: number) => `${id}-opt-${i}`;

  const choose = (entry: Entry | undefined) => {
    if (!entry) return;
    close();
    entry.choose();
  };

  const move = (to: number) => {
    const next = (to + results.length) % results.length;
    setActive(next);
    document.getElementById(optionId(next))?.scrollIntoView?.({ block: "nearest" });
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length) move(current + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(results[current]);
    } else if (e.key === "Escape") {
      e.preventDefault(); // stops the dialog's own cancel so close() runs once
      close();
    }
  };

  return (
    <div data-command-palette className="grid gap-2">
      <div className="flex h-control-lg items-center gap-2 rounded-control border border-border-strong bg-surface-sunken px-2.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-focus-ring">
        <Search aria-hidden className="size-4 shrink-0 text-text-subtle" />
        <input
          ref={input}
          role="combobox"
          aria-label="Search pages and actions"
          aria-expanded
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={results.length ? optionId(current) : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder="Type a page or action…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setActive(0); }}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-body text-text outline-none placeholder:text-text-subtle"
        />
        <kbd className="rounded-sm border border-border bg-surface px-1.5 font-ui-mono text-meta text-text-muted">Esc</kbd>
      </div>
      <ul id={`${id}-list`} role="listbox" aria-label="Results" className="-mx-1 max-h-80 overflow-y-auto">
        {results.map((entry, i) => (
          <li
            key={entry.key}
            id={optionId(i)}
            role="option"
            aria-selected={i === current}
            onClick={() => choose(entry)}
            onMouseMove={() => i !== current && setActive(i)}
            className="flex h-control-lg cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-text-muted aria-selected:bg-accent-soft aria-selected:text-text"
          >
            <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">{entry.icon}</span>
            <span className="min-w-0 flex-1 truncate">{entry.label}</span>
            <span className="text-meta text-text-subtle">{entry.kind}</span>
          </li>
        ))}
      </ul>
      {!results.length && <p role="status" className="px-1.5 py-3 text-text-muted">No pages or actions match “{query}”.</p>}
    </div>
  );
}
