"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { Mail, Loader2, AlertCircle, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset code. Please try again.");
        setLoading(false);
        return;
      }

      setSent(true);
      setLoading(false);

      // Smooth delay then redirect to reset-password
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Reset your password"
      subtitle="We will send a 6-digit verification code to your email"
    >
      {sent ? (
        <div className="space-y-4 text-center py-4 animate-in fade-in duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Reset Code Sent!</h3>
            <p className="text-xs text-slate-400">
              We&apos;ve sent a 6-digit code to <strong className="text-white">{email}</strong>. Redirecting to verification…
            </p>
          </div>
          <Link
            href={`/reset-password?email=${encodeURIComponent(email)}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-300"
          >
            <span>Proceed to enter code</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 min-h-[44px] rounded-xl text-sm font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-xl shadow-red-500/20 active:scale-95 transition-all cursor-pointer disabled:brightness-95 disabled:cursor-wait touch-manipulation drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span className="text-white font-bold">Sending code…</span>
              </>
            ) : (
              <>
                <span className="text-white font-bold">Send Reset Code</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </>
            )}
          </button>

          {/* Back to Login */}
          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors min-h-[44px] px-3 touch-manipulation"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
