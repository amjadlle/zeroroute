"use client";

import { useState, type FormEvent } from "react";
import { AuthCard } from "@/components/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const resetHref = `/reset-password?email=${encodeURIComponent(email)}`;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      setLoading(false);

      if (!res.ok) {
        setError(data.error || "Could not send a reset code. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We'll email you a 6-digit code."
      footer={<Button variant="link" href="/login">Back to sign in</Button>}
    >
      {sent ? (
        <div className="grid gap-4">
          <Alert tone="success" title="Check your email">
            If an account exists for <strong className="break-all">{email}</strong>, we sent a code. It expires in 15 minutes.
          </Alert>
          <Button href={resetHref} size="lg" className="w-full">Enter code</Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Email" required>
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit" size="lg" loading={loading} className="w-full">Send code</Button>
        </form>
      )}
    </AuthCard>
  );
}
