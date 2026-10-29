"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Recycle, ArrowRight, Sparkles } from "lucide-react";

const DEMO_ACCOUNTS = [
  {
    label: "Clara Vance (Portland Seller)",
    email: "clara@reusehub.demo",
    password: "Password123!",
  },
  {
    label: "Marcus Chen (Seattle Audio/Gear)",
    email: "marcus@reusehub.demo",
    password: "Password123!",
  },
  {
    label: "Elena Rostova (Austin Collector)",
    email: "elena@reusehub.demo",
    password: "Password123!",
  },
  {
    label: "Julian Mercer (Admin)",
    email: "admin@reusehub.demo",
    password: "Password123!",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser, showToast } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.message || "Invalid email or password");
        showToast(json.message || "Sign in failed", "error");
        return;
      }

      await refreshUser();
      showToast(`Welcome back, ${json.data.user.fullName}!`, "success");
      router.push("/dashboard");
    } catch {
      setErrorMsg("Network error while signing in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E6E1DA] p-7 sm:p-9 space-y-6 shadow-xs">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#3B2B25] text-[#FAF8F5] flex items-center justify-center mx-auto">
            <Recycle className="w-6 h-6" />
          </div>
          <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25]">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-[#737373]">
            Sign in to manage your listings, saved items, and buyer–seller
            messages.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-[#FDF3F2] border border-[#F5C6C2] text-xs font-medium text-[#8E261B]">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="text-xs font-semibold text-[#242424]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[#3B2B25] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{submitting ? "Signing In..." : "Sign In"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Development Demo Credentials Box */}
        <div className="pt-4 border-t border-[#E6E1DA] space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6D8065]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick-Fill Demo Accounts (Dev Environment)</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_ACCOUNTS.map((acct) => (
              <button
                key={acct.email}
                type="button"
                onClick={() => {
                  setEmail(acct.email);
                  setPassword(acct.password);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#E6E1DA] text-xs flex items-center justify-between transition-colors"
              >
                <span className="font-medium text-[#242424]">{acct.label}</span>
                <span className="font-mono-price text-[11px] text-[#9A8174]">
                  {acct.email}
                </span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-[#737373] pt-2">
          New to ReUseHub?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#3B2B25] hover:underline"
          >
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  );
}
