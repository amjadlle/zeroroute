import { cloneElement, useId, type AriaAttributes, type ReactElement, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

type ControlProps = {
  id?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
};

type FieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  className?: string;
  /** Exactly one control (Input, Textarea, Select, PasswordInput, SearchInput or a native element). */
  children: ReactElement<ControlProps>;
};

/** Labels one control and wires id, aria-describedby (hint, error), aria-invalid and required into it. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const autoId = useId();
  const own = children.props;
  const id = own.id ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [own["aria-describedby"], hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-body font-medium text-text">
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-danger-fg">*</span>}
      </label>
      {cloneElement(children, {
        id,
        required: required || own.required,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : own["aria-invalid"],
      })}
      {hint && <p id={hintId} className="text-meta text-text-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="flex items-center gap-1.5 text-meta text-danger-fg">
          <CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
