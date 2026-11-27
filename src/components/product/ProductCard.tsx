"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useWishlist } from "@/store/useWishlist";
import { resolveProductImage, getProductSpaceImage, getProductColorImage } from "@/utils/productImages";
import { resolveProductCollection } from "@/utils/productCollection";
import { TileOfSpainBadge } from "./TileOfSpainBadge";

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    category?: string;
    category_name?: string;
    categoryId?: string;
    category_id?: string;
    collection?: string;
    collection_name?: string;
    collectionId?: string;
    collection_id?: string;
    images?: string[];
    thumbnail?: string;
    isNewArrival?: boolean;
    is_new_arrival?: boolean;
    showTileOfSpainBadge?: boolean;
    show_tile_of_spain_badge?: boolean;
    spaceImages?: Record<string, string>;
    space_images?: Record<string, string>;
    colorImages?: Record<string, string | string[]>;
    color_images?: Record<string, string | string[]>;
  };
  priority?: boolean;
  space?: string;
  color?: string;
}

export function ProductCard({ product, priority = false, space, color }: ProductCardProps) {
  const wishlist = useWishlist();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const inWishlist = mounted ? wishlist.hasItem(product.id, product.slug) : false;

  const collectionInfo = resolveProductCollection(product);
  const collectionName = collectionInfo.name;

  const spaceImage = getProductSpaceImage(product, space);
  const colorVariantImage = getProductColorImage(product, color);
  const rawImage =
    spaceImage ||
    colorVariantImage ||
    (Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : (product.thumbnail || ""));

  const displayImage = resolveProductImage(
    rawImage,
    product.categoryId || product.category_id,
    0
  );

  const productHref =
    color && color.trim()
      ? `/product/${product.slug}?color=${encodeURIComponent(color.trim())}`
      : `/product/${product.slug}`;

  return (
    <div className="group flex flex-col bg-[#FCFBF8] border border-[#EDEAE4] rounded-[2px] overflow-hidden hover:shadow-lg hover:border-[#C95745]/40 transition-all duration-300 h-full relative">
      {/* Product Image Area */}
      <Link href={productHref} className="block relative aspect-[4/3] w-full bg-[#EDEAE4]/40 overflow-hidden">
        <Image
          src={displayImage}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {/* Subtle overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Product Tag Badges */}
        {Boolean(product.isNewArrival || product.is_new_arrival) && (
          <div className="absolute top-3 left-3 z-10 pointer-events-none">
            <span className="text-[9px] font-bold tracking-widest text-[#C95745] bg-[#FCFBF8]/95 px-2.5 py-0.5 rounded-[2px] shadow-xs border border-[#C95745]/30 uppercase font-sans">
              NEW
            </span>
          </div>
        )}

        {/* Tile of Spain Badge Overlay */}
        {Boolean(product.showTileOfSpainBadge || product.show_tile_of_spain_badge) && (
          <TileOfSpainBadge size="md" />
        )}
      </Link>

      {/* Wishlist Button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          inWishlist ? wishlist.removeItem(product.id, product.slug) : wishlist.addItem(product.id as any);
        }}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-[2px] bg-[#FCFBF8]/90 backdrop-blur-sm shadow-xs flex items-center justify-center text-[#333333] hover:text-[#C95745] hover:bg-[#FCFBF8] transition-colors cursor-pointer border border-[#EDEAE4]"
        aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={`w-4 h-4 ${inWishlist ? "fill-[#C95745] text-[#C95745]" : ""}`} />
      </button>

      {/* Clean Info Area */}
      <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between">
        <div>
          <Link href={productHref} className="block">
            <h3 className="font-serif text-lg sm:text-xl font-normal text-[#101B38] group-hover:text-[#C95745] transition-colors duration-200 line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="font-sans text-[11px] font-medium text-[#333333]/70 tracking-wider uppercase mt-1 line-clamp-1">
            {collectionName.endsWith("Collection") ? collectionName : `${collectionName} Collection`}
          </p>
        </div>
      </div>
    </div>
  );
}
