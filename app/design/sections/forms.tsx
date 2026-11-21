"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { Textarea } from "@/components/ui/Textarea";

// Live examples for issue #4.
export default function FormControlsSection() {
  const [email, setEmail] = useState("not-an-email");
  // Validates live so the error state is visible on load.
  const emailError = !/^\S+@\S+\.\S+$/.test(email) ? "Enter an email like you@company.com" : undefined;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form noValidate onSubmit={(e) => e.preventDefault()} className="grid gap-4 rounded-card border border-border bg-surface p-5">
        <h3 className="text-title font-semibold">Sample form</h3>
        <Field label="Chatbot name" hint="Shown in the chat header." required>
          <Input placeholder="Support bot" />
        </Field>
        <Field label="Contact email" error={emailError} required>
          <Input type="email" leftIcon={<Mail />} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password">
          <PasswordInput autoComplete="new-password" />
        </Field>
        <Field label="Model">
          <Select defaultValue="auto">
            <option value="auto">Automatic routing</option>
            <option value="fast">Fastest available</option>
            <option value="cheap">Lowest cost</option>
          </Select>
        </Field>
        <Field label="Instructions" hint="Plain language works best.">
          <Textarea placeholder="Answer questions about our product…" />
        </Field>
        <Switch label="Show suggested questions" defaultChecked />
        <Checkbox label="Email me a weekly summary" />
        <button
          type="submit"
          className="h-control-md justify-self-start rounded-control bg-accent px-4 text-body font-medium text-accent-fg hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Save
        </button>
      </form>

      <div className="grid content-start gap-4 rounded-card border border-border bg-surface p-5">
        <h3 className="text-title font-semibold">Search and states</h3>
        <SearchInput aria-label="Search logs" placeholder="Search logs" />
        <Field label="Disabled input" hint="Not editable on the free plan.">
          <Input disabled defaultValue="free-plan-bot" />
        </Field>
        <Field label="Read-only API key">
          <Input readOnly defaultValue="zr_live_••••••••3f9a" className="font-ui-mono" />
        </Field>
        <Field label="Disabled select">
          <Select disabled defaultValue="auto"><option value="auto">Automatic routing</option></Select>
        </Field>
        <Field label="Disabled password">
          <PasswordInput disabled defaultValue="secret" />
        </Field>
        <Field label="Read-only notes">
          <Textarea readOnly defaultValue="Set by your administrator." />
        </Field>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Switch label="Disabled off" disabled />
          <Switch label="Disabled on" disabled defaultChecked />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <Checkbox label="Disabled" disabled />
          <Checkbox label="Disabled checked" disabled defaultChecked />
        </div>
      </div>
    </div>
  );
}
