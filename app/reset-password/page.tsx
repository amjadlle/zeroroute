"use client";

import { useRef, useState, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { MIN_PASSWORD_LENGTH } from "@/lib/constants";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatch, setMismatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const confirmRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    // Length is checked natively by minLength on the new password field.
    if (newPassword !== confirmPassword) {
      setMismatch(true);
      confirmRef.current?.focus();
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Could not reset your password. Check the code and try again.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="grid gap-4">
        <Alert tone="success" title="Password updated">You are signed in.</Alert>
        <Button href="/app" size="lg" className="w-full">Go to console</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && <Alert tone="danger">{error}</Alert>}

      <Field label="Email" required>
        <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      <Field label="Code" required hint="The 6-digit code from the email.">
        <Input
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          className="font-ui-mono tracking-widest"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
      </Field>

      <Field label="New password" required hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}>
        <PasswordInput
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </Field>

      <Field label="Confirm new password" required error={mismatch ? "Passwords do not match." : undefined}>
        <PasswordInput
          ref={confirmRef}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setMismatch(false);
          }}
        />
      </Field>

      <Button type="submit" size="lg" loading={loading} className="w-full">Set password and sign in</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Set a new password"
      subtitle="Enter the code we emailed you."
      footer={<>No code? <Button variant="link" href="/forgot-password">Send a new one</Button></>}
    >
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
