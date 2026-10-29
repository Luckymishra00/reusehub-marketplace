"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ProductCard, ProductItem } from "@/components/ProductCard";
import { Heart, ArrowRight } from "lucide-react";

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/favorites", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json.data) {
        setFavorites(json.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadFavorites();
    }
  }, [authLoading, loadFavorites]);

  const handleFavoriteChange = (productId: number, isFavorited: boolean) => {
    if (!isFavorited) {
      setFavorites((prev) => prev.filter((item) => item.id !== productId));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-10 w-56 bg-[#EFECE6] rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="aspect-[4/5] bg-[#EFECE6] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E6E1DA] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EFEA] text-[#3B2B25] flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25]">
            Your Saved Wishlist
          </h1>
          <p className="text-sm text-[#737373]">
            Sign in to save pre-loved items to your personal wishlist and
            access them from any device.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-6 py-2.5 rounded-xl bg-[#3B2B25] text-white text-sm font-semibold"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 rounded-xl border border-[#3B2B25] text-[#3B2B25] text-sm font-semibold"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E6E1DA] pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
            Personal Curation
          </span>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#3B2B25] mt-1">
            Saved Favorites ({favorites.length})
          </h1>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3B2B25] hover:underline"
        >
          <span>Discover More Items</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E6E1DA] p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3EFEA] text-[#3B2B25] flex items-center justify-center mx-auto">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="font-serif-display text-2xl font-semibold text-[#242424]">
            No Saved Items Yet
          </h2>
          <p className="text-sm text-[#737373]">
            Tap the heart icon on any marketplace listing to save it here for
            easy comparison or future swap offers.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B2B25] text-white text-sm font-semibold"
          >
            <span>Explore Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
