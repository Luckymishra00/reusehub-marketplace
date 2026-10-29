"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Upload,
  X,
  Star,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
}

const CONDITION_OPTIONS = [
  {
    value: "Like New",
    label: "Like New",
    desc: "Unused or barely used, spotless cosmetic and functional state.",
  },
  {
    value: "Excellent",
    label: "Excellent",
    desc: "Lightly pre-owned with minimal signs of handling.",
  },
  {
    value: "Good",
    label: "Good",
    desc: "Gently used with honest patina; 100% functional.",
  },
  {
    value: "Fair",
    label: "Fair",
    desc: "Visible wear or cosmetic flaws transparently noted.",
  },
];

export default function SellProductPage() {
  const { user, loading: authLoading, showToast } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [condition, setCondition] = useState("Excellent");
  const [location, setLocation] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(true);
  const [exchangeDescription, setExchangeDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/v1/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          setCategories(json.data);
          setCategoryId(String(json.data[0].id));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.location && !location) {
      setLocation(user.location);
    }
  }, [user, location]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    if (images.length + fileList.length > 5) {
      showToast("You can attach at most 5 images per listing", "error");
      return;
    }

    const formData = new FormData();
    Array.from(fileList).forEach((f) => formData.append("images", f));

    setUploading(true);
    try {
      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Image upload failed", "error");
        return;
      }
      const uploadedUrls: string[] = json.data?.urls || [];
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      showToast(
        `${uploadedUrls.length} ${
          uploadedUrls.length === 1 ? "photo" : "photos"
        } uploaded`,
        "success"
      );
    } catch {
      showToast("Error uploading image files", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddImageUrl = () => {
    const trimmed = customImageUrl.trim();
    if (!trimmed) return;
    if (images.length >= 5) {
      showToast("Maximum of 5 images allowed", "error");
      return;
    }
    setImages((prev) => [...prev, trimmed]);
    setCustomImageUrl("");
  };

  const handleMakePrimary = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (
    e: React.FormEvent,
    targetStatus: "Active" | "Draft" = "Active"
  ) => {
    e.preventDefault();
    setFieldErrors({});

    const errs: Record<string, string> = {};
    if (title.trim().length < 4) {
      errs.title = "Title must be at least 4 characters";
    }
    if (description.trim().length < 15) {
      errs.description = "Please provide at least 15 characters of description";
    }
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) {
      errs.price = "Enter a valid positive price";
    }
    if (!categoryId) {
      errs.categoryId = "Select a category";
    }
    if (!location.trim()) {
      errs.location = "Enter your city/state location";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      showToast("Please check the highlighted form fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: priceNum,
          categoryId: Number(categoryId),
          condition,
          location: location.trim(),
          isNegotiable,
          exchangeDescription: exchangeDescription.trim() || null,
          status: targetStatus,
          images,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (Array.isArray(json.errors)) {
          const map: Record<string, string> = {};
          json.errors.forEach((er: { field: string; message: string }) => {
            map[er.field] = er.message;
          });
          setFieldErrors(map);
        }
        showToast(json.message || "Failed to create listing", "error");
        return;
      }

      showToast(
        targetStatus === "Draft"
          ? "Draft listing saved!"
          : "Listing published to ReUseHub!",
        "success"
      );
      router.push(`/products/${json.data.id}`);
    } catch {
      showToast("Network error while creating listing", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-96 rounded-3xl bg-[#EFECE6] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="bg-white p-8 rounded-3xl border border-[#E6E1DA] space-y-4">
          <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25]">
            Sign In to List an Item
          </h1>
          <p className="text-sm text-[#737373]">
            Create a free ReUseHub account or sign in to publish second-hand
            listings, upload photos, and chat with buyers.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-[#3B2B25] text-white text-sm font-semibold"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl border border-[#3B2B25] text-[#3B2B25] text-sm font-semibold"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-6">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B2B25] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
        <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#3B2B25] mt-2">
          Give Your Item a Second Life
        </h1>
        <p className="text-sm text-[#737373] mt-1">
          Provide clear photos, honest condition notes, and fair pricing to
          connect with buyers or swap partners.
        </p>
      </div>

      <form
        onSubmit={(e) => handleSubmit(e, "Active")}
        className="bg-white rounded-3xl border border-[#E6E1DA] p-6 sm:p-8 space-y-8 shadow-xs"
      >
        {/* 1. Product Photos Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#242424]">
                Product Photos (Up to 5)
              </h2>
              <p className="text-xs text-[#737373]">
                Upload JPEG, PNG, or WebP images (max 5MB each). The first photo
                is your primary cover image.
              </p>
            </div>
            <span className="text-xs font-mono-price font-semibold text-[#9A8174]">
              {images.length} / 5 photos
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {images.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className={`relative aspect-square rounded-2xl overflow-hidden border-2 bg-[#F3EFEA] group ${
                  idx === 0 ? "border-[#3B2B25]" : "border-[#E6E1DA]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Upload preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === 0 ? (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#3B2B25] text-white text-[10px] font-semibold">
                    Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleMakePrimary(idx)}
                    title="Set as primary cover photo"
                    className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-white/90 text-[#3B2B25] text-[10px] font-semibold flex items-center gap-1 hover:bg-white"
                  >
                    <Star className="w-3 h-3" />
                    <span>Make Primary</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  aria-label="Remove image"
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-[#C7BCB2] bg-[#FAF8F5] hover:border-[#3B2B25] hover:bg-[#F3EFEA] transition-colors flex flex-col items-center justify-center p-3 text-center cursor-pointer">
                <Upload className="w-6 h-6 text-[#3B2B25] mb-1.5" />
                <span className="text-xs font-semibold text-[#3B2B25]">
                  {uploading ? "Uploading..." : "Upload Photo"}
                </span>
                <span className="text-[10px] text-[#737373] mt-0.5">
                  JPG, PNG, WebP
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  disabled={uploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Optional Direct Image URL Input */}
          {images.length < 5 && (
            <div className="flex gap-2 items-center pt-1">
              <div className="relative flex-1">
                <ImageIcon className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="Or paste an image URL (https://...)"
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-xs sm:text-sm focus:outline-none focus:border-[#3B2B25]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="inline-flex items-center gap-1 px-3.5 h-10 rounded-xl bg-[#F3EFEA] text-xs font-semibold text-[#3B2B25] hover:bg-[#E6E1DA]"
              >
                <Plus className="w-4 h-4" />
                <span>Add URL</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. Core Listing Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#E6E1DA]">
          <div className="sm:col-span-2">
            <label
              htmlFor="sell-title"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              Listing Title *
            </label>
            <input
              id="sell-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mid-Century Danish Teak Lounge Chair in Oatmeal Bouclé"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
              required
            />
            {fieldErrors.title && (
              <p className="text-xs text-[#B93829] mt-1">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="sell-category"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              Category *
            </label>
            <select
              id="sell-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <p className="text-xs text-[#B93829] mt-1">
                {fieldErrors.categoryId}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="sell-price"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              Price (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono-price text-sm text-[#737373]">
                $
              </span>
              <input
                id="sell-price"
                type="number"
                step="0.01"
                min="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="145.00"
                className="w-full h-11 pl-8 pr-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] font-mono-price text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
                required
              />
            </div>
            {fieldErrors.price && (
              <p className="text-xs text-[#B93829] mt-1">{fieldErrors.price}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="sell-location"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              Pickup / Shipping Location *
            </label>
            <input
              id="sell-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Portland, OR"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
              required
            />
            {fieldErrors.location && (
              <p className="text-xs text-[#B93829] mt-1">
                {fieldErrors.location}
              </p>
            )}
          </div>
        </div>

        {/* 3. Condition Selector with Guide */}
        <div className="space-y-3 pt-4 border-t border-[#E6E1DA]">
          <span className="block text-xs font-semibold text-[#242424]">
            Condition Grade *
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONDITION_OPTIONS.map((opt) => {
              const active = condition === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setCondition(opt.value)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    active
                      ? "bg-[#F3EFEA] border-[#3B2B25] ring-1 ring-[#3B2B25]"
                      : "bg-[#FAF8F5] border-[#E6E1DA] hover:border-[#9A8174]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#242424]">
                      {opt.label}
                    </span>
                    {active && (
                      <CheckCircle2 className="w-4 h-4 text-[#3B2B25]" />
                    )}
                  </div>
                  <p className="text-xs text-[#737373] mt-1 leading-relaxed">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Description & Provenance */}
        <div className="space-y-1.5 pt-4 border-t border-[#E6E1DA]">
          <label
            htmlFor="sell-description"
            className="block text-xs font-semibold text-[#242424]"
          >
            Detailed Description & Dimensions *
          </label>
          <textarea
            id="sell-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Share the story of this item, measurements, included accessories, and any honest wear..."
            className="w-full p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
            required
          />
          {fieldErrors.description && (
            <p className="text-xs text-[#B93829] mt-1">
              {fieldErrors.description}
            </p>
          )}
        </div>

        {/* 5. Negotiable & Swap Preferences */}
        <div className="space-y-4 pt-4 border-t border-[#E6E1DA]">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isNegotiable}
              onChange={(e) => setIsNegotiable(e.target.checked)}
              className="w-4 h-4 rounded accent-[#3B2B25]"
            />
            <div>
              <span className="text-sm font-semibold text-[#242424] block">
                Open to reasonable price offers
              </span>
              <span className="text-xs text-[#737373]">
                Displays a &ldquo;Negotiable&rdquo; badge on your product card.
              </span>
            </div>
          </label>

          <div>
            <label
              htmlFor="sell-exchange"
              className="block text-xs font-semibold text-[#242424] mb-1.5"
            >
              Optional Exchange / Swap Preference
            </label>
            <input
              id="sell-exchange"
              type="text"
              value={exchangeDescription}
              onChange={(e) => setExchangeDescription(e.target.value)}
              placeholder="e.g. Open to swapping for ceramic tableware, studio headphones, or art books"
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:bg-white focus:border-[#3B2B25]"
            />
          </div>
        </div>

        {/* 6. Submit / Save Draft / Cancel */}
        <div className="pt-6 border-t border-[#E6E1DA] flex flex-wrap items-center justify-end gap-3">
          <Link
            href="/products"
            className="px-5 py-3 rounded-xl border border-[#E6E1DA] text-sm font-medium text-[#737373] hover:bg-[#F3EFEA]"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={submitting || uploading}
            onClick={(e) => handleSubmit(e, "Draft")}
            className="px-5 py-3 rounded-xl border border-[#3B2B25] text-sm font-semibold text-[#3B2B25] hover:bg-[#F3EFEA] disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="px-7 py-3 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] transition-colors disabled:opacity-50"
          >
            {submitting ? "Publishing..." : "Publish Listing"}
          </button>
        </div>
      </form>
    </div>
  );
}
