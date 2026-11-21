import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type SectionHeaderProps = {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
};

/** Icon tile, title, description and actions: the header above a group of cards or a table. */
export function SectionHeader({ icon: Icon, title, description, actions, as: Heading = "h2", className }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {Icon && (
        <span className="grid size-9 shrink-0 place-items-center rounded-control border border-border bg-surface-sunken text-text-muted">
          <Icon aria-hidden className="size-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Heading className="text-title font-semibold text-text">{title}</Heading>
        {description && <p className="text-body text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
