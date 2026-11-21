import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { controlClass, readOnlyClass } from "./Input";

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(controlClass, readOnlyClass, "min-h-24 resize-y py-2", className)} {...props} />;
}
