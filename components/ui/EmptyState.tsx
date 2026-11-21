import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Usually one Button that fixes the emptiness. */
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("grid justify-items-center gap-2 px-5 py-10 text-center", className)}>
      {Icon && <Icon aria-hidden className="size-7 text-text-subtle" />}
      <h3 className="text-body font-semibold text-text">{title}</h3>
      {description && <p className="max-w-prose text-body text-text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
