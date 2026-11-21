"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";

export type AccountValues = { company: string; website: string; password: string };

/** Same minimum the signup and reset routes enforce. */
export const MIN_PASSWORD = 6;

type AccountStepProps = {
  value: AccountValues;
  onChange: (value: AccountValues) => void;
  onSubmit: () => void;
  saving?: boolean;
  actions?: ReactNode;
};

/** Company details and an optional new password. Validates before the caller saves. */
export function AccountStep({ value, onChange, onSubmit, saving, actions }: AccountStepProps) {
  const [touched, setTouched] = useState(false);
  const set = (patch: Partial<AccountValues>) => onChange({ ...value, ...patch });
  const errors = {
    company: value.company.trim() ? undefined : "Enter your company or project name.",
    password: value.password && value.password.length < MIN_PASSWORD ? `Use at least ${MIN_PASSWORD} characters.` : undefined,
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!errors.company && !errors.password) onSubmit();
  };

  return (
    <form className="grid gap-4" onSubmit={submit} noValidate>
      <Field label="Company or project name" required error={touched ? errors.company : undefined}>
        <Input value={value.company} onChange={(e) => set({ company: e.target.value })} maxLength={100} autoComplete="organization" placeholder="Acme Cloud" />
      </Field>
      <Field label="Website" hint="Optional. Where your chatbot will live.">
        <Input value={value.website} onChange={(e) => set({ website: e.target.value })} maxLength={255} inputMode="url" autoComplete="url" placeholder="https://example.com" />
      </Field>
      <Field
        label="Password"
        hint={`Lets you sign in with your email. At least ${MIN_PASSWORD} characters. Leave empty to keep your current password.`}
        error={touched ? errors.password : undefined}
      >
        <PasswordInput value={value.password} onChange={(e) => set({ password: e.target.value })} autoComplete="new-password" />
      </Field>
      <div className="flex flex-wrap items-center gap-2 pt-2">
        <Button type="submit" loading={saving}>Save and continue</Button>
        {actions}
      </div>
    </form>
  );
}
