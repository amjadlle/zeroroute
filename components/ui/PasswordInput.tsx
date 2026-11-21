"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { Input, type InputProps } from "./Input";

/** Password field with a show/hide toggle. The toggle keeps one label and reports state via aria-pressed. */
export function PasswordInput({ className, ...props }: Omit<InputProps, "type">) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} className={cn("pr-9", className)} />
      <button
        type="button"
        aria-label="Show password"
        aria-pressed={shown}
        disabled={props.disabled}
        onClick={() => setShown((s) => !s)}
        className="absolute right-0.5 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-control text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed"
      >
        <Icon aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
