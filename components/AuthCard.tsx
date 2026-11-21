import Link from "next/link";
import type { ReactNode } from "react";
import { BrandMark } from "@/components/shell/BrandMark";
import { ThemeScript } from "@/components/shell/ThemeToggle";
import { Card } from "@/components/ui/Card";

type AuthCardProps = {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Links under the card, e.g. "Back to sign in". */
  footer?: ReactNode;
};

/** Centered card shared by the login, forgot-password and reset-password pages. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    // bg-bg covers the landing page's body background and grid, so the console tokens show in both themes.
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg px-4 py-10 font-ui text-body text-text">
      <ThemeScript />
      <Link
        href="/"
        aria-label="ZeroRoute home"
        className="rounded-control px-1 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
      >
        <BrandMark size="lg" tagline="Zero cost. Max route." />
      </Link>
      <Card className="grid w-full max-w-sm gap-5 p-6 shadow-raised">
        <div className="grid gap-1">
          <h1 className="text-heading font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="text-text-muted">{subtitle}</p>}
        </div>
        {children}
      </Card>
      {footer && <div className="text-center text-text-muted">{footer}</div>}
    </main>
  );
}
