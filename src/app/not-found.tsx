import React from "react";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
      <div className="w-16 h-16 rounded-3xl bg-[#F3EFEA] text-[#3B2B25] flex items-center justify-center mx-auto">
        <Compass className="w-8 h-8" />
      </div>
      <h1 className="font-serif-display text-4xl font-semibold text-[#3B2B25]">
        404 — Page Not Found
      </h1>
      <p className="text-sm text-[#737373] leading-relaxed">
        We couldn&apos;t find the page or listing you were looking for. It may
        have found a new home or been moved.
      </p>
      <div className="flex justify-center gap-3 pt-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/products"
          className="px-6 py-3 rounded-xl border border-[#3B2B25] text-[#3B2B25] text-sm font-semibold"
        >
          Browse Marketplace
        </Link>
      </div>
    </div>
  );
}
