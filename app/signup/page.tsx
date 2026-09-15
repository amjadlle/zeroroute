"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/AuthCard";
import { User, Mail, Lock, Building, Eye, EyeOff, Loader2, AlertCircle, Sparkles, Check, ArrowRight } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score === 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-emerald-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-400" };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please check your information.");
        setLoading(false);
        return;
      }

      // Success -> Redirect to /app
      router.push("/app");
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start your 3-day free trial with 10 free AI cloud providers"
    >
      {/* Risk-free trial banner */}
      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
        <Sparkles className="w-4 h-4 shrink-0" />
        <span className="font-semibold">3-Day Free Trial Included • Instant Setup</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Full Name Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 block">Full Name</label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amjad P A"
              className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl px-10 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 outline-none transition-all touch-manipulation"
            />
          </div>
        </div>

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

        {/* Company / Project (Optional) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 block">
            Company or Project <span className="text-slate-500 font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Acme AI"
              className="w-full bg-[#080a0f] border border-dark-border focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 rounded-xl px-10 py-2.5 text-base sm:text-sm text-white placeholder-slate-500 outline-none transition-all touch-manipulation"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 block">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-1 pt-1">
              <div className="flex gap-1 h-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`flex-1 rounded-full transition-colors ${
                      step <= strength.score ? strength.color : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <div className="text-[10px] text-slate-400 text-right">
                Strength: <span className="font-semibold text-slate-200">{strength.label}</span>
              </div>
            </div>
          )}
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
              <span>Creating your account…</span>
            </>
          ) : (
            <>
              <span>Start 3-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Link to Login */}
        <div className="pt-2 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-white hover:text-red-400 font-bold underline underline-offset-4 transition-colors min-h-[44px] inline-flex items-center touch-manipulation"
          >
            Sign in →
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
