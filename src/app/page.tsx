"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ProductCard, ProductItem } from "@/components/ProductCard";
import {
  ArrowRight,
  Camera,
  Armchair,
  Shirt,
  Coffee,
  BookOpen,
  Bike,
  Watch,
  Sparkles,
  Gamepad2,
  Package,
  Recycle,
  MessageSquare,
  ShieldCheck,
  Leaf,
  ArrowLeftRight,
} from "lucide-react";

interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  activeCount: number;
}

function getCategoryIcon(iconName: string | null) {
  switch (iconName) {
    case "Camera":
      return <Camera className="w-5 h-5" />;
    case "Armchair":
      return <Armchair className="w-5 h-5" />;
    case "Shirt":
      return <Shirt className="w-5 h-5" />;
    case "Coffee":
      return <Coffee className="w-5 h-5" />;
    case "BookOpen":
      return <BookOpen className="w-5 h-5" />;
    case "Bike":
      return <Bike className="w-5 h-5" />;
    case "Watch":
      return <Watch className="w-5 h-5" />;
    case "Sparkles":
      return <Sparkles className="w-5 h-5" />;
    case "Gamepad2":
      return <Gamepad2 className="w-5 h-5" />;
    default:
      return <Package className="w-5 h-5" />;
  }
}

export default function HomePage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [recentProducts, setRecentProducts] = useState<ProductItem[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, recentRes, popRes] = await Promise.all([
        fetch("/api/v1/categories"),
        fetch("/api/v1/products?sort=newest&limit=8"),
        fetch("/api/v1/products?sort=popular&limit=4"),
      ]);

      if (!catRes.ok || !recentRes.ok || !popRes.ok) {
        throw new Error("Failed to load marketplace data");
      }

      const [catJson, recentJson, popJson] = await Promise.all([
        catRes.json(),
        recentRes.json(),
        popRes.json(),
      ]);

      setCategories(catJson.data || []);
      setRecentProducts(recentJson.data || []);
      setFeaturedProducts(popJson.data || []);
    } catch {
      setError("Unable to load marketplace listings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  return (
    <div className="space-y-16 pb-8">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-[#F3EFEA] border-b border-[#E6E1DA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left 7 Columns: Copy & CTAs */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E6E1DA] text-xs font-semibold text-[#6D8065]">
                <Leaf className="w-3.5 h-3.5" />
                <span>Curated Circular Resale & Neighborhood Exchange</span>
              </div>

              <h1 className="font-serif-display text-4xl sm:text-5xl lg:text-[54px] font-semibold text-[#3B2B25] leading-[1.12] tracking-tight">
                Give Pre-Loved Items a New Life.
              </h1>

              <p className="text-base sm:text-lg text-[#5C534E] max-w-2xl leading-relaxed">
                Discover well-cared-for furniture, cameras, kitchenware, books,
                and garments from real people nearby. Buy at fair second-hand
                prices, propose direct swaps, and keep enduring craftsmanship
                in circulation.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm sm:text-base font-medium hover:bg-[#2A1E1A] transition-colors shadow-sm"
                >
                  <span>Explore Items</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white border border-[#3B2B25] text-[#3B2B25] text-sm sm:text-base font-medium hover:bg-[#FAF8F5] transition-colors"
                >
                  <span>Start Selling</span>
                </Link>
              </div>

              {/* Trust Highlights */}
              <div className="pt-4 grid grid-cols-3 gap-4 border-t border-[#E6E1DA] max-w-lg">
                <div>
                  <p className="font-mono-price text-lg sm:text-xl font-semibold text-[#3B2B25]">
                    0% Fee
                  </p>
                  <p className="text-xs text-[#737373]">
                    Community listing & swap
                  </p>
                </div>
                <div>
                  <p className="font-mono-price text-lg sm:text-xl font-semibold text-[#3B2B25]">
                    4-Tier
                  </p>
                  <p className="text-xs text-[#737373]">
                    Honest condition grading
                  </p>
                </div>
                <div>
                  <p className="font-mono-price text-lg sm:text-xl font-semibold text-[#3B2B25]">
                    Direct Chat
                  </p>
                  <p className="text-xs text-[#737373]">
                    Verified seller profiles
                  </p>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Curated Visual Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative bg-white p-4 sm:p-5 rounded-3xl border border-[#E6E1DA] shadow-md">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-3.5">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#F3EFEA] relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80"
                        alt="Mid-Century Danish Teak Chair"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-white/95 text-[#3B2B25] font-mono-price text-xs font-semibold shadow-xs">
                        $420 • Excellent
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA]">
                      <div className="flex items-center gap-2 text-xs font-semibold text-[#6D8065]">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>Swap-Friendly</span>
                      </div>
                      <p className="text-xs text-[#5C534E] mt-1">
                        Trade items directly or combine cash + trade with local
                        sellers.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3.5 pt-5">
                    <div className="p-3.5 rounded-2xl bg-[#3B2B25] text-[#FAF8F5]">
                      <p className="text-[11px] uppercase tracking-wider text-[#D6CEC2]">
                        Featured Pick
                      </p>
                      <p className="text-xs font-medium mt-1">
                        Rangefinder cameras, cast-iron Dutch ovens & studio
                        monitors
                      </p>
                    </div>
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#F3EFEA] relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"
                        alt="Fujifilm Rangefinder Camera"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-white/95 text-[#3B2B25] font-mono-price text-xs font-semibold shadow-xs">
                        $680 • Like New
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Shortcuts Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
              Browse by Department
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#242424] mt-1">
              Explore Curated Categories
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-[#3B2B25] hover:underline flex items-center gap-1"
          >
            <span>All Departments</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${encodeURIComponent(cat.slug)}`}
              className="group p-4 rounded-2xl bg-white border border-[#E6E1DA] hover:border-[#3B2B25] hover:shadow-xs transition-all flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F3EFEA] text-[#3B2B25] group-hover:bg-[#3B2B25] group-hover:text-[#FAF8F5] transition-colors flex items-center justify-center shrink-0">
                {getCategoryIcon(cat.icon)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#242424] truncate">
                  {cat.name}
                </p>
                <p className="text-xs text-[#737373]">
                  {cat.activeCount} {cat.activeCount === 1 ? "item" : "items"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Error State if API failed */}
      {error && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 rounded-2xl bg-[#FDF3F2] border border-[#F5C6C2] text-center space-y-3">
            <p className="text-base font-semibold text-[#8E261B]">{error}</p>
            <button
              type="button"
              onClick={loadHomeData}
              className="px-4 py-2 rounded-xl bg-[#3B2B25] text-white text-sm font-medium"
            >
              Retry Loading
            </button>
          </div>
        </section>
      )}

      {/* Featured / Popular Listings */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#6D8065]">
              Community Favorites
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#242424] mt-1">
              Featured & Popular Finds
            </h2>
          </div>
          <Link
            href="/products?sort=popular"
            className="text-sm font-semibold text-[#3B2B25] hover:underline flex items-center gap-1"
          >
            <span>See Most Viewed</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-[#E6E1DA] overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/5] bg-[#EFECE6]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-5 bg-[#EFECE6] rounded w-1/3" />
                  <div className="h-4 bg-[#EFECE6] rounded w-3/4" />
                  <div className="h-3 bg-[#EFECE6] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Recently Added Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
              Fresh Arrivals
            </span>
            <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#242424] mt-1">
              Recently Added to the Marketplace
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-sm font-semibold text-[#3B2B25] hover:underline flex items-center gap-1"
          >
            <span>Browse All Listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-[#E6E1DA] overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/5] bg-[#EFECE6]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-5 bg-[#EFECE6] rounded w-1/3" />
                  <div className="h-4 bg-[#EFECE6] rounded w-3/4" />
                  <div className="h-3 bg-[#EFECE6] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-medium hover:bg-[#2A1E1A] transition-colors"
          >
            <span>Explore Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* How ReUseHub Works Section */}
      <section className="bg-[#F3EFEA] border-y border-[#E6E1DA] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
              Simple, Trustworthy Exchange
            </span>
            <h2 className="font-serif-display text-3xl font-semibold text-[#3B2B25] mt-2">
              How ReUseHub Works
            </h2>
            <p className="text-sm sm:text-base text-[#5C534E] mt-2">
              Whether decluttering your studio or searching for a timeless piece
              of furniture, ReUseHub makes second-hand commerce effortless.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-7 rounded-2xl border border-[#E6E1DA] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] text-[#3B2B25] flex items-center justify-center font-serif-display text-xl font-semibold">
                01
              </div>
              <h3 className="text-lg font-semibold text-[#242424]">
                List with Honest Detail
              </h3>
              <p className="text-sm text-[#737373] leading-relaxed">
                Upload photos, select an accurate condition grade (Like New to
                Fair), set a fair price, and optionally note what items you
                would accept in trade.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-[#E6E1DA] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EBF2EA] text-[#2F472B] flex items-center justify-center font-serif-display text-xl font-semibold">
                02
              </div>
              <h3 className="text-lg font-semibold text-[#242424]">
                Connect via Private Chat
              </h3>
              <p className="text-sm text-[#737373] leading-relaxed">
                Message sellers directly from any listing page. Ask questions,
                share swap proposals, and coordinate pickup or shipping safely
                inside your inbox.
              </p>
            </div>

            <div className="bg-white p-7 rounded-2xl border border-[#E6E1DA] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] text-[#3B2B25] flex items-center justify-center font-serif-display text-xl font-semibold">
                03
              </div>
              <h3 className="text-lg font-semibold text-[#242424]">
                Give Goods a Second Chapter
              </h3>
              <p className="text-sm text-[#737373] leading-relaxed">
                Complete your exchange, update the listing status to Reserved or
                Sold in one click, and build your reputation with community
                reviews.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sustainability Promotional Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-[#3B2B25] text-[#FAF8F5] p-8 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6D8065]/30 border border-[#6D8065] text-xs font-medium text-[#EBF2EA]">
              <Recycle className="w-3.5 h-3.5" />
              <span>Why Second-Hand Matters</span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-4xl font-semibold text-white leading-tight">
              The Most Sustainable Product Is the One Already Made.
            </h2>
            <p className="text-sm sm:text-base text-[#D6CEC2] max-w-2xl leading-relaxed">
              Extending the active life of furniture, electronics, and garments
              by just three years reduces their embodied carbon and resource
              footprint by over 40%. Join thousands of thoughtful buyers and
              sellers choosing reuse first.
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5 justify-end">
            <Link
              href="/sell"
              className="px-6 py-3.5 rounded-xl bg-[#FAF8F5] text-[#3B2B25] text-center font-semibold text-sm hover:bg-[#F3EFEA] transition-colors"
            >
              List an Unused Item Today
            </Link>
            <Link
              href="/about"
              className="px-6 py-3.5 rounded-xl border border-white/25 text-white text-center font-medium text-sm hover:bg-white/10 transition-colors"
            >
              Read Our Sustainability Mission
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
