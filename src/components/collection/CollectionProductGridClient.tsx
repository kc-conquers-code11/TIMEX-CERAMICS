"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { SlidersHorizontal } from "lucide-react";
import { resolveProductImage } from "@/utils/productImages";
import { ProductCard } from "@/components/product/ProductCard";
import { matchesProductCategory } from "@/utils/productCategories";

interface CollectionProductGridClientProps {
  initialProducts: any[];
  collectionSlug: string;
  collectionId: string;
  collectionName: string;
}

function filterCategoryProducts(
  all: any[],
  collectionSlug: string,
  collectionId: string,
  collectionName: string
): any[] {
  const seen = new Set<string>();
  return all.filter((p: any) => {
    if (!p) return false;
    if (
      p.is_trashed ||
      p.isTrashed ||
      p.isActive === false ||
      p.is_active === false ||
      p.status === "Inactive" ||
      p.status === "Draft"
    ) {
      return false;
    }

    const isMatch =
      matchesProductCategory(p, collectionSlug) ||
      matchesProductCategory(p, collectionId) ||
      matchesProductCategory(p, collectionName);

    if (!isMatch) return false;

    const key = String(p.id || p.slug || "").trim();
    if (key) {
      if (seen.has(key)) return false;
      seen.add(key);
    }
    return true;
  });
}

export function LiveCategoryCount({
  initialCount,
  collectionSlug,
  collectionId,
  collectionName,
}: {
  initialCount: number;
  collectionSlug: string;
  collectionId: string;
  collectionName: string;
}) {
  const [count, setCount] = useState<number>(initialCount);

  useEffect(() => {
    const syncCount = () => {
      fetch("/api/v1/products?_t=" + Date.now())
        .then((res) => res.json())
        .then((data) => {
          const all = Array.isArray(data.products) ? data.products : Array.isArray(data) ? data : [];
          if (all.length > 0) {
            setCount(filterCategoryProducts(all, collectionSlug, collectionId, collectionName).length);
          }
        })
        .catch(() => {});
    };
    syncCount();
    window.addEventListener("product-updated", syncCount);
    return () => window.removeEventListener("product-updated", syncCount);
  }, [collectionSlug, collectionId, collectionName]);

  return (
    <span className="block font-serif text-2xl font-bold text-[#C95745]">
      {count}
    </span>
  );
}

export function CollectionProductGridClient({
  initialProducts,
  collectionSlug,
  collectionId,
  collectionName,
}: CollectionProductGridClientProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [sortBy, setSortBy] = useState<"all" | "new" | "alphabetic">("all");

  // Sync with initialProducts when prop changes
  useEffect(() => {
    if (Array.isArray(initialProducts)) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  // Derived sorted / filtered products based on active sort
  const displayProducts = useMemo(() => {
    const list = [...products];
    if (sortBy === "alphabetic") {
      return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }
    if (sortBy === "new") {
      return list.filter((p) => p.isNewArrival || p.is_new_arrival);
    }
    return list;
  }, [products, sortBy]);

  // Live Database Rehydration: ensures products added or edited in /admin reflect immediately
  useEffect(() => {
    fetch("/api/v1/products?_t=" + Date.now())
      .then((res) => res.json())
      .then((data) => {
        const all = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);
        if (all.length > 0) {
          // Always sync, including empty results, so removals/deactivations reflect
          setProducts(filterCategoryProducts(all, collectionSlug, collectionId, collectionName));
        }
      })
      .catch(() => {});
  }, [collectionSlug, collectionId, collectionName]);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 sm:py-24">
      {/* Products Heading & Filter Trigger */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b border-[#EDEAE4] gap-4">
        <div>
          <span className="text-xs md:text-sm text-[#333333]/70 font-medium block mb-1">
            Showing all {products.length} results
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#101B38]">
            {collectionName} Series
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Sort Bar: All | New Arrivals | Alphabetic */}
          <div className="inline-flex items-center rounded border border-[#EDEAE4] bg-white p-1 shadow-xs">
            <button
              onClick={() => setSortBy("all")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "all"
                  ? "bg-[#101B38] text-[#FCFBF8]"
                  : "text-[#333333] hover:text-[#101B38]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSortBy("new")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "new"
                  ? "bg-[#101B38] text-[#FCFBF8]"
                  : "text-[#333333] hover:text-[#101B38]"
              }`}
            >
              New Arrivals
            </button>
            <button
              onClick={() => setSortBy("alphabetic")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                sortBy === "alphabetic"
                  ? "bg-[#101B38] text-[#FCFBF8]"
                  : "text-[#333333] hover:text-[#101B38]"
              }`}
            >
              Alphabetic
            </button>
          </div>

          <Link href={`/products?category=${collectionSlug}`}>
            <Button variant="outline" size="sm" className="text-[11px] tracking-wider uppercase font-medium flex items-center space-x-2 border-[#333333] text-[#101B38] hover:bg-[#101B38] hover:text-[#FCFBF8] rounded-[2px]">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter Catalog</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${displayProducts.length <= 2 ? "md:grid-cols-2 max-w-4xl mx-auto" : "md:grid-cols-2 lg:grid-cols-3"} gap-6 md:gap-8`}>
        {displayProducts.map((prod) => (
          <ProductCard key={prod.id || prod.slug} product={prod} />
        ))}
      </div>
    </section>
  );
}
