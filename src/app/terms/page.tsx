import React from "react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E6E1DA] p-8 sm:p-12 space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
            Marketplace Rules
          </span>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#3B2B25] mt-1">
            Terms of Service
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Effective Date: March 2026
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            1. Honest Condition Grading
          </h2>
          <p className="text-sm text-[#5C534E] leading-relaxed">
            Sellers agree to accurately grade items using ReUseHub&apos;s four
            condition tiers (Like New, Excellent, Good, Fair) and disclose any
            functional or cosmetic flaws in the listing description.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            2. Listing Ownership & Authenticity
          </h2>
          <p className="text-sm text-[#5C534E] leading-relaxed">
            You may only list pre-owned items that you lawfully own and have in
            your possession. Counterfeit, recalled, hazardous, or stolen items
            are strictly prohibited.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            3. Respectful Community Communication
          </h2>
          <p className="text-sm text-[#5C534E] leading-relaxed">
            Buyer–seller chat is provided for genuine questions, price offers,
            swap proposals, and pickup coordination. Spam, harassment, or
            off-platform payment scams will result in account deactivation.
          </p>
        </section>
      </div>
    </div>
  );
}
