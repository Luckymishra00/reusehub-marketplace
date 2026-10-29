"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { KeyRound, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { showToast } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: params.token,
          password,
          confirmPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Invalid or expired reset token", "error");
        return;
      }
      showToast("Password reset! Please sign in.", "success");
      router.push("/login");
    } catch {
      showToast("Error resetting password", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white rounded-3xl border border-[#E6E1DA] p-7 sm:p-9 space-y-6 shadow-xs">
        <div className="space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-[#F3EFEA] text-[#3B2B25] flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="font-serif-display text-2xl font-semibold text-[#3B2B25]">
            Choose a New Password
          </h1>
          <p className="text-xs text-[#737373]">
            Enter a new password of at least 8 characters for your ReUseHub
            account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              New Password *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              Confirm New Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? "Updating..." : "Reset Password"}</span>
          </button>
        </form>

        <p className="text-center text-xs text-[#737373]">
          <Link href="/login" className="text-[#3B2B25] font-semibold">
            Return to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
