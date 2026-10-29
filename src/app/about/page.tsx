import React from "react";
import Link from "next/link";
import {
  Recycle,
  HeartHandshake,
  ShieldCheck,
  Leaf,
  ArrowRight,
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-16">
      {/* Hero Banner */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EBF2EA] text-[#2F472B] text-xs font-semibold">
          <Leaf className="w-3.5 h-3.5" />
          <span>Our Purpose & Sustainability Mission</span>
        </span>
        <h1 className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#3B2B25] leading-tight">
          Built on the Belief That Well-Made Things Deserve More Than One Owner.
        </h1>
        <p className="text-base text-[#5C534E] leading-relaxed">
          ReUseHub is a community-driven second-hand marketplace designed to
          make buying, selling, and exchanging pre-owned belongings simple,
          trustworthy, and financially accessible.
        </p>
      </div>

      {/* Three Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-3xl border border-[#E6E1DA] space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EFECE6] text-[#3B2B25] flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </div>
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            Circular Sustainability
          </h2>
          <p className="text-sm text-[#737373] leading-relaxed">
            Manufacturing new furniture, electronics, and garments accounts for
            the vast majority of consumer carbon emissions. Extending a
            product&apos;s lifecycle through resale or direct swap honors the
            materials and energy already invested in it.
          </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-[#E6E1DA] space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF2EA] text-[#2F472B] flex items-center justify-center">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            Affordability & Swaps
          </h2>
          <p className="text-sm text-[#737373] leading-relaxed">
            High-craft cookware, solid wood furniture, and precision cameras
            shouldn&apos;t require luxury retail markups. ReUseHub supports both
            direct purchases and neighbor-to-neighbor item swaps.
          </p>
        </div>

        <div className="bg-white p-7 rounded-3xl border border-[#E6E1DA] space-y-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EFECE6] text-[#3B2B25] flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            Transparent Trust
          </h2>
          <p className="text-sm text-[#737373] leading-relaxed">
            Every listing uses our standardized four-tier condition framework
            (Like New, Excellent, Good, Fair), verified seller profiles, and
            private participant-authorized messaging.
          </p>
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-[#3B2B25] text-[#FAF8F5] rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-white">
            Ready to Join the Circular Economy?
          </h2>
          <p className="text-sm text-[#D6CEC2]">
            Browse items near you or list something from your home in under two
            minutes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FAF8F5] text-[#3B2B25] text-sm font-semibold hover:bg-[#F3EFEA]"
          >
            <span>Explore Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/sell"
            className="px-6 py-3 rounded-xl border border-white/30 text-white text-sm font-semibold hover:bg-white/10"
          >
            Start Selling
          </Link>
        </div>
      </div>
    </div>
  );
}
