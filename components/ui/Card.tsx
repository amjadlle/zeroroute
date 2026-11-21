import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type DivProps = HTMLAttributes<HTMLDivElement>;

/** Surface for grouped content. Compose with CardHeader, CardBody and CardFooter. */
export function Card({ className, ...props }: DivProps) {
  return <div className={cn("min-w-0 rounded-card border border-border bg-surface text-text", className)} {...props} />;
}

type CardHeaderProps = Omit<DivProps, "title"> & {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons or links shown on the right. */
  actions?: ReactNode;
  /** Heading level for the title; pick the one that fits the page outline. */
  as?: "h2" | "h3";
};

export function CardHeader({ title, description, actions, as: Heading = "h2", className, ...props }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center gap-2.5 border-b border-border px-4.5 py-3.5", className)} {...props}>
      <div className="min-w-0 flex-1">
        <Heading className="text-body font-semibold">{title}</Heading>
        {description && <p className="text-meta text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: DivProps) {
  return <div className={cn("p-4.5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: DivProps) {
  return <div className={cn("flex items-center justify-end gap-2 border-t border-border px-4.5 py-3", className)} {...props} />;
}
