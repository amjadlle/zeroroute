"use client";

import { useState, Suspense, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useSearchParamValue } from "@/components/ui/useSearchParamValue";
import { MIN_PASSWORD_LENGTH, PLAN_LIMITS } from "@/lib/constants";
import { safeRedirectPath } from "@/lib/safeRedirect";

const MODES = [
  { value: "login", label: "Sign in" },
  { value: "signup", label: "Create account" },
] as const;

function LoginForm() {
  const searchParams = useSearchParams();
  // ?tab=signup opens the signup form (landing page links); switching keeps ?redirect= in the URL.
  const [tab, setTab] = useSearchParamValue("tab", "login");
  const signup = tab === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchTo = (next: string) => {
    setError("");
    setTab(next);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(signup ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signup ? { name, email, password } : { email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || (signup ? "Could not create your account. Please try again." : "Could not sign you in. Please try again."));
        setLoading(false);
        return;
      }

      // Back to the page that sent us here (same-origin paths only), else the role's console.
      const target = (!signup && safeRedirectPath(searchParams.get("redirect"))) || data.redirect || (data.role === "admin" ? "/admin" : "/app");
      window.location.href = target;
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={signup ? "Create your account" : "Welcome back"}
      subtitle={
        signup
          ? `Free plan: ${PLAN_LIMITS.free.monthlyRequests} requests a month. No card needed.`
          : "Sign in to your ZeroRoute console."
      }
      footer={
        signup ? (
          <>Already have an account? <Button variant="link" onClick={() => switchTo("login")}>Sign in</Button></>
        ) : (
          <>New to ZeroRoute? <Button variant="link" onClick={() => switchTo("signup")}>Create an account</Button></>
        )
      }
    >
      <SegmentedControl label="Account" options={MODES} value={tab} onValueChange={switchTo} className="w-full *:flex-1 *:justify-center" />

      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && <Alert tone="danger">{error}</Alert>}

        {signup && (
          <Field label="Name" hint="You or your company.">
            <Input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
        )}

        <Field label="Email" required>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>

        <div className="grid gap-1.5">
          <Field label="Password" required hint={signup ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}>
            <PasswordInput
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={signup ? MIN_PASSWORD_LENGTH : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {!signup && (
            <Button variant="link" href="/forgot-password" className="justify-self-end">
              Forgot password?
            </Button>
          )}
        </div>

        <Button type="submit" size="lg" loading={loading} className="w-full">
          {signup ? "Create account" : "Sign in"}
        </Button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
