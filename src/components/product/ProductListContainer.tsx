"use client";

import React, { useState, useEffect, useMemo, useRef, Fragment } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Mic, Grid, List, Heart, SlidersHorizontal, X, Sparkles, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useWishlist } from "@/store/useWishlist";
import { matchProductSearch } from "@/services/product";
import { resolveProductImage, getProductSpaceImage, getProductColorImage } from "@/utils/productImages";
import { ProductCard } from "@/components/product/ProductCard";
import {
  getOrderedFilterKeys,
  matchProductWithFilter,
} from "@/data/navigationFilters";

export interface ProductListProps {
  initialProducts: any[];
  initialFilter?: { key: string; value: string };
  primaryFilterGroup?: string;
  pageTitle?: string;
  pageDescription?: string;
  pageEyebrow?: string;
  backLink?: { label: string; href: string };
  basePath?: string;
}

export function ProductListContainer({
  initialProducts,
  initialFilter,
  primaryFilterGroup,
  pageTitle,
  pageDescription,
  pageEyebrow,
  backLink,
  basePath,
}: ProductListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentBasePath = basePath || pathname || "/products";

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Zustand Wishlist
  const wishlist = useWishlist();

  // Sync search query if changed externally
  useEffect(() => {
    const urlSearch = searchParams.get("search");
    if (urlSearch !== null && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  // Primary filter group determination for dynamic ordering (Requirement 15)
  const currentPrimaryGroup = useMemo(() => {
    return (
      searchParams.get("primaryGroup") ||
      primaryFilterGroup ||
      initialFilter?.key ||
      ""
    );
  }, [searchParams, primaryFilterGroup, initialFilter]);

  // Read active filters from searchParams with initialFilter fallback
  const activeCategory = searchParams.get("category") ?? (initialFilter?.key === "category" ? initialFilter.value : "");
  const activeApplication = searchParams.get("application") ?? (initialFilter?.key === "application" ? initialFilter.value : "");
  const activeMaterial = searchParams.get("material") ?? (initialFilter?.key === "material" ? initialFilter.value : "");
  const activeSpace = searchParams.get("space") ?? (initialFilter?.key === "space" ? initialFilter.value : "");
  const activeFinish = searchParams.get("finish") ?? (initialFilter?.key === "finish" ? initialFilter.value : "");
  const activeShape = searchParams.get("shape") ?? (initialFilter?.key === "shape" ? initialFilter.value : "");
  const activeDesign = searchParams.get("design") ?? (initialFilter?.key === "design" ? initialFilter.value : "");
  const activeColor = searchParams.get("color") ?? (initialFilter?.key === "color" ? initialFilter.value : "");
  const activeSize = searchParams.get("size") ?? (initialFilter?.key === "size" ? initialFilter.value : "");
  const activeOrigin = searchParams.get("origin") ?? (initialFilter?.key === "origin" ? initialFilter.value : "");
  const activeLook = searchParams.get("look") || "";
  const activeTag = searchParams.get("tag") || "";
  const activeSort = (searchParams.get("sort") || "").toLowerCase().trim();
  const isAlphabetic = activeSort === "alphabetic" || activeSort === "alpha" || activeSort === "a-z" || activeTag === "alphabetic";
  const activeFilter = (searchParams.get("filter") || "").toLowerCase().trim();

  const [liveProducts, setLiveProducts] = useState(initialProducts);
  const hasHydratedLiveRef = useRef(false);

  // Sync with initialProducts only before live MySQL rehydration completes
  useEffect(() => {
    if (!hasHydratedLiveRef.current && initialProducts && initialProducts.length > 0) {
      setLiveProducts(initialProducts);
    }
  }, [initialProducts]);

  // Live Database Rehydration: always sync with MySQL on mount and on update events
  useEffect(() => {
    const refreshLiveProducts = () => {
      fetch("/api/v1/products?activeOnly=true&_t=" + Date.now())
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            hasHydratedLiveRef.current = true;
            setLiveProducts(data.products);
          }
        })
        .catch(() => {});
    };

    refreshLiveProducts();

    window.addEventListener("product-updated", refreshLiveProducts);
    return () => window.removeEventListener("product-updated", refreshLiveProducts);
  }, []);

  // Filter products across all dimensions
  const products = useMemo(() => {
    const isNewArrivalFilter =
      activeFilter === "new-arrivals" ||
      activeFilter === "new_arrivals" ||
      activeFilter === "new-arrival" ||
      activeFilter === "new" ||
      activeTag === "new-arrival" ||
      activeTag === "new_arrival";

    const isFeaturedFilter =
      activeFilter === "featured" ||
      activeFilter === "featured-collection" ||
      activeFilter === "featured-collections" ||
      activeFilter === "featured_collection";

    const filtered = liveProducts.filter((p) => {
      if (searchQuery && !matchProductSearch(p, searchQuery)) {
        return false;
      }
      if (isNewArrivalFilter) {
        if (!Boolean(p.isNewArrival || p.is_new_arrival)) return false;
      }
      if (isFeaturedFilter) {
        const isDirect = Boolean(p.isFeatured || p.is_featured || p.featured);
        const pCatId = (p.categoryId || p.category_id || "").toLowerCase();
        const pCatName = (p.category || p.category_name || "").toLowerCase();
        const pSec = [
          ...(Array.isArray(p.secondaryCategories) ? p.secondaryCategories : []),
          ...(Array.isArray(p.secondary_categories) ? p.secondary_categories : []),
        ].map((s: string) => String(s).toLowerCase());

        const featuredSlugs = ["brick", "marble", "hexagon"];
        const inCat = featuredSlugs.some(
          (slug) => pCatId === slug || pCatName.includes(slug) || pSec.includes(slug)
        );
        if (!isDirect && !inCat) return false;
      }
      if (activeCategory && !matchProductWithFilter(p, "category", activeCategory)) {
        return false;
      }
      if (activeApplication && !matchProductWithFilter(p, "application", activeApplication)) {
        return false;
      }
      if (activeMaterial && !matchProductWithFilter(p, "material", activeMaterial)) {
        return false;
      }
      if (activeSpace && !matchProductWithFilter(p, "space", activeSpace)) {
        return false;
      }
      if (activeFinish && !matchProductWithFilter(p, "finish", activeFinish)) {
        return false;
      }
      if (activeShape && !matchProductWithFilter(p, "shape", activeShape)) {
        return false;
      }
      if (activeDesign && !matchProductWithFilter(p, "design", activeDesign)) {
        return false;
      }
      if (activeColor && !matchProductWithFilter(p, "color", activeColor)) {
        return false;
      }
      if (activeSize && !matchProductWithFilter(p, "size", activeSize)) {
        return false;
      }
      if (activeOrigin && !matchProductWithFilter(p, "origin", activeOrigin)) {
        return false;
      }
      if (activeLook && p.look && p.look.toLowerCase() !== activeLook.toLowerCase()) {
        return false;
      }
      return true;
    });

    if (isAlphabetic) {
      return [...filtered].sort((a, b) => {
        const nameA = String(a.name || a.title || "").trim();
        const nameB = String(b.name || b.title || "").trim();
        return nameA.localeCompare(nameB, undefined, { sensitivity: "base", numeric: true });
      });
    }

    return filtered;
  }, [
    liveProducts,
    searchQuery,
    activeTag,
    activeSort,
    isAlphabetic,
    activeCategory,
    activeApplication,
    activeMaterial,
    activeSpace,
    activeFinish,
    activeShape,
    activeDesign,
    activeColor,
    activeSize,
    activeOrigin,
    activeLook,
    activeFilter,
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    activeTag,
    activeSort,
    isAlphabetic,
    activeFilter,
    activeCategory,
    activeApplication,
    activeMaterial,
    activeSpace,
    activeFinish,
    activeShape,
    activeDesign,
    activeColor,
    activeSize,
    activeOrigin,
    activeLook,
  ]);

  const totalPages = Math.max(1, Math.ceil(products.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return products.slice(start, start + pageSize);
  }, [products, safeCurrentPage, pageSize]);

  // Apply filters via router
  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    // If initialFilter was set for this key and we are overriding or clearing it
    if (initialFilter && initialFilter.key === key) {
      if (!value || value.toLowerCase() === initialFilter.value.toLowerCase()) {
        // Clearing primary filter from a dedicated route takes user to /products
        if (!value) {
          params.delete(key);
          const fallbackTarget = activeFilter ? `${currentBasePath}?filter=${activeFilter}` : "/products";
          router.push(params.toString() ? `${fallbackTarget}&${params.toString()}` : fallbackTarget);
          return;
        }
      }
    }

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    if (searchQuery) {
      params.set("search", searchQuery);
    }

    const targetBase = currentBasePath.startsWith("/") ? currentBasePath : `/${currentBasePath}`;
    const qs = params.toString();
    router.push(qs ? `${targetBase}?${qs}` : targetBase);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    if (activeFilter) {
      router.push(`${currentBasePath}?filter=${activeFilter}`);
    } else if (currentBasePath.startsWith("/collections")) {
      router.push("/collections");
    } else {
      router.push("/products");
    }
  };

  // Web Speech API Voice Search
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser. Please try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const voiceResult = event.results[0][0].transcript;
      setSearchQuery(voiceResult);
      setFilter("search", voiceResult);
    };
    recognition.start();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter("search", searchQuery);
  };

  // Definitions for all 10 filter sections
  const ALL_FILTER_SECTIONS: Record<string, { title: string; key: string; options: string[] }> = {
    category: {
      title: "Category",
      key: "category",
      options: [
        "Brick", "Marble", "Hexagon", "Modular", "Stone", "Subway", "Moroccan",
        "Octagonal", "Wooden", "Texture", "Colorful", "Terrazzo", "Tropical",
        "Metallic", "Highlighter", "White", "Mosaic", "Boutique", "French frames", "Fabric",
      ],
    },
    application: {
      title: "Application",
      key: "application",
      options: ["Wall", "Floor", "Wall & Floor", "Exterior"],
    },
    material: {
      title: "Material",
      key: "material",
      options: ["Ceramic Tiles", "Porcelain Tiles", "Designer Tiles", "Anti Skid Tiles"],
    },
    space: {
      title: "Space / Area",
      key: "space",
      options: [
        "Bathroom Tiles",
        "Kitchen Tiles",
        "Living & Dining Room Tiles",
        "Bedroom Tiles",
        "Balcony & Terrace Tiles",
        "Elevation & Exterior Tiles",
        "Hotel & Hospitality Tiles",
        "Café & Restaurant Tiles",
        "Commercial & Office Tiles",
        "Spa & Wellness Tiles",
        "Swimming Pool Tiles",
        "Outdoor & Landscape Tiles",
      ],
    },
    finish: {
      title: "Finish",
      key: "finish",
      options: [
        "Matt", "Glossy", "Rustic", "Textured", "3D",
        "Metallic", "Hand-Made", "Modern", "Contemporary", "Vintage",
      ],
    },
    shape: {
      title: "Shape",
      key: "shape",
      options: [
        "Rectangle", "Square", "Hexagon", "Octagon", "Brick",
        "Modular", "Diamond", "Fishscal", "Kite", "Petal",
        "Chevron", "Geometric", "Gesigner", "Decorative",
      ],
    },
    design: {
      title: "Design",
      key: "design",
      options: [
        "Subway Tiles", "Brick Tiles", "Hexagon Tiles", "Moroccan Tiles",
        "Mosaic Tiles", "Geometric Tiles", "Octagonal Tiles", "Modular Tiles",
      ],
    },
    color: {
      title: "Color",
      key: "color",
      options: [
        "Beige", "Black", "Blue", "Brown", "Colourful",
        "Copper", "Cotto", "Dark Wenge", "Gold", "Green",
        "Grey", "Pink", "Red", "Silver", "White", "Yellow",
      ],
    },
    size: {
      title: "Size",
      key: "size",
      options: [
        "Small Format Tiles", "Medium Format Tiles", "Large Format Tiles",
        "600mm X 1200mm", "300mm x 600mm", "600mm X 600mm", "400mm x 600mm",
        "150mm X 150mm", "200mm x 200mm", "800mm X 1800mm", "1200mm X 1200mm",
      ],
    },
    origin: {
      title: "Tiles From",
      key: "origin",
      options: ["Imported Tiles", "Italian Tiles", "Spanish Tiles", "European Tiles"],
    },
  };

  // Dynamically reorder sections so entry filter appears FIRST (Requirement 15)
  const orderedFilterSections = useMemo(() => {
    const keys = getOrderedFilterKeys(currentPrimaryGroup);
    return keys
      .map((k) => ALL_FILTER_SECTIONS[k])
      .filter(Boolean);
  }, [currentPrimaryGroup]);

  // Helper to get active value for any filter key
  const getActiveValue = (key: string): string => {
    switch (key) {
      case "category": return activeCategory;
      case "application": return activeApplication;
      case "material": return activeMaterial;
      case "space": return activeSpace;
      case "finish": return activeFinish;
      case "shape": return activeShape;
      case "design": return activeDesign;
      case "color": return activeColor;
      case "size": return activeSize;
      case "origin": return activeOrigin;
      default: return searchParams.get(key) || "";
    }
  };

  const hasAnyFilterActive = Boolean(
    activeCategory ||
    activeApplication ||
    activeMaterial ||
    activeSpace ||
    activeFinish ||
    activeShape ||
    activeDesign ||
    activeColor ||
    activeSize ||
    activeOrigin ||
    activeLook ||
    activeTag ||
    isAlphabetic ||
    searchQuery
  );

  return (
    <div className="relative w-full min-h-screen bg-[#F7F5F0] py-10 md:py-14">
      <div className="max-w-7xl mx-auto px-6 relative z-10">

        {/* Back Link if on specific landing */}
        {backLink && (
          <div className="mb-6">
            <Link
              href={backLink.href}
              className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-wider text-[#C95745] hover:text-[#101B38] font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{backLink.label}</span>
            </Link>
          </div>
        )}

        {/* 1. Header Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-12">
          <div className="space-y-2">
            <span className="text-[9px] tracking-[0.25em] text-[#C95745] font-semibold uppercase block">
              {pageEyebrow || "Exquisite Series"}
            </span>
            <h1 className="font-serif text-3xl md:text-5xl font-normal tracking-tight text-[#101B38]">
              {pageTitle || "Luxury Collections"}
            </h1>
            <p className="text-xs md:text-sm text-[#555555] font-normal mt-1">
              {pageDescription || `Browse through ${products.length} ultra-premium surfaces tailored for high-end architectures.`}
            </p>
          </div>

          {/* Search controls */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center w-full lg:max-w-md bg-[#FCFBF8] border border-[#EDEAE4] rounded-[2px] px-5 py-3 shadow-xs focus-within:border-[#101B38] transition-all"
          >
            <Search className="w-4.5 h-4.5 text-gray-400 mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search code, color, or design..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs outline-none text-[#101B38] font-medium placeholder-gray-400 bg-transparent"
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              className={`p-1.5 rounded-[2px] cursor-pointer hover:bg-[#EDEAE4] transition-colors ${
                isListening ? "text-[#C95745] bg-[#C95745]/10 animate-pulse" : "text-gray-400"
              }`}
              title="Search by voice"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 2. Listing Toolbar */}
        <div className="flex items-center justify-between border-y border-[#EDEAE4] py-4 mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center space-x-2 text-sm font-semibold text-[#101B38] hover:text-[#C95745] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters ({orderedFilterSections.length})</span>
          </button>

          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-xs text-[#777777] uppercase tracking-widest font-semibold">Active Filters:</span>
            <div className="flex flex-wrap gap-2 items-center">
              {activeApplication && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>App: {activeApplication}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("application", "")} />
                </span>
              )}
              {activeMaterial && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Material: {activeMaterial}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("material", "")} />
                </span>
              )}
              {activeSpace && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Space: {activeSpace}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("space", "")} />
                </span>
              )}
              {activeFinish && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Finish: {activeFinish}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("finish", "")} />
                </span>
              )}
              {activeShape && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Shape: {activeShape}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("shape", "")} />
                </span>
              )}
              {activeDesign && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Design: {activeDesign}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("design", "")} />
                </span>
              )}
              {activeColor && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Color: {activeColor}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("color", "")} />
                </span>
              )}
              {activeSize && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Size: {activeSize}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("size", "")} />
                </span>
              )}
              {activeOrigin && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>From: {activeOrigin}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("origin", "")} />
                </span>
              )}
              {activeCategory && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Cat: {activeCategory}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("category", "")} />
                </span>
              )}
              {activeTag && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Tag: {activeTag === "new-arrival" ? "New Arrivals" : activeTag}</span>
                  <X className="w-3 h-3 cursor-pointer hover:text-[#C95745]" onClick={() => setFilter("tag", "")} />
                </span>
              )}
              {isAlphabetic && (
                <span className="text-[10px] bg-[#EDEAE4] border border-[#DED9D0] text-[#101B38] font-medium px-2.5 py-1 rounded-[2px] flex items-center space-x-1">
                  <span>Sort: Alphabetic</span>
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-[#C95745]"
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.delete("sort");
                      if (params.get("tag") === "alphabetic") params.delete("tag");
                      const targetBase = currentBasePath.startsWith("/") ? currentBasePath : `/${currentBasePath}`;
                      const qs = params.toString();
                      router.push(qs ? `${targetBase}?${qs}` : targetBase);
                    }}
                  />
                </span>
              )}
              {!hasAnyFilterActive && (
                <span className="text-xs text-gray-400 font-light">None</span>
              )}
              {hasAnyFilterActive && (
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] text-gray-400 hover:text-[#C95745] font-semibold underline ml-2 cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Tag & Sort Filters */}
            <div className="hidden sm:flex items-center gap-1.5 p-1 bg-[#FCFBF8] rounded-[2px] border border-[#EDEAE4]">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("tag");
                  params.delete("sort");
                  const targetBase = currentBasePath.startsWith("/") ? currentBasePath : `/${currentBasePath}`;
                  const qs = params.toString();
                  router.push(qs ? `${targetBase}?${qs}` : targetBase);
                }}
                className={`px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-all cursor-pointer ${
                  !activeTag && !isAlphabetic
                    ? "bg-[#101B38] text-[#FCFBF8] shadow-xs"
                    : "text-[#555555] hover:text-[#101B38]"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (activeTag === "new-arrival") {
                    params.delete("tag");
                  } else {
                    params.set("tag", "new-arrival");
                    params.delete("sort");
                  }
                  const targetBase = currentBasePath.startsWith("/") ? currentBasePath : `/${currentBasePath}`;
                  const qs = params.toString();
                  router.push(qs ? `${targetBase}?${qs}` : targetBase);
                }}
                className={`px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTag === "new-arrival" && !isAlphabetic
                    ? "bg-[#C95745] text-[#FCFBF8] shadow-xs"
                    : "text-[#555555] hover:text-[#101B38]"
                }`}
              >
                <span>New Arrivals</span>
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  if (isAlphabetic) {
                    params.delete("sort");
                    if (params.get("tag") === "alphabetic") params.delete("tag");
                  } else {
                    params.set("sort", "alphabetic");
                    params.delete("tag");
                  }
                  const targetBase = currentBasePath.startsWith("/") ? currentBasePath : `/${currentBasePath}`;
                  const qs = params.toString();
                  router.push(qs ? `${targetBase}?${qs}` : targetBase);
                }}
                className={`px-3 py-1.5 rounded-[2px] text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isAlphabetic
                    ? "bg-[#101B38] text-[#FCFBF8] shadow-xs"
                    : "text-[#555555] hover:text-[#101B38]"
                }`}
                title="Sort Alphabetically (A to Z)"
              >
                <span>Alphabetic</span>
              </button>
            </div>

            <div className="flex items-center border border-[#EDEAE4] rounded-[2px] overflow-hidden bg-[#FCFBF8]">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === "grid" ? "bg-[#EDEAE4] text-[#101B38]" : "text-gray-400 hover:text-[#101B38]"
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors cursor-pointer ${
                  viewMode === "list" ? "bg-[#EDEAE4] text-[#101B38]" : "text-gray-400 hover:text-[#101B38]"
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Left Desktop Sidebar Filters with DYNAMIC ORDERING (Requirement 15) */}
          <aside className="hidden lg:block space-y-6 bg-[#FCFBF8] p-6 rounded-[2px] border border-[#EDEAE4] shadow-xs h-fit sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EDEAE4] pb-3 mb-2">
              <span className="font-sans text-xs font-bold tracking-widest text-[#101B38] uppercase">
                Filter By
              </span>
              {hasAnyFilterActive && (
                <button
                  onClick={clearAllFilters}
                  className="text-[10px] text-gray-400 hover:text-[#C95745] underline font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {orderedFilterSections.map((section, sIdx) => {
              const activeVal = getActiveValue(section.key);
              const isFirstSection = sIdx === 0;

              return (
                <div
                  key={section.key}
                  className={`pb-5 border-b border-[#EDEAE4] last:border-b-0 last:pb-0 ${
                    isFirstSection ? "pt-1" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-sans text-[11px] font-bold text-[#101B38] uppercase tracking-wider flex items-center space-x-1.5">
                      <span>{section.title}</span>
                      {isFirstSection && (
                        <span className="text-[8px] bg-[#C95745] text-[#FCFBF8] font-bold px-1.5 py-0.2 rounded-[2px] tracking-widest">
                          PRIMARY
                        </span>
                      )}
                    </h3>
                    {activeVal && (
                      <button
                        onClick={() => setFilter(section.key, "")}
                        className="text-[9px] text-[#C95745] hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1 max-h-[180px] overflow-y-auto pr-1">
                    {section.options.map((opt) => {
                      const isSelected = activeVal.toLowerCase() === opt.toLowerCase();
                      return (
                        <button
                          key={opt}
                          onClick={() => setFilter(section.key, isSelected ? "" : opt)}
                          className={`text-left text-[11px] font-medium py-1.5 px-3 rounded-[2px] transition-all duration-200 cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-[#101B38] text-[#FCFBF8] shadow-xs font-semibold"
                              : "text-[#555555] hover:bg-[#EDEAE4] hover:text-[#101B38]"
                          }`}
                        >
                          <span className="truncate">{opt}</span>
                          {isSelected && <span className="text-[10px] ml-1 shrink-0">&bull;</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </aside>

          {/* Right Product Grid */}
          <main className="lg:col-span-3">
            {products.length === 0 ? (
              <div className="py-24 text-center space-y-4 bg-[#FCFBF8] border border-[#EDEAE4] rounded-[2px] p-10 shadow-xs">
                <Sparkles className="w-10 h-10 text-[#C95745] mx-auto" />
                <h3 className="font-serif text-2xl font-bold text-[#101B38]">No Products Found</h3>
                <p className="text-sm text-[#333333]/70 font-light max-w-sm mx-auto leading-relaxed">
                  We couldn&apos;t find matching tiles for your current filter combination. Try clearing your filters or testing another query.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-4 inline-flex items-center justify-center bg-[#101B38] text-[#FCFBF8] hover:bg-[#C95745] text-xs font-medium tracking-wider uppercase px-6 py-3 rounded-[2px] transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                      : "flex flex-col space-y-6"
                  }
              >
                {paginatedProducts.map((prod: any) => {
                  const inWishlist = wishlist.hasItem(prod.id, prod.slug);

                  if (viewMode === "list") {
                    const collectionName =
                      prod.collection ||
                      prod.collection_name ||
                      (prod.category || prod.category_name ? `${prod.category || prod.category_name} Collection` : "Tile Collection");
                    const listProductHref =
                      activeColor && activeColor.trim()
                        ? `/product/${prod.slug}?color=${encodeURIComponent(activeColor.trim())}`
                        : `/product/${prod.slug}`;
                    return (
                      <div
                        key={prod.id}
                        className="bg-[#FCFBF8] border border-[#EDEAE4] rounded-[2px] overflow-hidden shadow-xs hover:border-[#101B38]/30 p-5 flex flex-col md:flex-row gap-6 transition-all duration-300 group"
                      >
                        <div className="relative w-full md:w-56 h-48 overflow-hidden rounded-[2px] bg-[#EDEAE4] flex-shrink-0">
                          <Link href={listProductHref} className="block w-full h-full">
                            <img
                              src={getProductSpaceImage(prod, activeSpace) || getProductColorImage(prod, activeColor) || resolveProductImage(prod.images?.[0], prod.categoryId, 0)}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          </Link>
                          {Boolean(prod.isNewArrival || prod.is_new_arrival) && (
                            <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                              <span className="text-[9px] font-semibold tracking-wider text-[#FCFBF8] bg-[#C95745] px-2.5 py-0.5 rounded-[2px] uppercase">
                                NEW
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-grow flex flex-col justify-between py-1">
                          <div className="space-y-2">
                            <Link href={listProductHref} className="block">
                              <h3 className="font-serif text-2xl font-bold text-[#101B38] group-hover:text-[#C95745] transition-colors">
                                {prod.name}
                              </h3>
                            </Link>
                            <p className="text-xs font-medium text-[#333333]/70 tracking-wider uppercase">
                              {collectionName.endsWith("Collection") ? collectionName : `${collectionName} Collection`}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-[#EDEAE4] pt-4 mt-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => (inWishlist ? wishlist.removeItem(prod.id, prod.slug) : wishlist.addItem(prod.id))}
                                className={`p-2.5 rounded-[2px] border transition-all cursor-pointer ${
                                  inWishlist
                                    ? "bg-red-50 border-red-200 text-[#C95745]"
                                    : "border-[#333333]/20 text-[#333333]/60 hover:text-[#101B38] hover:border-[#101B38]"
                                }`}
                                title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                              >
                                <Heart className={`w-4 h-4 ${inWishlist ? "fill-[#C95745] text-[#C95745]" : ""}`} />
                              </button>
                              <Link
                                href={listProductHref}
                                className="bg-[#101B38] text-[#FCFBF8] text-xs font-medium tracking-wider uppercase px-5 py-2.5 rounded-[2px] hover:bg-[#C95745] transition-colors"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return <ProductCard key={prod.id} product={prod} space={activeSpace} color={activeColor} />;
                })}
              </div>

              {/* Public Collection Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 pt-8 border-t border-[#EDEAE4] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-[#333333]/70 font-light">
                    Showing <span className="font-semibold text-[#101B38]">{(safeCurrentPage - 1) * pageSize + 1}</span> to{" "}
                    <span className="font-semibold text-[#101B38]">{Math.min(safeCurrentPage * pageSize, products.length)}</span> of{" "}
                    <span className="font-semibold text-[#101B38]">{products.length}</span> products
                  </p>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.max(1, p - 1));
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      disabled={safeCurrentPage <= 1}
                      className="p-2.5 rounded-[2px] border border-[#EDEAE4] bg-[#FCFBF8] text-[#101B38] hover:border-[#101B38] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 2)
                        .map((p, idx, arr) => {
                          const prev = arr[idx - 1];
                          const showEllipsis = prev && p - prev > 1;
                          return (
                            <React.Fragment key={p}>
                              {showEllipsis && <span className="px-1 text-xs text-[#333333]/50">...</span>}
                              <button
                                onClick={() => {
                                  setCurrentPage(p);
                                  window.scrollTo({ top: 300, behavior: "smooth" });
                                }}
                                className={`w-8 h-8 rounded-[2px] text-xs font-medium tracking-wider transition-colors cursor-pointer ${
                                  p === safeCurrentPage
                                    ? "bg-[#101B38] text-[#FCFBF8]"
                                    : "bg-[#FCFBF8] border border-[#EDEAE4] text-[#101B38] hover:border-[#101B38]"
                                }`}
                              >
                                {p}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => {
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      disabled={safeCurrentPage >= totalPages}
                      className="p-2.5 rounded-[2px] border border-[#EDEAE4] bg-[#FCFBF8] text-[#101B38] hover:border-[#101B38] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </main>
        </div>

        {/* Mobile Drawer filter sheet */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div className="fixed inset-0 bg-[#101B38]/50 backdrop-blur-xs" onClick={() => setShowFilters(false)} />
            <div className="relative w-80 bg-[#FCFBF8] h-full shadow-2xl p-6 overflow-y-auto z-10 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#EDEAE4] pb-4">
                  <span className="font-serif text-xl font-bold text-[#101B38]">Refine Selection</span>
                  <X className="w-5 h-5 text-[#333333]/70 hover:text-[#101B38] cursor-pointer" onClick={() => setShowFilters(false)} />
                </div>

                {/* Mobile Quick View / Sort */}
                <div className="space-y-2 pb-4 border-b border-[#EDEAE4]">
                  <span className="text-[10px] font-bold tracking-wider text-[#101B38] uppercase block">View & Sort</span>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F7F5F0] rounded-[2px] border border-[#EDEAE4]">
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete("tag");
                        params.delete("sort");
                        const targetBase = currentBasePath.startsWith("/") ? currentBasePath : `/${currentBasePath}`;
                        const qs = params.toString();
                        router.push(qs ? `${targetBase}?${qs}` : targetBase);
                        setShowFilters(false);
                      }}
                      className={`py-1.5 rounded-[2px] text-[11px] font-semibold text-center transition-all cursor-pointer ${
                        !activeTag && !isAlphabetic ? "bg-[#101B38] text-[#FCFBF8]" : "text-[#555555]"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        if (activeTag === "new-arrival") params.delete("tag");
                        else { params.set("tag", "new-arrival"); params.delete("sort"); }
                        const targetBase = currentBasePath.startsWith("/") ? currentBasePath : `/${currentBasePath}`;
                        const qs = params.toString();
                        router.push(qs ? `${targetBase}?${qs}` : targetBase);
                        setShowFilters(false);
                      }}
                      className={`py-1.5 rounded-[2px] text-[11px] font-semibold text-center transition-all cursor-pointer ${
                        activeTag === "new-arrival" && !isAlphabetic ? "bg-[#C95745] text-[#FCFBF8]" : "text-[#555555]"
                      }`}
                    >
                      New
                    </button>
                    <button
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        if (isAlphabetic) {
                          params.delete("sort");
                          if (params.get("tag") === "alphabetic") params.delete("tag");
                        } else {
                          params.set("sort", "alphabetic");
                          params.delete("tag");
                        }
                        const targetBase = currentBasePath.startsWith("/") ? currentBasePath : `/${currentBasePath}`;
                        const qs = params.toString();
                        router.push(qs ? `${targetBase}?${qs}` : targetBase);
                        setShowFilters(false);
                      }}
                      className={`py-1.5 rounded-[2px] text-[11px] font-semibold text-center transition-all cursor-pointer ${
                        isAlphabetic ? "bg-[#101B38] text-[#FCFBF8]" : "text-[#555555]"
                      }`}
                    >
                      Alphabetic
                    </button>
                  </div>
                </div>

                {orderedFilterSections.map((section, sIdx) => {
                  const activeVal = getActiveValue(section.key);
                  const isFirstSection = sIdx === 0;

                  return (
                    <div key={section.key} className="space-y-2 pb-4 border-b border-[#EDEAE4]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold tracking-wider text-[#101B38] uppercase flex items-center space-x-1.5">
                          <span>{section.title}</span>
                          {isFirstSection && (
                            <span className="text-[7.5px] bg-[#C95745] text-[#FCFBF8] font-bold px-1 py-0.2 rounded-[2px]">
                              PRIMARY
                            </span>
                          )}
                        </span>
                        {activeVal && (
                          <button
                            onClick={() => setFilter(section.key, "")}
                            className="text-[9px] text-[#C95745] hover:underline font-semibold"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {section.options.map((opt) => {
                          const isSelected = activeVal.toLowerCase() === opt.toLowerCase();
                          return (
                            <button
                              key={opt}
                              onClick={() => setFilter(section.key, isSelected ? "" : opt)}
                              className={`text-[10px] font-medium px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#101B38] text-[#FCFBF8] font-semibold"
                                  : "bg-[#EDEAE4] text-[#333333] hover:bg-[#101B38] hover:text-[#FCFBF8]"
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => {
                  clearAllFilters();
                  setShowFilters(false);
                }}
                className="w-full bg-[#101B38] text-[#FCFBF8] py-3 rounded-[2px] text-xs font-medium tracking-wider uppercase hover:bg-[#C95745] transition-colors cursor-pointer mt-6"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
