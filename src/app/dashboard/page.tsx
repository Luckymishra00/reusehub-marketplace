"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ProductItem } from "@/components/ProductCard";
import {
  LayoutDashboard,
  Package,
  Heart,
  MessageSquare,
  User,
  Lock,
  PlusCircle,
  Edit3,
  Trash2,
  Archive,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Upload,
} from "lucide-react";

interface DashboardOverview {
  stats: {
    activeListings: number;
    soldListings: number;
    reservedListings: number;
    totalListings: number;
    totalFavorites: number;
    unreadMessages: number;
  };
  recentListings: ProductItem[];
  recentConversations: Array<{
    id: number;
    updatedAt: string;
    otherUser: {
      id: number;
      fullName: string;
      profileImage: string | null;
    } | null;
    product: {
      id: number;
      title: string;
      price: string;
      status: string;
    } | null;
  }>;
}

export function DashboardContent({
  defaultTab = "overview",
}: {
  defaultTab?: string;
}) {
  const {
    user,
    loading: authLoading,
    refreshUser,
    showToast,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") || defaultTab;

  const [activeTab, setActiveTab] = useState(tabParam);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [myListings, setMyListings] = useState<ProductItem[]>([]);
  const [myFavorites, setMyFavorites] = useState<ProductItem[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loadingData, setLoadingData] = useState(true);

  // Destructive action confirmation modal state
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  // Profile Settings form state
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Change form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Admin metrics
  const [adminData, setAdminData] = useState<{
    totalUsers: number;
    totalProducts: number;
    totalContactMessages: number;
    recentContacts: Array<{
      id: number;
      name: string;
      email: string;
      subject: string;
      message: string;
      createdAt: string;
    }>;
  } | null>(null);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || defaultTab);
  }, [searchParams, defaultTab]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setLocation(user.location || "");
      setBio(user.bio || "");
      setProfileImage(user.profileImage || "");
    }
  }, [user]);

  const loadDashboardAll = useCallback(async () => {
    if (!user) {
      setLoadingData(false);
      return;
    }
    setLoadingData(true);
    try {
      const [dashRes, listingsRes, favRes] = await Promise.all([
        fetch("/api/v1/dashboard", { cache: "no-store" }),
        fetch("/api/v1/products/mine", { cache: "no-store" }),
        fetch("/api/v1/favorites", { cache: "no-store" }),
      ]);

      const [dashJson, listingsJson, favJson] = await Promise.all([
        dashRes.json(),
        listingsRes.json(),
        favRes.json(),
      ]);

      if (dashRes.ok) setOverview(dashJson.data);
      if (listingsRes.ok) setMyListings(listingsJson.data || []);
      if (favRes.ok) setMyFavorites(favJson.data || []);

      if (user.role === "admin") {
        const admRes = await fetch("/api/v1/admin/dashboard", {
          cache: "no-store",
        });
        if (admRes.ok) {
          const admJson = await admRes.json();
          setAdminData(admJson.data);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      loadDashboardAll();
    }
  }, [authLoading, loadDashboardAll]);

  const handleStatusChange = async (productId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/v1/products/${productId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Status update failed", "error");
        return;
      }
      showToast(`Listing marked as ${newStatus}`, "success");
      await loadDashboardAll();
    } catch {
      showToast("Error updating status", "error");
    }
  };

  const handleDeleteListing = async (productId: number) => {
    try {
      const res = await fetch(`/api/v1/products/${productId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Could not delete listing", "error");
        return;
      }
      showToast("Listing permanently deleted", "info");
      setConfirmDeleteId(null);
      await loadDashboardAll();
    } catch {
      showToast("Error deleting listing", "error");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/v1/uploads", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (res.ok && json.data?.urls?.[0]) {
        setProfileImage(json.data.urls[0]);
        showToast("Profile photo uploaded—click Save Profile to apply", "info");
      } else {
        showToast(json.message || "Upload failed", "error");
      }
    } catch {
      showToast("Failed to upload photo", "error");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/v1/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          location: location.trim() || null,
          bio: bio.trim() || null,
          profileImage: profileImage.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Could not update profile", "error");
        return;
      }
      await refreshUser();
      showToast("Profile settings updated!", "success");
    } catch {
      showToast("Failed to save profile", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const res = await fetch("/api/v1/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Password change failed", "error");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password updated successfully", "success");
    } catch {
      showToast("Error changing password", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeactivateAccount = async () => {
    try {
      const res = await fetch("/api/v1/users/me", { method: "DELETE" });
      if (res.ok) {
        await refreshUser();
        showToast("Your account has been deactivated", "info");
        router.push("/");
      } else {
        showToast("Failed to deactivate account", "error");
      }
    } catch {
      showToast("Error deactivating account", "error");
    }
  };

  if (authLoading || loadingData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-3 h-80 bg-[#EFECE6] rounded-3xl animate-pulse" />
          <div className="lg:col-span-9 h-96 bg-[#EFECE6] rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E6E1DA] space-y-4">
          <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25]">
            Sign In Required
          </h1>
          <p className="text-sm text-[#737373]">
            Please sign in to access your seller dashboard, manage listings, and
            update account settings.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-xl bg-[#3B2B25] text-white text-sm font-semibold"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const filteredMyListings =
    statusFilter === "all"
      ? myListings
      : myListings.filter((item) => item.status === statusFilter);

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "listings",
      label: `My Listings (${myListings.length})`,
      icon: Package,
    },
    {
      id: "favorites",
      label: `Favorites (${myFavorites.length})`,
      icon: Heart,
    },
    {
      id: "messages",
      label: `Messages (${overview?.stats.unreadMessages ?? 0} unread)`,
      icon: MessageSquare,
    },
    { id: "profile", label: "Profile Settings", icon: User },
    { id: "security", label: "Account Security", icon: Lock },
    ...(user.role === "admin"
      ? [{ id: "admin", label: "Admin Stewardship", icon: ShieldCheck }]
      : []),
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6E1DA]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
            Member Workspace
          </span>
          <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25] mt-1">
            Welcome back, {user.fullName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/users/${user.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#E6E1DA] text-xs sm:text-sm font-medium text-[#242424] hover:border-[#3B2B25]"
          >
            <span>Public Seller Profile</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/sell"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-xs sm:text-sm font-semibold hover:bg-[#2A1E1A]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Listing</span>
          </Link>
        </div>
      </div>

      {/* 12-Column Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Left Sidebar Navigation */}
        <aside className="lg:col-span-3">
          <nav className="bg-white p-3 rounded-3xl border border-[#E6E1DA] flex lg:flex-col gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-[#3B2B25] text-[#FAF8F5] font-semibold"
                      : "text-[#242424] hover:bg-[#F3EFEA]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Main Panel */}
        <div className="lg:col-span-9 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#E6E1DA]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                    Active Listings
                  </p>
                  <p className="font-mono-price text-3xl font-semibold text-[#3B2B25] mt-2">
                    {overview?.stats.activeListings ?? 0}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E6E1DA]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                    Sold Items
                  </p>
                  <p className="font-mono-price text-3xl font-semibold text-[#6D8065] mt-2">
                    {overview?.stats.soldListings ?? 0}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E6E1DA]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                    Saved Favorites
                  </p>
                  <p className="font-mono-price text-3xl font-semibold text-[#242424] mt-2">
                    {overview?.stats.totalFavorites ?? 0}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E6E1DA]">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#737373]">
                    Unread Messages
                  </p>
                  <p className="font-mono-price text-3xl font-semibold text-[#3B2B25] mt-2">
                    {overview?.stats.unreadMessages ?? 0}
                  </p>
                </div>
              </div>

              {/* Recent Listings & Recent Conversations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-[#E6E1DA] space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif-display text-lg font-semibold text-[#242424]">
                      Recent Listings
                    </h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("listings")}
                      className="text-xs font-semibold text-[#3B2B25] hover:underline"
                    >
                      Manage All
                    </button>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="py-8 text-center space-y-2">
                      <p className="text-sm text-[#737373]">
                        You haven&apos;t listed any items yet.
                      </p>
                      <Link
                        href="/sell"
                        className="inline-block px-4 py-2 rounded-xl bg-[#3B2B25] text-white text-xs font-semibold"
                      >
                        Create Your First Listing
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myListings.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.primaryImage}
                              alt={item.title}
                              className="w-12 h-12 rounded-xl object-cover bg-[#EFECE6] shrink-0"
                            />
                            <div className="min-w-0">
                              <Link
                                href={`/products/${item.id}`}
                                className="text-sm font-semibold text-[#242424] hover:underline truncate block"
                              >
                                {item.title}
                              </Link>
                              <p className="text-xs font-mono-price text-[#737373]">
                                ${item.price} • {item.status}
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/products/${item.id}/edit`}
                            className="px-3 py-1.5 rounded-lg bg-white border border-[#E6E1DA] text-xs font-semibold text-[#3B2B25]"
                          >
                            Edit
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Conversations */}
                <div className="bg-white p-6 rounded-3xl border border-[#E6E1DA] space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif-display text-lg font-semibold text-[#242424]">
                      Recent Conversations
                    </h2>
                    <Link
                      href="/messages"
                      className="text-xs font-semibold text-[#3B2B25] hover:underline"
                    >
                      Open Inbox
                    </Link>
                  </div>

                  {!overview?.recentConversations ||
                  overview.recentConversations.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-[#737373]">
                        No active conversations yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {overview.recentConversations.map((c) => (
                        <Link
                          key={c.id}
                          href={`/messages?conversationId=${c.id}`}
                          className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] hover:border-[#3B2B25] transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#242424] truncate">
                              {c.otherUser?.fullName || "Member"}
                            </p>
                            <p className="text-xs text-[#737373] truncate">
                              Re: {c.product?.title || "Listing"}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-[#3B2B25] shrink-0">
                            Reply →
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY LISTINGS MANAGEMENT */}
          {activeTab === "listings" && (
            <div className="bg-white rounded-3xl border border-[#E6E1DA] p-6 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif-display text-2xl font-semibold text-[#242424]">
                    My Product Listings
                  </h2>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Manage availability, edit descriptions, or archive completed
                    sales.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {["all", "Active", "Reserved", "Sold", "Draft", "Archived"].map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          statusFilter === st
                            ? "bg-[#3B2B25] text-white"
                            : "bg-[#FAF8F5] text-[#737373] border border-[#E6E1DA]"
                        }`}
                      >
                        {st === "all" ? "All" : st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {filteredMyListings.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <Package className="w-10 h-10 text-[#9A8174] mx-auto" />
                  <h3 className="font-serif-display text-xl font-semibold text-[#242424]">
                    No Listings Found
                  </h3>
                  <p className="text-sm text-[#737373]">
                    Ready to give an unused item a second home?
                  </p>
                  <Link
                    href="/sell"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#3B2B25] text-white text-sm font-semibold"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create a Listing</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMyListings.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA]"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <Link
                          href={`/products/${item.id}`}
                          className="w-16 h-16 rounded-2xl overflow-hidden bg-[#EFECE6] shrink-0 border border-[#E6E1DA]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.primaryImage}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/products/${item.id}`}
                              className="text-base font-semibold text-[#242424] hover:text-[#3B2B25] hover:underline truncate"
                            >
                              {item.title}
                            </Link>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-[#E6E1DA] text-[#3B2B25]">
                              {item.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#737373] mt-1">
                            <span className="font-mono-price font-semibold text-[#3B2B25]">
                              ${item.price}
                            </span>
                            <span>•</span>
                            <span>{item.condition}</span>
                            <span>•</span>
                            <span>
                              Listed{" "}
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Listing Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link
                          href={`/products/${item.id}/edit`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E6E1DA] text-xs font-semibold text-[#242424] hover:border-[#3B2B25]"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Link>

                        {item.status !== "Sold" && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(item.id, "Sold")}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#6D8065] text-white text-xs font-semibold hover:bg-[#5A6B53]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Sold</span>
                          </button>
                        )}

                        {item.status !== "Archived" ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(item.id, "Archived")
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E6E1DA] text-xs font-medium text-[#737373] hover:text-[#242424]"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            <span>Archive</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusChange(item.id, "Active")
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#3B2B25] text-xs font-semibold text-[#3B2B25]"
                          >
                            <span>Reactivate</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          className="p-2 rounded-xl text-[#B93829] hover:bg-[#FDF3F2]"
                          title="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FAVORITES */}
          {activeTab === "favorites" && (
            <div className="bg-white rounded-3xl border border-[#E6E1DA] p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-serif-display text-2xl font-semibold text-[#242424]">
                  Saved Wishlist ({myFavorites.length})
                </h2>
                <Link
                  href="/favorites"
                  className="text-xs font-semibold text-[#3B2B25] hover:underline"
                >
                  Open Full Wishlist View
                </Link>
              </div>

              {myFavorites.length === 0 ? (
                <p className="text-sm text-[#737373] py-8 text-center">
                  You have no saved favorites yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {myFavorites.map((fav) => (
                    <div
                      key={fav.id}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA]"
                    >
                      <Link
                        href={`/products/${fav.id}`}
                        className="flex items-center gap-3 min-w-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fav.primaryImage}
                          alt={fav.title}
                          className="w-14 h-14 rounded-xl object-cover bg-[#EFECE6] shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#242424] truncate">
                            {fav.title}
                          </p>
                          <p className="text-xs font-mono-price text-[#3B2B25]">
                            ${fav.price} • {fav.condition}
                          </p>
                        </div>
                      </Link>
                      <Link
                        href={`/products/${fav.id}`}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#E6E1DA] text-xs font-semibold text-[#3B2B25] shrink-0"
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MESSAGES */}
          {activeTab === "messages" && (
            <div className="bg-white rounded-3xl border border-[#E6E1DA] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-serif-display text-2xl font-semibold text-[#242424]">
                    Buyer–Seller Conversations
                  </h2>
                  <p className="text-xs text-[#737373]">
                    You have {overview?.stats.unreadMessages ?? 0} unread
                    messages.
                  </p>
                </div>
                <Link
                  href="/messages"
                  className="px-4 py-2 rounded-xl bg-[#3B2B25] text-white text-xs font-semibold"
                >
                  Launch Full Inbox
                </Link>
              </div>

              {!overview?.recentConversations ||
              overview.recentConversations.length === 0 ? (
                <p className="text-sm text-[#737373] py-8 text-center">
                  No conversations started yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {overview.recentConversations.map((c) => (
                    <Link
                      key={c.id}
                      href={`/messages?conversationId=${c.id}`}
                      className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] hover:border-[#3B2B25]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#242424]">
                          {c.otherUser?.fullName || "Member"}
                        </p>
                        <p className="text-xs text-[#737373]">
                          Product: {c.product?.title} (${c.product?.price})
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#3B2B25]">
                        Open Chat →
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PROFILE SETTINGS */}
          {activeTab === "profile" && (
            <form
              onSubmit={handleSaveProfile}
              className="bg-white rounded-3xl border border-[#E6E1DA] p-6 sm:p-8 space-y-6"
            >
              <div>
                <h2 className="font-serif-display text-2xl font-semibold text-[#242424]">
                  Profile Settings
                </h2>
                <p className="text-xs text-[#737373] mt-0.5">
                  Update your public seller bio, location, and avatar. Your
                  email address ({user.email}) is kept private.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-[#F3EFEA] border border-[#E6E1DA] overflow-hidden flex items-center justify-center text-2xl font-serif-display text-[#3B2B25] shrink-0">
                  {profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profileImage}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    fullName.charAt(0)
                  )}
                </div>
                <div className="space-y-2 flex-1">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F3EFEA] text-xs font-semibold text-[#3B2B25] cursor-pointer hover:bg-[#E6E1DA]">
                    <Upload className="w-4 h-4" />
                    <span>Upload New Avatar</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    placeholder="Or paste avatar image URL..."
                    className="w-full h-10 px-3.5 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Portland, OR"
                    className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                    Seller Biography
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Share a little about the kinds of items you collect, sell, or swap..."
                    className="w-full p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] disabled:opacity-50"
                >
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: ACCOUNT SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <form
                onSubmit={handleSavePassword}
                className="bg-white rounded-3xl border border-[#E6E1DA] p-6 sm:p-8 space-y-5"
              >
                <div>
                  <h2 className="font-serif-display text-2xl font-semibold text-[#242424]">
                    Change Password
                  </h2>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Verify your current password to set a new bcrypt-secured
                    password.
                  </p>
                </div>

                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                      New Password (min 8 characters) *
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#242424] mb-1.5">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-6 py-2.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] disabled:opacity-50"
                >
                  {savingPassword ? "Updating..." : "Update Password"}
                </button>
              </form>

              <div className="bg-[#FDF3F2] rounded-3xl border border-[#F5C6C2] p-6 space-y-3">
                <h3 className="text-base font-semibold text-[#8E261B]">
                  Deactivate Account
                </h3>
                <p className="text-xs text-[#8E261B]/90 leading-relaxed">
                  Deactivating your account will sign you out and automatically
                  archive all of your active marketplace listings so buyers can
                  no longer inquire about them.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmDeactivate(true)}
                  className="px-4 py-2 rounded-xl bg-[#B93829] text-white text-xs font-semibold hover:bg-[#8E261B]"
                >
                  Deactivate My Account
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: ADMIN STEWARDSHIP */}
          {activeTab === "admin" && user.role === "admin" && (
            <div className="bg-white rounded-3xl border border-[#E6E1DA] p-6 space-y-6">
              <div>
                <h2 className="font-serif-display text-2xl font-semibold text-[#242424]">
                  Administrator Overview
                </h2>
                <p className="text-xs text-[#737373]">
                  Platform metrics and community support inquiries stored in the
                  database.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA]">
                  <p className="text-xs text-[#737373]">Registered Users</p>
                  <p className="font-mono-price text-2xl font-semibold text-[#3B2B25] mt-1">
                    {adminData?.totalUsers ?? 0}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA]">
                  <p className="text-xs text-[#737373]">Total Listings</p>
                  <p className="font-mono-price text-2xl font-semibold text-[#3B2B25] mt-1">
                    {adminData?.totalProducts ?? 0}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA]">
                  <p className="text-xs text-[#737373]">Contact Inquiries</p>
                  <p className="font-mono-price text-2xl font-semibold text-[#3B2B25] mt-1">
                    {adminData?.totalContactMessages ?? 0}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#242424]">
                  Recent Contact Form Submissions
                </h3>
                {!adminData?.recentContacts ||
                adminData.recentContacts.length === 0 ? (
                  <p className="text-xs text-[#737373]">
                    No contact messages submitted yet.
                  </p>
                ) : (
                  adminData.recentContacts.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6E1DA] space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#242424]">
                          {msg.subject} — {msg.name} ({msg.email})
                        </span>
                        <span className="text-[#737373]">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-[#5C534E]">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Listing Confirmation Dialog */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E6E1DA] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#B93829]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif-display text-xl font-semibold">
                Delete Listing Permanently?
              </h3>
            </div>
            <p className="text-sm text-[#737373]">
              This will permanently remove this product and its associated
              gallery images. If you just sold the item, consider marking it as
              Sold or Archived instead.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E1DA] text-xs font-semibold text-[#737373]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteListing(confirmDeleteId)}
                className="px-5 py-2 rounded-xl bg-[#B93829] text-white text-xs font-semibold hover:bg-[#8E261B]"
              >
                Yes, Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Confirmation Dialog */}
      {confirmDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl border border-[#E6E1DA] max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-[#B93829]">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif-display text-xl font-semibold">
                Confirm Account Deactivation
              </h3>
            </div>
            <p className="text-sm text-[#737373]">
              Are you sure you want to deactivate your ReUseHub account and
              archive all active listings?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeactivate(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E1DA] text-xs font-semibold text-[#737373]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateAccount}
                className="px-5 py-2 rounded-xl bg-[#B93829] text-white text-xs font-semibold hover:bg-[#8E261B]"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="h-96 bg-[#EFECE6] rounded-3xl animate-pulse" />
        </div>
      }
    >
      <DashboardContent defaultTab="overview" />
    </Suspense>
  );
}
