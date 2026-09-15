"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { Mail, Lock, KeyRound, Eye, EyeOff, Loader2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password. Please check your code.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Auto redirect to /app
      setTimeout(() => {
        router.push("/app");
      }, 2000);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center py-4 animate-in fade-in duration-300">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Password Updated!</h3>
          <p className="text-xs text-slate-400">
            You are now logged in. Redirecting to your console…
          </p>
        </div>
        <Link
          href="/app"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg"
        >
          <span>Go to Console</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">Account Email</label>
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

      {/* 6-Digit OTP Field */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">6-Digit Reset Code</label>
        <div className="relative">
          <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            required
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl px-10 py-2.5 text-base sm:text-sm text-white font-mono tracking-widest placeholder-slate-500 outline-none transition-all touch-manipulation"
          />
        </div>
      </div>

      {/* New Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">New Password</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 6 characters"
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

      {/* Confirm New Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 block">Confirm New Password</label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl px-10 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 outline-none transition-all touch-manipulation"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-xl shadow-red-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed touch-manipulation"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Updating password…</span>
          </>
        ) : (
          <>
            <span>Set New Password &amp; Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Resend code */}
      <div className="pt-2 text-center text-xs text-slate-400">
        Didn&apos;t receive a code?{" "}
        <Link
          href="/forgot-password"
          className="text-red-400 hover:text-red-300 font-semibold transition-colors min-h-[44px] inline-flex items-center touch-manipulation"
        >
          Request new code
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Set a new password"
      subtitle="Enter the 6-digit code sent to your email to verify your identity"
    >
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
