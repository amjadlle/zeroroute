"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, LogOut, Menu, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { apiFetch, ApiError } from "@/lib/client/api";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { IconButton } from "@/components/ui/IconButton";
import { UiProviders } from "@/components/ui/UiProviders";
import { useToast } from "@/components/ui/Toast";
import { BrandMark } from "./BrandMark";
import { CommandPalette, type PaletteAction } from "./CommandPalette";
import { ThemeScript, ThemeToggle } from "./ThemeToggle";

/** `icon` is an element (e.g. `<House />`), not a component, so a Server Component layout can pass nav. */
export type NavItem = { href: string; label: string; icon: ReactNode; count?: number };
export type NavGroup = { label?: string; items: readonly NavItem[] };
export type ShellAccount = { name: string; plan: string };

export type ConsoleShellProps = {
  /** First breadcrumb, e.g. "Admin" or "Customer"; the sidebar nav is named "<label> console". */
  consoleLabel: string;
  nav: readonly NavGroup[];
  account: ShellAccount;
  /** True for admins only: shows the Customer console / Admin console switch. */
  consoleSwitch?: boolean;
  /** Top-bar buttons for the current page. */
  actions?: ReactNode;
  /** Extra Ctrl+K entries next to the nav pages. */
  paletteActions?: readonly PaletteAction[];
  /** /design previews only: fill the parent box instead of the viewport. */
  embedded?: boolean;
  children: ReactNode;
};

const CONSOLES = [
  { href: "/app", label: "Customer console" },
  { href: "/admin", label: "Admin console" },
] as const;

const DOCS_URL = "https://github.com/amjadlle/zeroroute#readme";

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus-ring";

const matches = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** Longest matching href wins, so /admin stays inactive on /admin/logs while /admin/logs/123 keeps Logs active. */
function findActive(pathname: string, items: readonly NavItem[]) {
  return items.filter((i) => matches(pathname, i.href)).sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * Sidebar + top bar + Ctrl K palette shared by both consoles (issue #9, Graphite+ / ADR 0001).
 * Mounts UiProviders, so screens inside can call useToast() and useConfirm() directly.
 */
export function ConsoleShell(props: ConsoleShellProps) {
  return (
    <UiProviders>
      <Shell {...props} />
    </UiProviders>
  );
}

function Shell({ consoleLabel, nav, account, consoleSwitch, actions, paletteActions, embedded, children }: ConsoleShellProps) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  // Close the drawer after any navigation (link click, Back, palette).
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  const items = nav.flatMap((g) => g.items);
  const active = findActive(pathname, items);
  const home = items[0]?.href ?? "/";
  const openPalette = () => { setMenuOpen(false); setPaletteOpen(true); };

  const sections = (
    <>
      {consoleSwitch && <ConsoleSwitch pathname={pathname} />}
      <button
        type="button"
        onClick={openPalette}
        aria-keyshortcuts="Control+K Meta+K"
        className={cn(
          "flex h-control-md w-full cursor-pointer items-center gap-1.5 rounded-control border border-border bg-surface px-2.5 text-left text-text-subtle hover:border-border-strong hover:text-text-muted",
          FOCUS,
        )}
      >
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="flex-1 truncate">Search or jump to…</span>
        <kbd className="rounded-sm border border-border bg-surface-sunken px-1 font-ui text-meta text-text-muted pointer-coarse:hidden">Ctrl K</kbd>
      </button>
      <NavGroups label={`${consoleLabel} console`} groups={nav} active={active} />
    </>
  );

  return (
    <div className={cn("flex bg-bg font-ui text-body text-text", embedded ? "h-full min-h-0" : "min-h-dvh")}>
      <ThemeScript />
      <a
        href="#main"
        className={cn(
          "sr-only z-50 rounded-control bg-surface-raised px-3 py-2 font-medium text-text shadow-raised focus:not-sr-only focus:fixed focus:top-2 focus:left-2",
          FOCUS,
        )}
      >
        Skip to content
      </a>

      <div
        className={cn(
          "hidden w-61 shrink-0 flex-col gap-3.5 overflow-y-auto border-r border-border bg-surface-sunken px-2.5 py-3.5 min-[820px]:flex",
          embedded ? "h-full" : "sticky top-0 h-dvh",
        )}
      >
        <Link href={home} className={cn("self-start rounded-control px-2 py-0.5", FOCUS)}>
          <BrandMark />
        </Link>
        {sections}
        <AccountBlock account={account} />
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", embedded && "overflow-y-auto")}>
        <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2.5 border-b border-border bg-bg/85 px-4 backdrop-blur-md">
          <IconButton
            label="Open menu"
            icon={<Menu className="size-4" aria-hidden />}
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            className="-ml-1.5 min-[820px]:hidden"
          />
          <nav aria-label="Breadcrumb" className="min-w-0">
            <ol className="flex items-center gap-1.5 text-text-subtle">
              <li className="max-[820px]:sr-only">
                <Link href={home} className={cn("rounded-sm hover:text-text", FOCUS)}>{consoleLabel}</Link>
              </li>
              {active && (
                <li className="flex min-w-0 items-center gap-1.5">
                  <ChevronRight aria-hidden className="size-3.5 shrink-0 max-[820px]:hidden" />
                  <span aria-current="page" className="truncate font-medium text-text">{active.label}</span>
                </li>
              )}
            </ol>
          </nav>
          <span className="flex-1" />
          {actions}
          <IconButton
            label="Search"
            icon={<Search className="size-4" aria-hidden />}
            onClick={openPalette}
            aria-keyshortcuts="Control+K Meta+K"
            className="min-[820px]:hidden"
          />
          <Button href={DOCS_URL} target="_blank" rel="noopener noreferrer" variant="ghost" size="sm">
            Docs<span className="sr-only"> (opens in a new tab)</span>
          </Button>
          <ThemeToggle />
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-295 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menu">
        {menuOpen && (
          <div className="flex min-h-full flex-col gap-3.5">
            {sections}
            <AccountBlock account={account} />
          </div>
        )}
      </Drawer>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} pages={items} actions={paletteActions} />
    </div>
  );
}

