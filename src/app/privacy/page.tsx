import React from "react";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-[#E6E1DA] p-8 sm:p-12 space-y-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
            Data Stewardship
          </span>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#3B2B25] mt-1">
            Privacy Policy
          </h1>
          <p className="text-xs text-[#737373] mt-1">
            Last updated: March 2026
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            1. Information We Collect
          </h2>
          <p className="text-sm text-[#5C534E] leading-relaxed">
            When you register on ReUseHub, we store your display name, email
            address, bcrypt-hashed password, optional city/state location, and
            biography. When you publish listings or communicate with other
            members, those listings and messages are stored in our relational
            database.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            2. Public vs. Private Account Data
          </h2>
          <p className="text-sm text-[#5C534E] leading-relaxed">
            Public seller profiles display only your display name, avatar,
            general location, biography, member-since date, and active/sold
            listings. Your email address and password hash are never exposed on
            public API endpoints or seller pages.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            3. Private Buyer–Seller Messaging
          </h2>
          <p className="text-sm text-[#5C534E] leading-relaxed">
            Conversations are strictly authorized so only the authenticated
            buyer and seller participating in a thread can read or send messages
            within it.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif-display text-xl font-semibold text-[#242424]">
            4. Account Deactivation & Deletion
          </h2>
          <p className="text-sm text-[#5C534E] leading-relaxed">
            You can deactivate your account at any time from your Dashboard
            Account Security tab, which immediately revokes your session cookie
            and archives your active listings.
          </p>
        </section>
      </div>
    </div>
  );
}
