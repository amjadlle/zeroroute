import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const TONE = {
  info: { Icon: Info, box: "bg-info-soft", icon: "text-info-fg" },
  success: { Icon: CircleCheck, box: "bg-success-soft", icon: "text-success-fg" },
  warning: { Icon: TriangleAlert, box: "bg-warning-soft", icon: "text-warning-fg" },
  danger: { Icon: CircleAlert, box: "bg-danger-soft", icon: "text-danger-fg" },
} as const;

type AlertProps = {
  tone?: keyof typeof TONE;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/** Inline banner. Danger interrupts screen readers (role="alert"); other tones are polite (role="status"). */
export function Alert({ tone = "info", title, children, className }: AlertProps) {
  const { Icon, box, icon } = TONE[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-card px-3.5 py-3 text-body text-text", box, className)}
    >
      <Icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", icon)} />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
