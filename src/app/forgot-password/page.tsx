"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { KeyRound, ArrowLeft, ExternalLink } from "lucide-react";

export default function ForgotPasswordPage() {
  const { showToast } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    resetPath?: string | null;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Could not generate reset token", "error");
        return;
      }
      setResult({
        message: json.message,
        resetPath: json.data?.resetPath || null,
      });
    } catch {
      showToast("Network error", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white rounded-3xl border border-[#E6E1DA] p-7 sm:p-9 space-y-6 shadow-xs">
        <div className="space-y-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#3B2B25] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
          <div className="w-11 h-11 rounded-2xl bg-[#F3EFEA] text-[#3B2B25] flex items-center justify-center mt-2">
            <KeyRound className="w-5 h-5" />
          </div>
          <h1 className="font-serif-display text-2xl font-semibold text-[#3B2B25]">
            Password Recovery
          </h1>
          <p className="text-xs text-[#737373] leading-relaxed">
            Enter your account email to generate a cryptographically hashed,
            time-limited password reset token in the database.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="fp-email"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              Account Email Address
            </label>
            <input
              id="fp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="clara@reusehub.demo"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:border-[#3B2B25]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] disabled:opacity-50"
          >
            {submitting ? "Generating Token..." : "Generate Reset Token"}
          </button>
        </form>

        {result && (
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] space-y-3">
            <p className="text-xs text-[#242424] leading-relaxed">
              {result.message}
            </p>
            {result.resetPath && (
              <Link
                href={result.resetPath}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3B2B25] text-white text-xs font-semibold"
              >
                <span>Open Password Reset Link</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
