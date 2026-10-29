"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Heart,
  MessageSquare,
  PlusCircle,
  User,
  LogOut,
  Menu,
  X,
  Recycle,
  LayoutDashboard,
  Package,
  ShieldCheck,
} from "lucide-react";

export function Navbar() {
  const { user, unreadMessages, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setMobileMenuOpen(false);
    if (trimmed) {
      router.push(`/products?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/products");
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E6E1DA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#3B2B25] flex items-center justify-center text-[#FAF8F5] shadow-sm group-hover:bg-[#2A1E1A] transition-colors">
              <Recycle className="w-5 h-5" />
            </div>
            <div>
              <span className="font-serif-display text-xl sm:text-2xl font-semibold tracking-tight text-[#3B2B25] block leading-none">
                ReUseHub
              </span>
              <span className="text-[11px] uppercase tracking-widest text-[#9A8174] font-medium block mt-0.5">
                Pre-Loved Exchange
              </span>
            </div>
          </Link>

          {/* Desktop Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-4"
          >
            <div className="relative w-full">
              <Search className="w-4 h-4 text-[#737373] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cameras, teak chairs, linen jackets, cookware..."
                aria-label="Search marketplace items"
                className="w-full h-11 pl-11 pr-20 rounded-full bg-[#F3EFEA] border border-[#E6E1DA] text-sm text-[#242424] placeholder-[#737373] focus:outline-none focus:bg-white focus:border-[#3B2B25] focus:ring-2 focus:ring-[#3B2B25]/15 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-full bg-[#3B2B25] text-[#FAF8F5] text-xs font-medium hover:bg-[#2A1E1A] transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop Navigation Actions */}
          <nav className="hidden md:flex items-center gap-5 shrink-0">
            <Link
              href="/products"
              className={`text-sm font-medium transition-colors ${
                pathname === "/products"
                  ? "text-[#3B2B25] font-semibold"
                  : "text-[#737373] hover:text-[#242424]"
              }`}
            >
              Browse
            </Link>

            <Link
              href="/favorites"
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                pathname === "/favorites"
                  ? "text-[#3B2B25] font-semibold"
                  : "text-[#737373] hover:text-[#242424]"
              }`}
              title="Saved Favorites"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden lg:inline">Saved</span>
            </Link>

            {user && (
              <Link
                href="/messages"
                className={`relative flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  pathname.startsWith("/messages")
                    ? "text-[#3B2B25] font-semibold"
                    : "text-[#737373] hover:text-[#242424]"
                }`}
                title="Messages"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden lg:inline">Inbox</span>
                {unreadMessages > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[11px] font-bold leading-none text-white bg-[#6D8065] rounded-full">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            )}

            <Link
              href="/sell"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-medium hover:bg-[#2A1E1A] transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Start Selling</span>
            </Link>

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-full border border-[#E6E1DA] bg-white hover:border-[#9A8174] transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B2B25]/20"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-8 h-8 rounded-full bg-[#F3EFEA] overflow-hidden flex items-center justify-center text-[#3B2B25] font-semibold text-xs">
                    {user.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profileImage}
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#242424] max-w-[100px] truncate">
                    {user.fullName.split(" ")[0]}
                  </span>
                </button>

                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white border border-[#E6E1DA] shadow-xl py-2 z-20">
                      <div className="px-4 py-2.5 border-b border-[#E6E1DA]">
                        <p className="text-sm font-semibold text-[#242424] truncate">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-[#737373] truncate">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#242424] hover:bg-[#F3EFEA]"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#9A8174]" />
                        Dashboard Overview
                      </Link>
                      <Link
                        href="/dashboard/listings"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#242424] hover:bg-[#F3EFEA]"
                      >
                        <Package className="w-4 h-4 text-[#9A8174]" />
                        My Listings
                      </Link>
                      <Link
                        href={`/users/${user.id}`}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#242424] hover:bg-[#F3EFEA]"
                      >
                        <User className="w-4 h-4 text-[#9A8174]" />
                        Public Seller Profile
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          href="/dashboard?tab=admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#6D8065] font-medium hover:bg-[#F3EFEA]"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Admin Stewardship
                        </Link>
                      )}
                      <div className="border-t border-[#E6E1DA] mt-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[#B93829] hover:bg-[#FDF3F2] text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-[#3B2B25] hover:bg-[#F3EFEA] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-3.5 py-2 rounded-xl border border-[#3B2B25] text-sm font-medium text-[#3B2B25] hover:bg-[#3B2B25] hover:text-[#FAF8F5] transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/sell"
              className="px-3 py-1.5 rounded-lg bg-[#3B2B25] text-[#FAF8F5] text-xs font-medium"
            >
              + Sell
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="p-2 rounded-xl text-[#3B2B25] hover:bg-[#F3EFEA]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pre-loved goods..."
              aria-label="Search pre-loved goods"
              className="w-full h-10 pl-10 pr-16 rounded-full bg-[#F3EFEA] border border-[#E6E1DA] text-sm text-[#242424] focus:outline-none focus:bg-white focus:border-[#3B2B25]"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-[#3B2B25] text-[#FAF8F5] text-xs font-medium"
            >
              Go
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E6E1DA] px-4 pt-3 pb-6 space-y-2">
          <Link
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-medium text-[#242424] hover:bg-[#F3EFEA]"
          >
            Browse Marketplace
          </Link>
          <Link
            href="/favorites"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-base font-medium text-[#242424] hover:bg-[#F3EFEA]"
          >
            Saved Favorites
          </Link>
          {user ? (
            <>
              <Link
                href="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-base font-medium text-[#242424] hover:bg-[#F3EFEA]"
              >
                <span>Messages</span>
                {unreadMessages > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-[#6D8065] text-white rounded-full">
                    {unreadMessages} unread
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-medium text-[#242424] hover:bg-[#F3EFEA]"
              >
                Seller Dashboard
              </Link>
              <Link
                href="/dashboard/listings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-medium text-[#242424] hover:bg-[#F3EFEA]"
              >
                My Listings
              </Link>
              <Link
                href={`/users/${user.id}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-base font-medium text-[#242424] hover:bg-[#F3EFEA]"
              >
                Public Profile ({user.fullName})
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl text-base font-medium text-[#B93829] hover:bg-[#FDF3F2]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-[#3B2B25] text-[#3B2B25] font-medium"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] font-medium"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
