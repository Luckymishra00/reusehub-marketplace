"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Heart, MapPin, ArrowLeftRight } from "lucide-react";

export interface ProductItem {
  id: number;
  sellerId: number;
  categoryId: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  condition: string;
  location: string;
  status: string;
  isNegotiable: boolean;
  exchangeDescription: string | null;
  viewsCount?: number;
  createdAt: string;
  primaryImage: string;
  images?: Array<{
    id: number;
    imageUrl: string;
    altText: string | null;
    isPrimary: boolean;
  }>;
  category?: {
    id: number;
    name: string;
    slug: string;
    icon?: string | null;
  } | null;
  seller?: {
    id: number;
    fullName: string;
    profileImage: string | null;
    location: string | null;
    createdAt?: string;
  } | null;
  isFavorited?: boolean;
}

export function getConditionBadgeStyle(condition: string) {
  switch (condition) {
    case "Like New":
      return "bg-[#EBF2EA] text-[#2F472B] border-[#C5D6BE]";
    case "Excellent":
      return "bg-[#EFECE6] text-[#3B2B25] border-[#D6CEC2]";
    case "Good":
      return "bg-[#F9F1E6] text-[#7A511D] border-[#E8D2B5]";
    case "Fair":
    default:
      return "bg-[#F3EFEA] text-[#5C534E] border-[#DED6CC]";
  }
}

export function ProductCard({
  product,
  onFavoriteChange,
}: {
  product: ProductItem;
  onFavoriteChange?: (productId: number, isFavorited: boolean) => void;
}) {
  const { user, showToast } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(Boolean(product.isFavorited));
  const [pendingFav, setPendingFav] = useState(false);
  const [imgSrc, setImgSrc] = useState(
    product.primaryImage || "/images/placeholder-product.svg"
  );

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showToast("Please sign in to save items to your wishlist", "info");
      router.push("/login");
      return;
    }

    if (user.id === product.sellerId) {
      showToast("You cannot favorite your own listing", "info");
      return;
    }

    if (pendingFav) return;

    const nextState = !favorited;
    setFavorited(nextState); // Optimistic update
    setPendingFav(true);

    try {
      const res = await fetch(`/api/v1/favorites/${product.id}`, {
        method: nextState ? "POST" : "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setFavorited(!nextState); // Rollback
        showToast(json.message || "Could not update favorites", "error");
      } else {
        showToast(
          nextState ? "Saved to your favorites" : "Removed from favorites",
          "success"
        );
        onFavoriteChange?.(product.id, nextState);
      }
    } catch {
      setFavorited(!nextState); // Rollback
      showToast("Network error while updating favorites", "error");
    } finally {
      setPendingFav(false);
    }
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-2xl border border-[#E6E1DA] overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#9A8174]/60 focus:outline-none focus:ring-2 focus:ring-[#3B2B25]"
    >
      <div>
        {/* 4:5 Aspect Ratio Image Frame */}
        <div className="relative aspect-[4/5] w-full bg-[#F3EFEA] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={product.title}
            onError={() => setImgSrc("/images/placeholder-product.svg")}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          />

          {/* Top Left Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[78%]">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-xs ${getConditionBadgeStyle(
                product.condition
              )}`}
            >
              {product.condition}
            </span>
            {product.status !== "Active" && (
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#3B2B25] text-white">
                {product.status}
              </span>
            )}
          </div>

          {/* Top Right Favorite Heart */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={pendingFav}
            aria-label={
              favorited ? "Remove from favorites" : "Save to favorites"
            }
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-xs ${
              favorited
                ? "bg-[#3B2B25] text-white"
                : "bg-white/90 text-[#3B2B25] hover:bg-white"
            }`}
          >
            <Heart
              className={`w-4 h-4 ${favorited ? "fill-current" : ""}`}
            />
          </button>

          {/* Bottom Exchange / Negotiable Ribbon */}
          {product.exchangeDescription && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#3B2B25]/85 backdrop-blur-xs text-[#FAF8F5] text-[11px] font-medium truncate max-w-full">
                <ArrowLeftRight className="w-3 h-3 text-[#C5D6BE] shrink-0" />
                <span className="truncate">Swap option available</span>
              </span>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 pb-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono-price text-lg font-semibold text-[#242424]">
              ${Number(product.price).toLocaleString("en-US", {
                minimumFractionDigits:
                  Number(product.price) % 1 === 0 ? 0 : 2,
                maximumFractionDigits: 2,
              })}
            </span>
            {product.isNegotiable && (
              <span className="text-[11px] font-medium text-[#6D8065] bg-[#EBF2EA] px-2 py-0.5 rounded-full">
                Negotiable
              </span>
            )}
          </div>

          <h3 className="mt-1.5 text-sm font-semibold text-[#242424] line-clamp-2 group-hover:text-[#3B2B25] transition-colors leading-snug">
            {product.title}
          </h3>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-[#F3EFEA] flex items-center justify-between text-xs text-[#737373]">
        <span className="inline-flex items-center gap-1 truncate">
          <MapPin className="w-3.5 h-3.5 text-[#9A8174] shrink-0" />
          <span className="truncate">{product.location}</span>
        </span>
        {product.category && (
          <span className="text-[11px] text-[#9A8174] font-medium truncate ml-2">
            {product.category.name}
          </span>
        )}
      </div>
    </Link>
  );
}