function ConsoleSwitch({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Switch console" className="grid grid-cols-2 gap-0.5 rounded-card border border-border bg-surface-sunken p-0.5">
      {CONSOLES.map((c) => {
        const current = matches(pathname, c.href);
        return (
          <Link
            key={c.href}
            href={c.href}
            aria-current={current ? "true" : undefined}
            className={cn(
              "flex h-control-sm items-center justify-center rounded-control px-2 text-meta font-medium whitespace-nowrap text-text-muted hover:text-text",
              "aria-[current=true]:bg-surface aria-[current=true]:text-text aria-[current=true]:shadow-sm aria-[current=true]:ring-1 aria-[current=true]:ring-border",
              FOCUS,
            )}
          >
            {c.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavGroups({ label, groups, active }: { label: string; groups: readonly NavGroup[]; active?: NavItem }) {
  return (
    <nav aria-label={label} className="grid gap-3">
      {groups.map((group, g) => (
        <div key={group.label ?? g} className="grid gap-px">
          {group.label && (
            <h2 className="px-2.5 py-1.5 text-meta font-semibold tracking-wider text-text-subtle uppercase">{group.label}</h2>
          )}
          <ul className="grid gap-px">
            {group.items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={item === active ? "page" : undefined}
                  className={cn(
                    "group flex h-control-md items-center gap-2.5 rounded-control px-2.5 font-medium text-text-muted hover:bg-surface hover:text-text pointer-coarse:h-11",
                    "aria-[current=page]:bg-surface aria-[current=page]:text-text aria-[current=page]:shadow-sm aria-[current=page]:ring-1 aria-[current=page]:ring-border",
                    FOCUS,
                  )}
                >
                  <span aria-hidden className="inline-flex size-4 shrink-0 items-center justify-center group-aria-[current=page]:text-accent [&>svg]:size-4">
                    {item.icon}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.count !== undefined && <span className="text-meta text-text-subtle tabular-nums">{item.count}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function AccountBlock({ account }: { account: ShellAccount }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const initials = account.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const signOut = async () => {
    setBusy(true);
    try {
      // 401 means the session is already gone: just go to the login page.
      await apiFetch("/api/auth/logout", { method: "POST", onUnauthorized: () => {} });
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        // Staying put beats landing on /login with a live cookie (the proxy would bounce back here).
        toast("Couldn't sign out. Check your connection and try again.", { tone: "danger" });
        setBusy(false);
        return;
      }
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="mt-auto flex items-center gap-2.5 p-2">
      <span aria-hidden className="grid size-7.5 shrink-0 place-items-center rounded-full bg-accent-soft text-meta font-bold text-accent">
        {initials || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold leading-tight">{account.name}</p>
        <p className="truncate text-meta text-text-subtle">{account.plan}</p>
      </div>
      <IconButton label="Sign out" icon={<LogOut className="size-4" aria-hidden />} onClick={signOut} disabled={busy} />
    </div>
  );
}
