"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Recycle, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { refreshUser, showToast } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const errs: Record<string, string> = {};
    if (fullName.trim().length < 2) {
      errs.fullName = "Full name must be at least 2 characters";
    }
    if (!email.includes("@")) {
      errs.email = "Please enter a valid email address";
    }
    if (password.length < 8) {
      errs.password = "Password must be at least 8 characters";
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match";
    }
    if (!acceptTerms) {
      errs.acceptTerms = "Please accept the Terms & Conditions";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          location: location.trim() || "Portland, OR",
          password,
          confirmPassword,
          acceptTerms,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (Array.isArray(json.errors)) {
          const map: Record<string, string> = {};
          json.errors.forEach((er: { field: string; message: string }) => {
            map[er.field] = er.message;
          });
          setFieldErrors(map);
        }
        setGeneralError(json.message || "Registration failed");
        showToast(json.message || "Registration failed", "error");
        return;
      }

      await refreshUser();
      showToast("Account created! Welcome to ReUseHub.", "success");
      router.push("/dashboard");
    } catch {
      setGeneralError("Network error while creating account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-[#E6E1DA] p-7 sm:p-9 space-y-6 shadow-xs">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#3B2B25] text-[#FAF8F5] flex items-center justify-center mx-auto">
            <Recycle className="w-6 h-6" />
          </div>
          <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25]">
            Join ReUseHub
          </h1>
          <p className="text-xs sm:text-sm text-[#737373]">
            Create an account to buy, sell, and swap pre-owned goods with
            verified community members.
          </p>
        </div>

        {generalError && (
          <div className="p-3.5 rounded-2xl bg-[#FDF3F2] border border-[#F5C6C2] text-xs font-medium text-[#8E261B]">
            {generalError}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label
              htmlFor="reg-name"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              Full Name *
            </label>
            <input
              id="reg-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Clara Vance"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
              required
            />
            {fieldErrors.fullName && (
              <p className="text-xs text-[#B93829] mt-1">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-email"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              Email Address *
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="clara@example.com"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
              required
            />
            {fieldErrors.email && (
              <p className="text-xs text-[#B93829] mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="reg-location"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              City & State (Optional)
            </label>
            <input
              id="reg-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Portland, OR"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-[#242424] mb-1.5"
              >
                Password (min 8 chars) *
              </label>
              <input
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
                required
              />
              {fieldErrors.password && (
                <p className="text-xs text-[#B93829] mt-1">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-confirm"
                className="block text-xs font-semibold text-[#242424] mb-1.5"
              >
                Confirm Password *
              </label>
              <input
                id="reg-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
                required
              />
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-[#B93829] mt-1">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#5C534E]">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded accent-[#3B2B25]"
              />
              <span>
                I agree to ReUseHub&apos;s{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-[#3B2B25] underline"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-[#3B2B25] underline"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
            {fieldErrors.acceptTerms && (
              <p className="text-xs text-[#B93829] mt-1">
                {fieldErrors.acceptTerms}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{submitting ? "Creating Account..." : "Create Account"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-[#737373]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#3B2B25] hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
