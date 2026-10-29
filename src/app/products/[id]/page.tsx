"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getConditionBadgeStyle,
  ProductCard,
  ProductItem,
} from "@/components/ProductCard";
import {
  Heart,
  MessageSquare,
  MapPin,
  Calendar,
  Star,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  Edit3,
  ShieldCheck,
  Send,
  X,
} from "lucide-react";

const CONDITION_DESCRIPTIONS: Record<string, string> = {
  "Like New":
    "Appears unused or barely used. Zero cosmetic blemishes; includes original packaging or accessories where noted.",
  Excellent:
    "Lightly pre-owned and carefully maintained. Minimal signs of handling and 100% functional integrity.",
  Good: "Gently used with honest patina or minor surface wear consistent with age. Fully functional and ready for daily use.",
  Fair: "Visible cosmetic wear or patina, priced accordingly. All flaws are transparently photographed and described.",
};

interface ProductDetailData extends ProductItem {
  sellerRating?: {
    average: number;
    count: number;
  };
  relatedProducts?: ProductItem[];
}

export default function ProductDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, showToast } = useAuth();

  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [favPending, setFavPending] = useState(false);

  // Contact Seller Modal state
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/products/${params.id}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Listing not found");
      }
      const data: ProductDetailData = json.data;
      setProduct(data);
      setFavorited(Boolean(data.isFavorited));
      setSelectedImage(
        data.primaryImage || "/images/placeholder-product.svg"
      );
      setInitialMessage(
        `Hi ${data.seller?.fullName?.split(" ")[0] || "there"}! Is "${
          data.title
        }" still available?`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load product details"
      );
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleToggleFavorite = async () => {
    if (!product) return;
    if (!user) {
      showToast("Please log in to save items to your favorites", "info");
      router.push("/login");
      return;
    }
    if (user.id === product.sellerId) {
      showToast("You cannot favorite your own listing", "info");
      return;
    }
    if (favPending) return;

    const next = !favorited;
    setFavorited(next);
    setFavPending(true);
    try {
      const res = await fetch(`/api/v1/favorites/${product.id}`, {
        method: next ? "POST" : "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setFavorited(!next);
        showToast(json.message || "Failed to update favorite", "error");
      } else {
        showToast(
          next ? "Added to your saved items" : "Removed from saved items",
          "success"
        );
      }
    } catch {
      setFavorited(!next);
      showToast("Network error while saving favorite", "error");
    } finally {
      setFavPending(false);
    }
  };

  const handleOpenChat = () => {
    if (!user) {
      showToast("Please sign in to message the seller", "info");
      router.push("/login");
      return;
    }
    setChatModalOpen(true);
  };

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    const trimmed = initialMessage.trim();
    if (!trimmed) {
      showToast("Please enter a message for the seller", "error");
      return;
    }

    setSendingMessage(true);
    try {
      const res = await fetch("/api/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          message: trimmed,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Could not start conversation", "error");
        return;
      }
      showToast("Message sent to seller!", "success");
      setChatModalOpen(false);
      router.push(`/messages?conversationId=${json.data.conversationId}`);
    } catch {
      showToast("Failed to send message", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!product) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/products/${product.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Could not update status", "error");
        return;
      }
      setProduct((prev) => (prev ? { ...prev, status: newStatus } : prev));
      showToast(`Listing status updated to ${newStatus}`, "success");
    } catch {
      showToast("Error updating status", "error");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 aspect-[4/3] bg-[#EFECE6] rounded-3xl animate-pulse" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-8 bg-[#EFECE6] rounded w-3/4 animate-pulse" />
            <div className="h-10 bg-[#EFECE6] rounded w-1/3 animate-pulse" />
            <div className="h-32 bg-[#EFECE6] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25]">
          Listing Not Available
        </h1>
        <p className="text-sm text-[#737373]">
          {error || "This product may have been removed or archived."}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B2B25] text-white text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === product.sellerId;
  const isAvailable = product.status === "Active";
  const gallery = product.images || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-14">
      {/* Breadcrumb & Back Link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#737373]">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 font-medium text-[#3B2B25] hover:underline mr-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <span>/</span>
          <Link href="/products" className="hover:text-[#242424]">
            Marketplace
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/products?category=${encodeURIComponent(
                  product.category.slug
                )}`}
                className="hover:text-[#242424] font-medium text-[#3B2B25]"
              >
                {product.category.name}
              </Link>
            </>
          )}
        </div>

        {/* Owner Quick-Manage Bar */}
        {isOwner && (
          <div className="flex flex-wrap items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border border-[#E6E1DA]">
            <span className="text-xs font-semibold text-[#3B2B25]">
              Your Listing ({product.status}):
            </span>
            <Link
              href={`/products/${product.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3EFEA] text-xs font-semibold text-[#3B2B25] hover:bg-[#E6E1DA]"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </Link>
            {product.status !== "Sold" && (
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange("Sold")}
                className="px-3 py-1.5 rounded-lg bg-[#6D8065] text-white text-xs font-semibold hover:bg-[#5A6B53]"
              >
                Mark as Sold
              </button>
            )}
            {product.status === "Active" && (
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange("Reserved")}
                className="px-3 py-1.5 rounded-lg border border-[#E6E1DA] text-xs font-medium text-[#242424] hover:bg-[#F3EFEA]"
              >
                Reserve
              </button>
            )}
            {product.status !== "Active" && (
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleStatusChange("Active")}
                className="px-3 py-1.5 rounded-lg border border-[#3B2B25] text-xs font-semibold text-[#3B2B25] hover:bg-[#F3EFEA]"
              >
                Reactivate
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main 12-Column Product Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left 7 Columns: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-[#F3EFEA] border border-[#E6E1DA]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage || "/images/placeholder-product.svg"}
              alt={product.title}
              onError={() =>
                setSelectedImage("/images/placeholder-product.svg")
              }
              className="w-full h-full object-cover"
            />
            {product.status !== "Active" && (
              <div className="absolute top-4 left-4 px-4 py-1.5 rounded-full bg-[#3B2B25] text-white text-xs font-bold uppercase tracking-wider shadow-md">
                {product.status}
              </div>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {gallery.map((img) => (
                <button
                  key={img.id || img.imageUrl}
                  type="button"
                  onClick={() => setSelectedImage(img.imageUrl)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img.imageUrl
                      ? "border-[#3B2B25] ring-2 ring-[#3B2B25]/20"
                      : "border-[#E6E1DA] opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageUrl}
                    alt={img.altText || product.title}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right 5 Columns: Details, Condition, Seller & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-[#E6E1DA] space-y-6 shadow-xs">
            {/* Category & Status Row */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {product.category && (
                  <Link
                    href={`/products?category=${encodeURIComponent(
                      product.category.slug
                    )}`}
                    className="text-xs font-semibold uppercase tracking-wider text-[#9A8174] hover:text-[#3B2B25]"
                  >
                    {product.category.name}
                  </Link>
                )}
                <span className="text-[#E6E1DA]">•</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getConditionBadgeStyle(
                    product.condition
                  )}`}
                >
                  {product.condition}
                </span>
              </div>

              <span
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  isAvailable
                    ? "bg-[#EBF2EA] text-[#2F472B]"
                    : "bg-[#F3EFEA] text-[#737373]"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{product.status}</span>
              </span>
            </div>

            {/* Title & Price */}
            <div>
              <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#242424] leading-snug">
                {product.title}
              </h1>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="font-mono-price text-3xl font-semibold text-[#3B2B25]">
                  ${Number(product.price).toLocaleString("en-US", {
                    minimumFractionDigits:
                      Number(product.price) % 1 === 0 ? 0 : 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                {product.isNegotiable && (
                  <span className="px-2.5 py-1 rounded-full bg-[#EBF2EA] text-[#2F472B] text-xs font-semibold">
                    Price Negotiable
                  </span>
                )}
              </div>
            </div>

            {/* Location & Date */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#737373] pt-2 border-t border-[#F3EFEA]">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#9A8174]" />
                <span>{product.location}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#9A8174]" />
                <span>
                  Listed{" "}
                  {new Date(product.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </span>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                Seller&apos;s Notes & Provenance
              </h2>
              <p className="text-sm text-[#242424] leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>

            {/* Condition Explanation Box */}
            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] space-y-1">
              <p className="text-xs font-semibold text-[#3B2B25]">
                Condition Grade: {product.condition}
              </p>
              <p className="text-xs text-[#737373] leading-relaxed">
                {CONDITION_DESCRIPTIONS[product.condition] ||
                  "Pre-owned item in verified condition."}
              </p>
            </div>

            {/* Exchange Preference Box */}
            {product.exchangeDescription && (
              <div className="p-4 rounded-2xl bg-[#EBF2EA]/70 border border-[#C5D6BE] space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2F472B]">
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Open to Direct Item Exchange / Swap</span>
                </div>
                <p className="text-xs text-[#2F472B] leading-relaxed">
                  {product.exchangeDescription}
                </p>
              </div>
            )}

            {/* Primary Buyer Actions */}
            {!isOwner && (
              <div className="pt-2 space-y-3">
                {isAvailable ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleOpenChat}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] transition-colors shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Contact Seller / Start Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleFavorite}
                      disabled={favPending}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border text-sm font-semibold transition-colors ${
                        favorited
                          ? "bg-[#3B2B25] text-white border-[#3B2B25]"
                          : "bg-white text-[#3B2B25] border-[#3B2B25] hover:bg-[#F3EFEA]"
                      }`}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          favorited ? "fill-current" : ""
                        }`}
                      />
                      <span>{favorited ? "Saved" : "Save"}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F3EFEA] border border-[#E6E1DA] text-center">
                    <p className="text-sm font-semibold text-[#3B2B25]">
                      This item is currently {product.status.toLowerCase()} and
                      unavailable for new inquiries.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Seller Profile Summary Card */}
          {product.seller && (
            <div className="bg-white p-6 rounded-3xl border border-[#E6E1DA] space-y-4">
              <div className="flex items-center justify-between">
                <Link
                  href={`/users/${product.seller.id}`}
                  className="flex items-center gap-3.5 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#F3EFEA] overflow-hidden flex items-center justify-center text-[#3B2B25] font-semibold">
                    {product.seller.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.seller.profileImage}
                        alt={product.seller.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      product.seller.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#242424] group-hover:text-[#3B2B25] group-hover:underline">
                      {product.seller.fullName}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-[#737373] mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[#3B2B25] font-semibold">
                        <Star className="w-3.5 h-3.5 fill-[#C87D28] text-[#C87D28]" />
                        {product.sellerRating?.average ?? 5.0}
                      </span>
                      <span>
                        ({product.sellerRating?.count ?? 0}{" "}
                        {product.sellerRating?.count === 1
                          ? "review"
                          : "reviews"}
                        )
                      </span>
                      {product.seller.location && (
                        <>
                          <span>•</span>
                          <span>{product.seller.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                <Link
                  href={`/users/${product.seller.id}`}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-xs font-semibold text-[#3B2B25] hover:bg-[#F3EFEA]"
                >
                  View Profile
                </Link>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#6D8065] pt-2 border-t border-[#F3EFEA]">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  Verified ReUseHub community member • Private contact details
                  protected
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-[#E6E1DA] space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
                Similar Pre-Loved Goods
              </span>
              <h2 className="font-serif-display text-2xl font-semibold text-[#242424] mt-1">
                More in {product.category?.name || "This Category"}
              </h2>
            </div>
            {product.category && (
              <Link
                href={`/products?category=${encodeURIComponent(
                  product.category.slug
                )}`}
                className="text-sm font-semibold text-[#3B2B25] hover:underline"
              >
                View all
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Start Conversation Modal */}
      {chatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E6E1DA] max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif-display text-xl font-semibold text-[#3B2B25]">
                  Message {product.seller?.fullName}
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  Regarding: {product.title} (${product.price})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setChatModalOpen(false)}
                className="p-1.5 rounded-lg text-[#737373] hover:bg-[#F3EFEA]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartConversation} className="space-y-4">
              <div>
                <label
                  htmlFor="initial-msg"
                  className="block text-xs font-semibold text-[#242424] mb-1.5"
                >
                  Your Message or Swap Proposal
                </label>
                <textarea
                  id="initial-msg"
                  rows={4}
                  value={initialMessage}
                  onChange={(e) => setInitialMessage(e.target.value)}
                  placeholder="Ask about condition details, pickup options, or propose a trade..."
                  className="w-full p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm text-[#242424] focus:outline-none focus:border-[#3B2B25]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setChatModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E6E1DA] text-sm font-medium text-[#737373] hover:bg-[#F3EFEA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingMessage ? "Sending..." : "Send Message"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
