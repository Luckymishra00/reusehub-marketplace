"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

const CONDITION_OPTIONS = ["Like New", "Excellent", "Good", "Fair"];
const STATUS_OPTIONS = ["Draft", "Active", "Reserved", "Sold", "Archived"];

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading, showToast } = useAuth();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingListing, setLoadingListing] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [condition, setCondition] = useState("Excellent");
  const [status, setStatus] = useState("Active");
  const [location, setLocation] = useState("");
  const [isNegotiable, setIsNegotiable] = useState(false);
  const [exchangeDescription, setExchangeDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadListing = useCallback(async () => {
    setLoadingListing(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch("/api/v1/categories"),
        fetch(`/api/v1/products/${params.id}`, { cache: "no-store" }),
      ]);
      const catJson = await catRes.json();
      if (catJson.data) setCategories(catJson.data);

      const prodJson = await prodRes.json();
      if (!prodRes.ok || !prodJson.data) {
        showToast("Listing not found", "error");
        router.push("/dashboard/listings");
        return;
      }

      const item = prodJson.data;
      if (user && item.sellerId !== user.id && user.role !== "admin") {
        setNotAuthorized(true);
        return;
      }

      setTitle(item.title);
      setDescription(item.description);
      setPrice(String(item.price));
      setCategoryId(String(item.categoryId));
      setCondition(item.condition);
      setStatus(item.status);
      setLocation(item.location);
      setIsNegotiable(Boolean(item.isNegotiable));
      setExchangeDescription(item.exchangeDescription || "");
      setImages(
        Array.isArray(item.images)
          ? item.images.map((i: { imageUrl: string }) => i.imageUrl)
          : [item.primaryImage]
      );
    } catch {
      showToast("Failed to load listing for editing", "error");
    } finally {
      setLoadingListing(false);
    }
  }, [params.id, router, showToast, user]);

  useEffect(() => {
    if (!authLoading) {
      loadListing();
    }
  }, [authLoading, loadListing]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    if (images.length + fileList.length > 5) {
      showToast("Maximum of 5 images allowed per listing", "error");
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
        showToast(json.message || "Upload failed", "error");
        return;
      }
      const uploadedUrls: string[] = json.data?.urls || [];
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
      showToast("New photos added", "success");
    } catch {
      showToast("Error uploading files", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price: Number(price),
          categoryId: Number(categoryId),
          condition,
          status,
          location: location.trim(),
          isNegotiable,
          exchangeDescription: exchangeDescription.trim() || null,
          images,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Update failed", "error");
        return;
      }
      showToast("Listing updated successfully!", "success");
      router.push(`/products/${params.id}`);
    } catch {
      showToast("Failed to save changes", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingListing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="h-96 bg-[#EFECE6] rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!user || notAuthorized) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="font-serif-display text-3xl font-semibold text-[#B93829]">
          Access Denied
        </h1>
        <p className="text-sm text-[#737373]">
          Only the owner of this listing can edit its details.
        </p>
        <Link
          href={`/products/${params.id}`}
          className="inline-block px-6 py-2.5 rounded-xl bg-[#3B2B25] text-white text-sm font-medium"
        >
          Return to Listing
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="mb-6">
        <Link
          href={`/products/${params.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3B2B25] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Product Page</span>
        </Link>
        <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25] mt-2">
          Edit Listing
        </h1>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white rounded-3xl border border-[#E6E1DA] p-6 sm:p-8 space-y-7 shadow-xs"
      >
        {/* Photos Manager */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#242424]">
              Listing Gallery ({images.length}/5)
            </h2>
            <span className="text-xs text-[#737373]">
              First photo is primary
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            {images.map((url, idx) => (
              <div
                key={`${url}-${idx}`}
                className={`relative aspect-square rounded-2xl overflow-hidden border-2 bg-[#F3EFEA] ${
                  idx === 0 ? "border-[#3B2B25]" : "border-[#E6E1DA]"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Listing photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {idx === 0 ? (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#3B2B25] text-white text-[10px] font-semibold">
                    Primary
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setImages((prev) => {
                        const copy = [...prev];
                        const [picked] = copy.splice(idx, 1);
                        return [picked, ...copy];
                      })
                    }
                    className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-white/90 text-[#3B2B25] text-[10px] font-semibold flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    <span>Make Primary</span>
                  </button>
                )}
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            {images.length < 5 && (
              <label className="aspect-square rounded-2xl border-2 border-dashed border-[#C7BCB2] bg-[#FAF8F5] hover:border-[#3B2B25] flex flex-col items-center justify-center p-3 text-center cursor-pointer">
                <Upload className="w-5 h-5 text-[#3B2B25] mb-1" />
                <span className="text-xs font-semibold text-[#3B2B25]">
                  {uploading ? "Uploading..." : "Add Photo"}
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

          {images.length < 5 && (
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <ImageIcon className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="Or paste an image URL..."
                  className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-xs sm:text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (customImageUrl.trim() && images.length < 5) {
                    setImages((p) => [...p, customImageUrl.trim()]);
                    setCustomImageUrl("");
                  }
                }}
                className="inline-flex items-center gap-1 px-3.5 h-10 rounded-xl bg-[#F3EFEA] text-xs font-semibold text-[#3B2B25]"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-[#E6E1DA]">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              Price (USD) *
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] font-mono-price text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              Condition *
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
            >
              {CONDITION_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              Listing Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm font-semibold text-[#3B2B25]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              Location *
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#242424] mb-1.5">
              Description *
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
              required
            />
          </div>

          <div className="sm:col-span-2 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer text-sm font-medium text-[#242424]">
              <input
                type="checkbox"
                checked={isNegotiable}
                onChange={(e) => setIsNegotiable(e.target.checked)}
                className="w-4 h-4 rounded accent-[#3B2B25]"
              />
              <span>Price is negotiable</span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                Exchange / Trade Preference (optional)
              </label>
              <input
                type="text"
                value={exchangeDescription}
                onChange={(e) => setExchangeDescription(e.target.value)}
                placeholder="Items you would accept in trade..."
                className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
              />
            </div>
          </div>
        </div>

        <div className="pt-5 border-t border-[#E6E1DA] flex items-center justify-end gap-3">
          <Link
            href={`/products/${params.id}`}
            className="px-5 py-2.5 rounded-xl border border-[#E6E1DA] text-sm font-medium text-[#737373]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || uploading}
            className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitting ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
