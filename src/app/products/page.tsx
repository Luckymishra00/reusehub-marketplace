"use client";

import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProductCard, ProductItem } from "@/components/ProductCard";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  PackageSearch,
} from "lucide-react";

interface CategoryOption {
  id: number;
  name: string;
  slug: string;
  activeCount: number;
}

const CONDITIONS = ["Like New", "Excellent", "Good", "Fair"];

function BrowseMarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial state from URL query params
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [condition, setCondition] = useState(
    searchParams.get("condition") || ""
  );
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [negotiable, setNegotiable] = useState(
    searchParams.get("negotiable") === "true"
  );
  const [exchange, setExchange] = useState(
    searchParams.get("exchange") === "true"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [page, setPage] = useState(
    Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
  );

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync local state if URL query changes externally (e.g. Navbar search or back button)
  useEffect(() => {
    setQ(searchParams.get("q") || "");
    setCategory(searchParams.get("category") || "");
    setCondition(searchParams.get("condition") || "");
    setLocation(searchParams.get("location") || "");
    setMinPrice(searchParams.get("minPrice") || "");
    setMaxPrice(searchParams.get("maxPrice") || "");
    setNegotiable(searchParams.get("negotiable") === "true");
    setExchange(searchParams.get("exchange") === "true");
    setSort(searchParams.get("sort") || "newest");
    setPage(Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1));
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/v1/categories")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) setCategories(json.data);
      })
      .catch(() => {});
  }, []);

  const updateUrlParams = useCallback(
    (overrides: Record<string, string | number | boolean | null>) => {
      const params = new URLSearchParams();
      const nextState = {
        q,
        category,
        condition,
        location,
        minPrice,
        maxPrice,
        negotiable,
        exchange,
        sort,
        page,
        ...overrides,
      };

      if (nextState.q) params.set("q", String(nextState.q).trim());
      if (nextState.category)
        params.set("category", String(nextState.category));
      if (nextState.condition)
        params.set("condition", String(nextState.condition));
      if (nextState.location)
        params.set("location", String(nextState.location).trim());
      if (nextState.minPrice)
        params.set("minPrice", String(nextState.minPrice));
      if (nextState.maxPrice)
        params.set("maxPrice", String(nextState.maxPrice));
      if (nextState.negotiable) params.set("negotiable", "true");
      if (nextState.exchange) params.set("exchange", "true");
      if (nextState.sort && nextState.sort !== "newest") {
        params.set("sort", String(nextState.sort));
      }
      if (Number(nextState.page) > 1) {
        params.set("page", String(nextState.page));
      }

      const qs = params.toString();
      router.push(qs ? `/products?${qs}` : "/products", { scroll: false });
    },
    [
      q,
      category,
      condition,
      location,
      minPrice,
      maxPrice,
      negotiable,
      exchange,
      sort,
      page,
      router,
    ]
  );

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiParams = new URLSearchParams();
      if (searchParams.get("q")) apiParams.set("q", searchParams.get("q")!);
      if (searchParams.get("category"))
        apiParams.set("category", searchParams.get("category")!);
      if (searchParams.get("condition"))
        apiParams.set("condition", searchParams.get("condition")!);
      if (searchParams.get("location"))
        apiParams.set("location", searchParams.get("location")!);
      if (searchParams.get("minPrice"))
        apiParams.set("minPrice", searchParams.get("minPrice")!);
      if (searchParams.get("maxPrice"))
        apiParams.set("maxPrice", searchParams.get("maxPrice")!);
      if (searchParams.get("negotiable") === "true")
        apiParams.set("negotiable", "true");
      if (searchParams.get("exchange") === "true")
        apiParams.set("exchange", "true");
      apiParams.set("sort", searchParams.get("sort") || "newest");
      apiParams.set("page", searchParams.get("page") || "1");
      apiParams.set("limit", "9");

      const res = await fetch(`/api/v1/products?${apiParams.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || "Failed to load products");
      }
      setProducts(json.data || []);
      setPagination(
        json.pagination || { page: 1, limit: 9, total: 0, totalPages: 0 }
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load marketplace items"
      );
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleClearAllFilters = () => {
    setQ("");
    setCategory("");
    setCondition("");
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setNegotiable(false);
    setExchange(false);
    setSort("newest");
    setPage(1);
    router.push("/products");
  };

  const hasActiveFilters = Boolean(
    q ||
      category ||
      condition ||
      location ||
      minPrice ||
      maxPrice ||
      negotiable ||
      exchange
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6E1DA]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
            Second-Hand Catalog
          </span>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-semibold text-[#3B2B25] mt-1">
            Browse Marketplace
          </h1>
          <p className="text-sm text-[#737373] mt-1">
            Showing {pagination.total}{" "}
            {pagination.total === 1 ? "curated listing" : "curated listings"}{" "}
            available for purchase or swap
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((o) => !o)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E6E1DA] text-sm font-medium text-[#242424]"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#3B2B25]" />
            <span>Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs font-medium text-[#737373] whitespace-nowrap"
            >
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                updateUrlParams({ sort: e.target.value, page: 1 });
              }}
              className="h-10 px-3.5 rounded-xl bg-white border border-[#E6E1DA] text-sm text-[#242424] font-medium focus:outline-none focus:border-[#3B2B25]"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main 12-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Left Filter Sidebar (3 columns on desktop) */}
        <aside
          className={`lg:col-span-3 space-y-6 ${
            mobileFiltersOpen ? "block" : "hidden lg:block"
          }`}
        >
          <div className="bg-white p-5 rounded-2xl border border-[#E6E1DA] space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#3B2B25]">
                Filter Listings
              </h2>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#B93829] hover:underline"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset all</span>
                </button>
              )}
            </div>

            {/* Keyword Search */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateUrlParams({ q, page: 1 });
              }}
              className="space-y-1.5"
            >
              <label
                htmlFor="filter-q"
                className="block text-xs font-semibold text-[#242424]"
              >
                Keyword Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-[#737373] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="filter-q"
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Title, description..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:border-[#3B2B25]"
                />
              </div>
            </form>

            {/* Category Selector */}
            <div className="space-y-2">
              <label
                htmlFor="filter-category"
                className="block text-xs font-semibold text-[#242424]"
              >
                Category
              </label>
              <select
                id="filter-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  updateUrlParams({ category: e.target.value, page: 1 });
                }}
                className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm text-[#242424] focus:outline-none focus:border-[#3B2B25]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name} ({c.activeCount})
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#242424]">
                Price Range ($)
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Min $"
                    aria-label="Minimum price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    onBlur={() => updateUrlParams({ minPrice, page: 1 })}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:border-[#3B2B25]"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="0"
                    placeholder="Max $"
                    aria-label="Maximum price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    onBlur={() => updateUrlParams({ maxPrice, page: 1 })}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:border-[#3B2B25]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateUrlParams({ minPrice, maxPrice, page: 1 })}
                className="w-full py-1.5 rounded-lg bg-[#F3EFEA] text-xs font-semibold text-[#3B2B25] hover:bg-[#E6E1DA] transition-colors"
              >
                Apply Price Range
              </button>
            </div>

            {/* Condition Filter */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-[#242424]">
                Item Condition
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCondition("");
                    updateUrlParams({ condition: "", page: 1 });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    condition === ""
                      ? "bg-[#3B2B25] text-white border-[#3B2B25]"
                      : "bg-[#FAF8F5] text-[#242424] border-[#E6E1DA] hover:border-[#9A8174]"
                  }`}
                >
                  Any
                </button>
                {CONDITIONS.map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => {
                      const next = condition === cond ? "" : cond;
                      setCondition(next);
                      updateUrlParams({ condition: next, page: 1 });
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      condition === cond
                        ? "bg-[#3B2B25] text-white border-[#3B2B25]"
                        : "bg-[#FAF8F5] text-[#242424] border-[#E6E1DA] hover:border-[#9A8174]"
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Location Filter */}
            <div className="space-y-1.5">
              <label
                htmlFor="filter-location"
                className="block text-xs font-semibold text-[#242424]"
              >
                City or State
              </label>
              <div className="flex gap-2">
                <input
                  id="filter-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      updateUrlParams({ location, page: 1 });
                    }
                  }}
                  placeholder="e.g. Portland, Seattle, Austin"
                  className="w-full h-10 px-3 rounded-xl bg-[#FAF8F5] border border-[#E6E1DA] text-sm focus:outline-none focus:border-[#3B2B25]"
                />
                <button
                  type="button"
                  onClick={() => updateUrlParams({ location, page: 1 })}
                  className="px-3 rounded-xl bg-[#F3EFEA] text-xs font-semibold text-[#3B2B25] hover:bg-[#E6E1DA]"
                >
                  Go
                </button>
              </div>
            </div>

            {/* Exchange & Negotiable Toggles */}
            <div className="space-y-2.5 pt-2 border-t border-[#E6E1DA]">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-[#242424]">
                <input
                  type="checkbox"
                  checked={exchange}
                  onChange={(e) => {
                    setExchange(e.target.checked);
                    updateUrlParams({ exchange: e.target.checked, page: 1 });
                  }}
                  className="w-4 h-4 rounded accent-[#3B2B25]"
                />
                <span>Open to Swap / Exchange</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-[#242424]">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => {
                    setNegotiable(e.target.checked);
                    updateUrlParams({ negotiable: e.target.checked, page: 1 });
                  }}
                  className="w-4 h-4 rounded accent-[#3B2B25]"
                />
                <span>Negotiable Price</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Right Product Grid (9 columns on desktop) */}
        <div className="lg:col-span-9 space-y-6">
          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 bg-white p-3.5 rounded-2xl border border-[#E6E1DA]">
              <span className="text-xs font-semibold text-[#737373] mr-1">
                Active filters:
              </span>
              {q && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    updateUrlParams({ q: "", page: 1 });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFEA] text-xs font-medium text-[#3B2B25]"
                >
                  <span>Search: &ldquo;{q}&rdquo;</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {category && (
                <button
                  type="button"
                  onClick={() => {
                    setCategory("");
                    updateUrlParams({ category: "", page: 1 });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFEA] text-xs font-medium text-[#3B2B25]"
                >
                  <span>Category: {category}</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {condition && (
                <button
                  type="button"
                  onClick={() => {
                    setCondition("");
                    updateUrlParams({ condition: "", page: 1 });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFEA] text-xs font-medium text-[#3B2B25]"
                >
                  <span>Condition: {condition}</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {location && (
                <button
                  type="button"
                  onClick={() => {
                    setLocation("");
                    updateUrlParams({ location: "", page: 1 });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFEA] text-xs font-medium text-[#3B2B25]"
                >
                  <span>Location: {location}</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {(minPrice || maxPrice) && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    updateUrlParams({ minPrice: "", maxPrice: "", page: 1 });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EFEA] text-xs font-medium text-[#3B2B25]"
                >
                  <span>
                    Price: ${minPrice || "0"} – ${maxPrice || "Any"}
                  </span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {exchange && (
                <button
                  type="button"
                  onClick={() => {
                    setExchange(false);
                    updateUrlParams({ exchange: false, page: 1 });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2EA] text-xs font-medium text-[#2F472B]"
                >
                  <span>Swap Eligible</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {negotiable && (
                <button
                  type="button"
                  onClick={() => {
                    setNegotiable(false);
                    updateUrlParams({ negotiable: false, page: 1 });
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF2EA] text-xs font-medium text-[#2F472B]"
                >
                  <span>Negotiable</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleClearAllFilters}
                className="ml-auto text-xs font-semibold text-[#B93829] hover:underline"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-8 rounded-2xl bg-[#FDF3F2] border border-[#F5C6C2] text-center space-y-3">
              <p className="text-base font-semibold text-[#8E261B]">{error}</p>
              <button
                type="button"
                onClick={fetchProducts}
                className="px-4 py-2 rounded-xl bg-[#3B2B25] text-white text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading Skeletons */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
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
          ) : products.length === 0 ? (
            /* Empty State */
            <div className="bg-white rounded-3xl border border-[#E6E1DA] p-12 text-center max-w-lg mx-auto my-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F3EFEA] text-[#3B2B25] flex items-center justify-center mx-auto">
                <PackageSearch className="w-7 h-7" />
              </div>
              <h3 className="font-serif-display text-2xl font-semibold text-[#242424]">
                No Matching Listings Found
              </h3>
              <p className="text-sm text-[#737373] leading-relaxed">
                We couldn&apos;t find any active second-hand items matching your
                exact filter combination. Try broadening your price range or
                clearing active filters.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-6 py-2.5 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-medium hover:bg-[#2A1E1A] transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="pt-8 flex items-center justify-between border-t border-[#E6E1DA]">
                  <p className="text-xs sm:text-sm text-[#737373]">
                    Page{" "}
                    <span className="font-semibold text-[#242424]">
                      {pagination.page}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-[#242424]">
                      {pagination.totalPages}
                    </span>{" "}
                    ({pagination.total} total items)
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() => {
                        const prev = Math.max(1, pagination.page - 1);
                        setPage(prev);
                        updateUrlParams({ page: prev });
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-[#E6E1DA] text-xs sm:text-sm font-medium text-[#242424] hover:border-[#3B2B25] disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <button
                      type="button"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => {
                        const next = Math.min(
                          pagination.totalPages,
                          pagination.page + 1
                        );
                        setPage(next);
                        updateUrlParams({ page: next });
                      }}
                      className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-[#E6E1DA] text-xs sm:text-sm font-medium text-[#242424] hover:border-[#3B2B25] disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowseMarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="h-10 w-64 bg-[#EFECE6] rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="aspect-[4/5] bg-[#EFECE6] rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      }
    >
      <BrowseMarketplaceContent />
    </Suspense>
  );
}
