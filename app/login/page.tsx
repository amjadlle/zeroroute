"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { Mail, Lock, User, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login";

  const [tab, setTab] = useState<"login" | "signup">(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (searchParams.get("tab") === "signup") {
      setTab("signup");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = tab === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const payload = tab === "signup" ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || `${tab === "signup" ? "Registration" : "Login"} failed. Please check your inputs.`);
        setLoading(false);
        return;
      }

      // Dynamic redirect based on role (Admin -> /admin, Customer -> /app)
      const target = data.redirect || (data.role === "admin" ? "/admin" : "/app");
      window.location.href = target;
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title={tab === "signup" ? "Create Free Account" : "Welcome back"}
      subtitle={
        tab === "signup"
          ? "500 requests/month included forever • No credit card needed"
          : "Sign in to your ZeroRoute Console or Master Admin"
      }
    >
      <div className="space-y-4">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#080a0f] border border-dark-border rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError("");
            }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              tab === "login" ? "bg-white/10 text-white font-bold shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setError("");
            }}
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === "signup" ? "bg-red-600/20 text-red-300 font-bold border border-red-500/30 shadow-sm" : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-3 h-3 text-red-400" />
            <span>Free Sign Up</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Name Field (Sign Up only) */}
          {tab === "signup" && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">Your Name / Organization</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Amjad / Acme Corp"
                  className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl px-10 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 outline-none transition-all touch-manipulation"
                />
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl px-10 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 outline-none transition-all touch-manipulation"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 block">Password</label>
              {tab === "login" && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors py-1 min-h-[36px] flex items-center touch-manipulation"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl pl-10 pr-12 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 outline-none transition-all touch-manipulation"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors touch-manipulation"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-sm font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-xl shadow-red-500/20 active:scale-95 transition-all cursor-pointer disabled:brightness-95 disabled:cursor-wait touch-manipulation drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-white font-bold">{tab === "signup" ? "Creating Account…" : "Signing in…"}</span>
              </>
            ) : (
              <>
                <span className="text-white font-bold">{tab === "signup" ? "Create Free Account (500 req/mo)" : "Sign In"}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>

          {/* Footer toggle note */}
          <div className="pt-2 text-center text-xs text-slate-400">
            {tab === "login" ? (
              <>
                New to ZeroRoute?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("signup");
                    setError("");
                  }}
                  className="text-white hover:text-red-400 font-bold underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Create free account (500 req/mo) →
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setTab("login");
                    setError("");
                  }}
                  className="text-white hover:text-red-400 font-bold underline underline-offset-4 transition-colors cursor-pointer"
                >
                  Sign in here →
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400 text-xs">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
