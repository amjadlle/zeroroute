import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ConsoleShell, type NavGroup } from "./ConsoleShell";

const nav = vi.hoisted(() => ({ pathname: "/admin/providers", push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: nav.replace, refresh: nav.refresh }),
}));

const NAV: NavGroup[] = [
  {
    label: "Gateway",
    items: [
      { href: "/admin", label: "Overview", icon: null },
      { href: "/admin/providers", label: "Providers", icon: null, count: 7 },
      { href: "/admin/customers", label: "Customers", icon: null },
      { href: "/admin/logs", label: "Request log", icon: null },
    ],
  },
];

const ACCOUNT = { name: "ZeroRoute admin", plan: "Admin" };

function renderShell(props: Partial<Parameters<typeof ConsoleShell>[0]> = {}) {
  return render(
    <ConsoleShell consoleLabel="Admin" nav={NAV} account={ACCOUNT} {...props}>
      <input aria-label="Page field" />
    </ConsoleShell>,
  );
}

beforeEach(() => {
  nav.pathname = "/admin/providers";
  nav.push.mockClear();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

describe("ConsoleShell", () => {
  it("marks only the longest matching nav item as the current page", () => {
    nav.pathname = "/admin/logs/req_81f2";
    renderShell();
    const sidebar = screen.getByRole("navigation", { name: "Admin console" });
    expect(within(sidebar).getByRole("link", { name: "Request log" })).toHaveAttribute("aria-current", "page");
    expect(within(sidebar).getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
    const crumbs = within(screen.getByRole("navigation", { name: "Breadcrumb" }));
    expect(crumbs.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    expect(crumbs.getByText("Request log")).toBeInTheDocument();
  });

  it("links Docs in a new tab from the top bar", () => {
    renderShell();
    const docs = screen.getByRole("link", { name: /^Docs/ });
    expect(docs).toHaveAttribute("target", "_blank");
    expect(docs.getAttribute("rel")).toContain("noopener");
  });

  it("shows the console switch only for admins", () => {
    const { unmount } = renderShell();
    expect(screen.queryByRole("navigation", { name: "Switch console" })).toBeNull();
    unmount();
    renderShell({ consoleSwitch: true });
    const sw = screen.getByRole("navigation", { name: "Switch console" });
    expect(within(sw).getByRole("link", { name: "Admin console" })).toHaveAttribute("aria-current", "true");
    expect(within(sw).getByRole("link", { name: "Customer console" })).toHaveAttribute("href", "/app");
  });

  it("opens the mobile menu drawer with the same nav", async () => {
    renderShell();
    expect(screen.queryByRole("dialog")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));
    const drawer = screen.getByRole("dialog", { name: "Menu" });
    const links = within(within(drawer).getByRole("navigation", { name: "Admin console" })).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["Overview", "Providers7", "Customers", "Request log"]);
    expect(within(drawer).getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("cycles the theme System → Light → Dark → System on <html> and remembers it", async () => {
    renderShell();
    const root = document.documentElement;
    await userEvent.click(screen.getByRole("button", { name: /^Theme: System/ }));
    expect(root).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("zr-theme")).toBe("light");
    await userEvent.click(screen.getByRole("button", { name: /^Theme: Light/ }));
    expect(root).toHaveAttribute("data-theme", "dark");
    await userEvent.click(screen.getByRole("button", { name: /^Theme: Dark/ }));
    expect(root).not.toHaveAttribute("data-theme");
    expect(localStorage.getItem("zr-theme")).toBeNull();
  });

  it("has a skip link to the main landmark", () => {
    renderShell();
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });
});

describe("CommandPalette (through the shell)", () => {
  it("opens on Ctrl+K, but not while typing in a page input", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("textbox", { name: "Page field" }));
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("main"));
    await user.keyboard("{Control>}k{/Control}");
    const dialog = screen.getByRole("dialog", { name: "Search or jump to" });
    expect(screen.getByRole("combobox")).toHaveFocus();
    // Opens straight on the field: no visible title bar or close button.
    expect(within(dialog).queryByRole("button", { name: "Close" })).toBeNull();
  });

  it("opens from the search button and navigates with arrows + Enter", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: /Search or jump to/ }));
    const input = screen.getByRole("combobox");
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const selected = screen.getByRole("option", { selected: true });
    expect(selected).toHaveTextContent("Customers");
    expect(input).toHaveAttribute("aria-activedescendant", selected.id);
    await user.keyboard("{ArrowUp}{Enter}");
    expect(nav.push).toHaveBeenCalledWith("/admin/providers");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("filters pages and runs actions", async () => {
    const user = userEvent.setup();
    const run = vi.fn();
    renderShell({ paletteActions: [{ label: "Add knowledge", run }] });
    await user.keyboard("{Control>}k{/Control}");
    await user.keyboard("know");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Add knowledgeAction"]);
    await user.keyboard("{Enter}");
    expect(run).toHaveBeenCalledOnce();
    expect(nav.push).not.toHaveBeenCalled();
  });

  it("closes on Esc", async () => {
    const user = userEvent.setup();
    renderShell();
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
