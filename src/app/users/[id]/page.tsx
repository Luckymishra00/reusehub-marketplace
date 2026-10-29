"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProductCard, ProductItem } from "@/components/ProductCard";
import {
  MapPin,
  Calendar,
  Star,
  ShieldCheck,
  MessageSquare,
  CheckCircle2,
  Package,
} from "lucide-react";

interface SellerProfileInfo {
  id: number;
  fullName: string;
  profileImage: string | null;
  bio: string | null;
  location: string | null;
  createdAt: string;
  ratingAverage: number;
  reviewCount: number;
  activeCount: number;
  soldCount: number;
}

interface ReviewItem {
  id: number;
  rating: number;
  comment: string;
  isVerifiedExchange: boolean;
  createdAt: string;
  reviewerId: number;
  reviewerName: string;
  reviewerAvatar: string | null;
}

export default function SellerProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, showToast } = useAuth();

  const [profile, setProfile] = useState<SellerProfileInfo | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<"active" | "sold" | "reviews">(
    "active"
  );
  const [loading, setLoading] = useState(true);

  // Review submission state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadSeller = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/users/${params.id}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        setProfile(null);
        return;
      }
      setProfile(json.data.profile);
      setProducts(json.data.products || []);
      setReviews(json.data.reviews || []);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadSeller();
  }, [loadSeller]);

  const handleContactSeller = async () => {
    if (!user) {
      showToast("Please sign in to message this seller", "info");
      router.push("/login");
      return;
    }
    const activeListings = products.filter((p) => p.status === "Active");
    if (activeListings.length === 0) {
      showToast(
        "This seller has no active listings to start a product inquiry on right now.",
        "info"
      );
      return;
    }

    try {
      const res = await fetch("/api/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: activeListings[0].id,
          message: `Hi ${
            profile?.fullName.split(" ")[0]
          }! I was browsing your ReUseHub profile and wanted to connect about "${
            activeListings[0].title
          }".`,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data?.conversationId) {
        router.push(`/messages?conversationId=${json.data.conversationId}`);
      } else {
        showToast(json.message || "Could not start conversation", "error");
      }
    } catch {
      showToast("Error starting conversation", "error");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    if (comment.trim().length < 8) {
      showToast("Please write at least 8 characters for your review", "error");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerId: profile.id,
          rating,
          comment: comment.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Could not submit review", "error");
        return;
      }
      showToast("Review posted!", "success");
      setComment("");
      await loadSeller();
    } catch {
      showToast("Failed to post review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="h-48 bg-[#EFECE6] rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="aspect-[4/5] bg-[#EFECE6] rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25]">
          Seller Not Found
        </h1>
        <p className="text-sm text-[#737373]">
          This member profile is not available.
        </p>
        <Link
          href="/products"
          className="inline-block px-6 py-2.5 rounded-xl bg-[#3B2B25] text-white text-sm font-medium"
        >
          Explore Marketplace
        </Link>
      </div>
    );
  }

  const activeListings = products.filter((p) => p.status === "Active");
  const soldListings = products.filter((p) => p.status !== "Active");
  const isSelf = user?.id === profile.id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-10">
      {/* Seller Header Card */}
      <div className="bg-white rounded-3xl border border-[#E6E1DA] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#F3EFEA] border-2 border-[#E6E1DA] overflow-hidden flex items-center justify-center text-[#3B2B25] font-serif-display text-3xl font-semibold shrink-0">
              {profile.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.profileImage}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.fullName.charAt(0)
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-serif-display text-2xl sm:text-3xl font-semibold text-[#242424]">
                  {profile.fullName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EBF2EA] text-[#2F472B] text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Community Seller</span>
                </span>
              </div>

              {profile.bio && (
                <p className="text-sm text-[#5C534E] max-w-2xl leading-relaxed">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#737373] pt-1">
                {profile.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#9A8174]" />
                    <span>{profile.location}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#9A8174]" />
                  <span>
                    Member since{" "}
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-[#3B2B25]">
                  <Star className="w-3.5 h-3.5 fill-[#C87D28] text-[#C87D28]" />
                  <span>
                    {profile.ratingAverage} ({profile.reviewCount}{" "}
                    {profile.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSelf ? (
              <Link
                href="/dashboard?tab=profile"
                className="px-5 py-2.5 rounded-xl border border-[#3B2B25] text-sm font-semibold text-[#3B2B25] hover:bg-[#F3EFEA]"
              >
                Edit My Profile
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleContactSeller}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Seller</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#E6E1DA]">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "active"
              ? "border-[#3B2B25] text-[#3B2B25]"
              : "border-transparent text-[#737373] hover:text-[#242424]"
          }`}
        >
          Active Listings ({activeListings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sold")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "sold"
              ? "border-[#3B2B25] text-[#3B2B25]"
              : "border-transparent text-[#737373] hover:text-[#242424]"
          }`}
        >
          Sold & Reserved ({soldListings.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "reviews"
              ? "border-[#3B2B25] text-[#3B2B25]"
              : "border-transparent text-[#737373] hover:text-[#242424]"
          }`}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "active" && (
        <div>
          {activeListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E6E1DA] p-12 text-center space-y-3">
              <Package className="w-8 h-8 text-[#9A8174] mx-auto" />
              <p className="text-base font-semibold text-[#242424]">
                No active listings at the moment
              </p>
              <p className="text-xs text-[#737373]">
                Check the Sold & Reserved tab to see past items from{" "}
                {profile.fullName}.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {activeListings.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "sold" && (
        <div>
          {soldListings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#E6E1DA] p-12 text-center">
              <p className="text-sm text-[#737373]">
                No sold or reserved items recorded yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {soldListings.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E6E1DA] p-10 text-center">
                <p className="text-sm text-[#737373]">
                  No reviews have been written for {profile.fullName} yet.
                </p>
              </div>
            ) : (
              reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white p-6 rounded-2xl border border-[#E6E1DA] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F3EFEA] overflow-hidden flex items-center justify-center text-xs font-semibold text-[#3B2B25]">
                        {rev.reviewerAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={rev.reviewerAvatar}
                            alt={rev.reviewerName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          rev.reviewerName.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#242424]">
                          {rev.reviewerName}
                        </p>
                        <p className="text-[11px] text-[#737373]">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          rev.isVerifiedExchange
                            ? "bg-[#EBF2EA] text-[#2F472B]"
                            : "bg-[#F3EFEA] text-[#737373]"
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>
                          {rev.isVerifiedExchange
                            ? "Verified Chat / Exchange"
                            : "Community Feedback"}
                        </span>
                      </span>
                      <div className="flex items-center gap-0.5 text-[#C87D28]">
                        {Array.from({ length: rev.rating }).map((_, idx) => (
                          <Star
                            key={idx}
                            className="w-3.5 h-3.5 fill-current"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-[#242424] leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Leave a Review Form */}
          <div className="lg:col-span-5">
            {user && !isSelf ? (
              <form
                onSubmit={handleReviewSubmit}
                className="bg-white p-6 rounded-3xl border border-[#E6E1DA] space-y-4"
              >
                <h3 className="font-serif-display text-xl font-semibold text-[#3B2B25]">
                  Leave Seller Feedback
                </h3>
                <p className="text-xs text-[#737373]">
                  Reviews from members who have communicated with this seller
                  are badged as Verified Chat / Exchange; other reviews are
                  transparently labeled as Community Feedback.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Rating (1 to 5 Stars)
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`p-2 rounded-xl border transition-colors ${
                          rating >= star
                            ? "bg-[#F9F1E6] border-[#C87D28] text-[#C87D28]"
                            : "bg-[#FAF8F5] border-[#E6E1DA] text-[#737373]"
                        }`}
                      >
                        <Star
                          className={`w-4 h-4 ${
                            rating >= star ? "fill-current" : ""
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Your Experience *
                  </label>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share how communication, item condition, or pickup went..."
                    className="w-full p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-3 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Post Feedback"}
                </button>
              </form>
            ) : !user ? (
              <div className="bg-white p-6 rounded-3xl border border-[#E6E1DA] text-center space-y-3">
                <p className="text-sm font-semibold text-[#242424]">
                  Have you exchanged items with {profile.fullName}?
                </p>
                <Link
                  href="/login"
                  className="inline-block px-5 py-2.5 rounded-xl bg-[#3B2B25] text-white text-xs font-semibold"
                >
                  Sign In to Leave Feedback
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
