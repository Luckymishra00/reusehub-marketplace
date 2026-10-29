import React from "react";
import Link from "next/link";
import { Recycle, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-[#3B2B25] text-[#FAF8F5] mt-20">
      {/* Value Proposition Strip */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/10 text-[#E6E1DA] shrink-0">
              <Recycle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Circular Craft & Reuse
              </h3>
              <p className="text-xs text-[#D6CEC2] mt-1 leading-relaxed">
                Every pre-loved item exchanged keeps high-craft goods in active
                use and out of landfills.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/10 text-[#E6E1DA] shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Direct Buyer–Seller Dialogue
              </h3>
              <p className="text-xs text-[#D6CEC2] mt-1 leading-relaxed">
                Chat directly with sellers, ask about provenance or dimensions,
                and propose fair swaps or offers.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/10 text-[#E6E1DA] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                Transparent Condition Standards
              </h3>
              <p className="text-xs text-[#D6CEC2] mt-1 leading-relaxed">
                Clear 4-tier condition grading (Like New, Excellent, Good, Fair)
                with verified seller profiles.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-[#3B2B25]">
                <Recycle className="w-5 h-5" />
              </div>
              <span className="font-serif-display text-2xl font-semibold text-white">
                ReUseHub
              </span>
            </div>
            <p className="text-sm text-[#D6CEC2] max-w-sm leading-relaxed">
              Give Pre-Loved Items a New Life. A thoughtful second-hand
              marketplace for buying, selling, and exchanging well-made goods
              with neighbors and fellow enthusiasts.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs text-[#E6E1DA]">
              <Sparkles className="w-3.5 h-3.5 text-[#9A8174]" />
              <span>Zero listing fees for community members</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9A8174] mb-4">
              Marketplace
            </h4>
            <ul className="space-y-2.5 text-sm text-[#E6E1DA]">
              <li>
                <Link
                  href="/products"
                  className="hover:text-white transition-colors"
                >
                  Explore All Items
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=electronics"
                  className="hover:text-white transition-colors"
                >
                  Electronics & Audio
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=furniture"
                  className="hover:text-white transition-colors"
                >
                  Mid-Century Furniture
                </Link>
              </li>
              <li>
                <Link
                  href="/products?category=home-and-kitchen"
                  className="hover:text-white transition-colors"
                >
                  Home & Kitchen
                </Link>
              </li>
              <li>
                <Link
                  href="/products?exchange=true"
                  className="hover:text-white transition-colors"
                >
                  Open to Swap / Trade
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9A8174] mb-4">
              Account & Selling
            </h4>
            <ul className="space-y-2.5 text-sm text-[#E6E1DA]">
              <li>
                <Link
                  href="/sell"
                  className="hover:text-white transition-colors"
                >
                  Create a Listing
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-white transition-colors"
                >
                  Seller Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/listings"
                  className="hover:text-white transition-colors"
                >
                  Manage My Listings
                </Link>
              </li>
              <li>
                <Link
                  href="/favorites"
                  className="hover:text-white transition-colors"
                >
                  Saved Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href="/messages"
                  className="hover:text-white transition-colors"
                >
                  Buyer–Seller Inbox
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#9A8174] mb-4">
              About & Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-[#E6E1DA]">
              <li>
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  Our Sustainability Mission
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#9A8174] gap-4">
          <p>© {new Date().getFullYear()} ReUseHub Marketplace. Built for sustainable second-hand commerce.</p>
          <p>Warm Editorial Craft • Relational Database Backed</p>
        </div>
      </div>
    </footer>
  );
}
