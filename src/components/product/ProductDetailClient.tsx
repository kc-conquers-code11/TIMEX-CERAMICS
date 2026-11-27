"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlist } from "@/store/useWishlist";
import { useEnquiryCart } from "@/store/useEnquiryCart";
import { createInquiry } from "@/actions/inquiry";
import {
  filterNameInput,
  validateName,
  filterPhoneInput,
  validatePhone,
  validateEmail,
  sanitizeText,
  getNameError,
  getPhoneError,
  getEmailError,
} from "@/lib/validation";
import { 
  Heart, 
  Download, 
  Sparkles, 
  Layers, 
  Globe, 
  Palette, 
  Search, 
  ZoomIn, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  MessageSquare, 
  FileText, 
  Check, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  Headset, 
  Award, 
  UserCheck, 
  Armchair, 
  Bath, 
  UtensilsCrossed, 
  Bed, 
  Building2, 
  Hotel, 
  ShoppingBag, 
  Briefcase,
  ChevronDown,
  Info,
  Utensils,
  Sun,
  TreePine,
  Waves,
  Car,
  Coffee
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { resolveProductImage } from "@/utils/productImages";
import { isValidSpec } from "@/utils/productSpecs";
import { resolveProductCollection, getCleanCollectionName } from "@/utils/productCollection";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl, getYouTubeEmbedUrl } from "@/utils/youtube";
import { TileOfSpainBadge } from "./TileOfSpainBadge";

export type GalleryItem =
  | {
      type: "image";
      id: string;
      url: string;
      originalIndex: number;
    }
  | {
      type: "video";
      id: string;
      videoId: string;
      thumbnail: string;
      embedUrl: string;
    };

interface SpaceMetadata {
  id: string;
  name: string;
  slug: string;
  url: string;
  icon: any;
  defaultImage: string;
  matchers: string[];
}

export const SPACE_METADATA_CATALOG: SpaceMetadata[] = [
  {
    id: "space-bathroom",
    name: "Bathroom Tiles",
    slug: "bathroom-tiles",
    url: "/bathroom-tiles",
    icon: Bath,
    defaultImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    matchers: ["bathroom", "bath room", "restroom", "powder room", "washroom", "wet area"],
  },
  {
    id: "space-kitchen",
    name: "Kitchen Tiles",
    slug: "kitchen-tiles",
    url: "/kitchen-tiles",
    icon: UtensilsCrossed,
    defaultImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    matchers: ["kitchen", "backsplash", "pantry", "cooking"],
  },
  {
    id: "space-living-dining-room",
    name: "Living & Dining Room Tiles",
    slug: "living-dining-room-tiles",
    url: "/living-dining-room-tiles",
    icon: Armchair,
    defaultImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
    matchers: [
      "living & dining room",
      "living and dining room",
      "living & dining",
      "living and dining",
      "living room",
      "dining room",
      "livingroom",
      "living",
      "dining",
      "lounge",
      "drawing room",
      "dining hall",
    ],
  },
  {
    id: "space-bedroom",
    name: "Bedroom Tiles",
    slug: "bedroom-tiles",
    url: "/bedroom-tiles",
    icon: Bed,
    defaultImage: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80",
    matchers: ["bedroom", "bed room", "bed-room", "master bed", "guest room"],
  },
  {
    id: "space-balcony-terrace",
    name: "Balcony & Terrace Tiles",
    slug: "balcony-terrace-tiles",
    url: "/balcony-terrace-tiles",
    icon: Sun,
    defaultImage: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    matchers: [
      "balcony & terrace",
      "balcony and terrace",
      "balcony/terrace",
      "balcony-terrace",
      "balcony / terrace",
      "balcony",
      "terrace",
    ],
  },
  {
    id: "space-elevation-exterior",
    name: "Elevation & Exterior Tiles",
    slug: "elevation-exterior-tiles",
    url: "/elevation-exterior-tiles",
    icon: Building2,
    defaultImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    matchers: [
      "elevation & exterior",
      "elevation and exterior",
      "elevation",
      "exterior",
      "facade",
      "exterior wall",
      "cladding",
      "front elevation",
      "featured wall",
      "feature wall",
    ],
  },
  {
    id: "space-hotel-hospitality",
    name: "Hotel & Hospitality Tiles",
    slug: "hotel-hospitality-tiles",
    url: "/hotel-hospitality-tiles",
    icon: Hotel,
    defaultImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    matchers: [
      "hotel & hospitality",
      "hotel and hospitality",
      "hotel",
      "resort",
      "hotel lobby",
      "hospitality",
    ],
  },
  {
    id: "space-cafe-restaurant",
    name: "Café & Restaurant Tiles",
    slug: "cafe-restaurant-tiles",
    url: "/cafe-restaurant-tiles",
    icon: Coffee,
    defaultImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    matchers: [
      "café & restaurant",
      "cafe & restaurant",
      "cafe and restaurant",
      "restaurant",
      "café",
      "cafe",
      "bistro",
      "coffee shop",
      "coffee bar",
      "dining venue",
      "banquet hall",
    ],
  },
  {
    id: "space-commercial-office",
    name: "Commercial & Office Tiles",
    slug: "commercial-office-tiles",
    url: "/commercial-office-tiles",
    icon: Briefcase,
    defaultImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    matchers: [
      "commercial & office",
      "commercial and office",
      "commercial",
      "office",
      "corporate",
      "workspace",
      "boardroom",
      "heavy duty",
      "high traffic",
      "mall",
      "public area",
    ],
  },
  {
    id: "space-spa-wellness",
    name: "Spa & Wellness Tiles",
    slug: "spa-wellness-tiles",
    url: "/spa-wellness-tiles",
    icon: Sparkles,
    defaultImage: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    matchers: [
      "spa & wellness",
      "spa and wellness",
      "spa/wellness",
      "spa-wellness",
      "spa",
      "wellness",
      "steam room",
      "sauna",
    ],
  },
  {
    id: "space-swimming-pool",
    name: "Swimming Pool Tiles",
    slug: "swimming-pool-tiles",
    url: "/swimming-pool-tiles",
    icon: Waves,
    defaultImage: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=1200&q=80",
    matchers: ["swimming pool", "swimming-pool", "pool deck", "poolside", "pool"],
  },
  {
    id: "space-outdoor-landscape",
    name: "Outdoor & Landscape Tiles",
    slug: "outdoor-landscape-tiles",
    url: "/outdoor-landscape-tiles",
    icon: TreePine,
    defaultImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    matchers: [
      "outdoor & landscape",
      "outdoor and landscape",
      "outdoor",
      "landscape",
      "parking",
      "driveway",
      "garage",
      "paver",
      "pavers",
      "patio",
      "courtyard",
      "veranda",
      "walkway",
      "garden walkway",
    ],
  },
];

export function findMatchingSpaceCatalog(input: string): SpaceMetadata | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  const cleanNoTiles = clean.replace(/\s*tiles?\s*$/i, "").trim();

  // 1. Direct name match or direct slug match
  const direct = SPACE_METADATA_CATALOG.find(
    (item) => item.name.toLowerCase() === clean || item.slug === clean
  );
  if (direct) return direct;

  // 2. Direct name without "tiles"
  const directNoTiles = SPACE_METADATA_CATALOG.find(
    (item) => item.name.toLowerCase().replace(/\s*tiles?\s*$/i, "").trim() === cleanNoTiles
  );
  if (directNoTiles) return directNoTiles;

  // 3. Matchers check
  for (const item of SPACE_METADATA_CATALOG) {
    for (const m of item.matchers) {
      if (clean === m || cleanNoTiles === m || clean.includes(m)) {
        return item;
      }
    }
  }

  return null;
}

interface ProductDetailClientProps {
  product: any;
  relatedProducts: any[];
}

export function ProductDetailClient({ product: initialProduct, relatedProducts: initialRelated }: ProductDetailClientProps) {
  const [product, setProduct] = useState(initialProduct);
  const [relatedProducts, setRelatedProducts] = useState(initialRelated);
  const [spacesMap, setSpacesMap] = useState<Record<string, { image: string; name: string }>>({});

  // Live Database Rehydration: ensures any edit in /admin appears immediately on the public website
  useEffect(() => {
    const identifier = initialProduct?.slug || initialProduct?.id || initialProduct?.code;
    if (!identifier) return;

    const refreshProduct = () => {
      fetch(`/api/v1/products/${identifier}?_t=` + Date.now())
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.product) {
            setProduct(data.product);
          }
        })
        .catch(() => {});

      fetch(`/api/v1/products?_t=` + Date.now())
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.products)) {
            const currentId = initialProduct?.id;
            const catId = initialProduct?.categoryId || initialProduct?.category_id;
            const collId = initialProduct?.collectionId;
            const catName = initialProduct?.category;
            let rel = data.products
              .filter(
                (p: any) =>
                  p.id !== currentId &&
                  (p.categoryId === catId ||
                    p.category_id === catId ||
                    p.collectionId === collId ||
                    p.category === catName)
              )
              .slice(0, 10);
            if (rel.length === 0) {
              rel = data.products.filter((p: any) => p.id !== currentId).slice(0, 8);
            }
            if (rel.length > 0) {
              setRelatedProducts(rel);
            }
          }
        })
        .catch(() => {});
    };

    refreshProduct();

    const handleCustomUpdate = (e: any) => {
      const updatedSlug = e?.detail?.slug || e?.detail?.product?.slug || e?.detail?.id;
      if (!updatedSlug || updatedSlug === identifier || updatedSlug === product?.slug || updatedSlug === product?.id) {
        refreshProduct();
      }
    };

    window.addEventListener("product-updated" as any, handleCustomUpdate);
    window.addEventListener("storage", refreshProduct);

    return () => {
      window.removeEventListener("product-updated" as any, handleCustomUpdate);
      window.removeEventListener("storage", refreshProduct);
    };
  }, [initialProduct?.slug, initialProduct?.id, initialProduct?.code, product?.slug, product?.id]);

  // Sync latest space hero images from Admin Spaces API
  useEffect(() => {
    fetch(`/api/v1/spaces?_t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load spaces");
        return res.json();
      })
      .then((data) => {
        if (data.spaces && Array.isArray(data.spaces) && data.spaces.length > 0) {
          const map: Record<string, { image: string; name: string }> = {};
          for (const sp of data.spaces) {
            if (sp.slug) {
              map[sp.slug] = { image: sp.image, name: sp.name };
            }
          }
          setSpacesMap(map);
        }
      })
      .catch(() => {});
  }, []);

  // Dynamically update document title & meta description if updated in /admin
  useEffect(() => {
    if (product?.meta_title || product?.metaTitle || product?.name) {
      document.title = product.meta_title || product.metaTitle || `${product.name} | Timex Ceramic`;
    }
    if (product?.meta_description || product?.metaDescription || product?.description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", product.meta_description || product.metaDescription || product.description);
      }
    }
  }, [product?.meta_title, product?.metaTitle, product?.name, product?.meta_description, product?.metaDescription, product?.description]);

  // Gallery states
  const productImages = useMemo(() => {
    return (product.images && product.images.length > 0)
      ? product.images.map((img: string, idx: number) => resolveProductImage(img, product.categoryId, idx))
      : [resolveProductImage("", product.categoryId, 0)];
  }, [product.images, product.categoryId]);

  const youtubeVideoId = useMemo(() => {
    const isEnabled = Boolean(product?.videoEnabled !== undefined ? product.videoEnabled : product?.video_enabled);
    const url = product?.videoUrl || product?.video_url;
    if (!isEnabled || !url) return null;
    return extractYouTubeVideoId(url);
  }, [product?.videoEnabled, product?.video_enabled, product?.videoUrl, product?.video_url]);

  const galleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = productImages.map((img: string, idx: number) => ({
      type: "image",
      id: `img-${idx}-${img}`,
      url: img,
      originalIndex: idx,
    }));

    if (youtubeVideoId) {
      const rawPos = product?.videoPosition !== undefined ? product.videoPosition : product?.video_position;
      const targetPos = Math.max(1, parseInt(String(rawPos), 10) || 1);
      const insertIndex = Math.min(Math.max(0, targetPos - 1), items.length);

      const videoItem: GalleryItem = {
        type: "video",
        id: `video-${youtubeVideoId}`,
        videoId: youtubeVideoId,
        thumbnail: getYouTubeThumbnailUrl(youtubeVideoId),
        embedUrl: getYouTubeEmbedUrl(youtubeVideoId, true),
      };

      items.splice(insertIndex, 0, videoItem);
    }

    return items;
  }, [productImages, youtubeVideoId, product?.videoPosition, product?.video_position]);

  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [activeImg, setActiveImg] = useState(productImages[0] || "");
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const carouselScrollRef = useRef<HTMLDivElement>(null);

  const activeItem: GalleryItem = galleryItems[activeItemIndex] || galleryItems[0] || {
    type: "image",
    id: "default",
    url: productImages[0] || "",
    originalIndex: 0,
  };

  // Synchronize activeImg whenever activeItem changes to an image
  useEffect(() => {
    if (activeItem && activeItem.type === "image") {
      setActiveImg(activeItem.url);
    }
  }, [activeItem]);

  // Synchronize activeItemIndex if galleryItems length changes
  useEffect(() => {
    if (activeItemIndex >= galleryItems.length) {
      setActiveItemIndex(0);
    }
  }, [galleryItems.length, activeItemIndex]);

  // Synchronize activeImg if product images update from live rehydration
  useEffect(() => {
    if (product.images && product.images.length > 0) {
      const first = resolveProductImage(product.images[0], product.categoryId, 0);
      if (activeItem && activeItem.type === "image") {
        setActiveImg(activeItem.url);
      } else {
        setActiveImg(first);
      }
    }
  }, [product.images, activeItem]);

  // Size selection - strictly sourced from product.availableSizes saved in Admin
  const rawSizes = Array.isArray(product.availableSizes) ? product.availableSizes : [];
  const availableSizes = rawSizes.filter((s: string) => isValidSpec(s));

  // Colour selection - strictly sourced from product.availableColors saved in Admin
  const availableColors = useMemo(() => {
    if (!Array.isArray(product?.availableColors)) return [];
    return product.availableColors
      .map((c: any) => String(c).trim())
      .filter((c: string) => isValidSpec(c));
  }, [product?.availableColors]);

  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const appliedUrlColorRef = useRef<string>("");

  // Sync selectedSize from URL param or default to first available
  useEffect(() => {
    const urlSize = searchParams?.get("size");
    if (availableSizes.length > 0) {
      const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
      const matchedUrlSize = urlSize
        ? availableSizes.find((s: string) => norm(s) === norm(urlSize))
        : null;

      if (matchedUrlSize) {
        setSelectedSize(matchedUrlSize);
      } else if (!selectedSize || !availableSizes.includes(selectedSize)) {
        setSelectedSize(availableSizes[0]);
      }
    } else {
      setSelectedSize("");
    }
  }, [availableSizes, searchParams]);

  // Sync selectedColor from URL param or default to image/first available
  useEffect(() => {
    const urlColor = searchParams?.get("color");
    if (availableColors.length > 0) {
      const norm = (c: string) => c.replace(/\s+/g, "").toLowerCase();
      const matchedUrlColor = urlColor
        ? availableColors.find((c: string) => norm(c) === norm(urlColor))
        : null;

      if (matchedUrlColor) {
        setSelectedColor(matchedUrlColor);
      } else if (!selectedColor || !availableColors.includes(selectedColor)) {
        const matched = findColorForImage(activeImg, product);
        if (matched && availableColors.includes(matched)) {
          setSelectedColor(matched);
        } else {
          setSelectedColor(availableColors[0]);
        }
      }
    } else {
      setSelectedColor("");
    }
  }, [availableColors, product, searchParams]);

  // Helper to find exact photo mapped for a (size, colour) combination
  const findCombinationImage = (sizeVal?: string, colorVal?: string): string | null => {
    if (!product) return null;
    const s = sizeVal !== undefined ? sizeVal : selectedSize;
    const c = colorVal !== undefined ? colorVal : selectedColor;
    if (!s || !c) return null;

    const norm = (str?: string) => (str || "").replace(/\s+/g, "").toLowerCase().trim();
    const targetS = norm(s);
    const targetC = norm(c);

    // 1. Check array mappings (combinationProductMappings or combination_product_mappings)
    const mappings = (product.combinationProductMappings || product.combination_product_mappings) as Array<{
      size: string;
      color: string;
      image?: string;
      imageUrl?: string;
      assignedProductImage?: string;
    }> | undefined;

    if (Array.isArray(mappings)) {
      const match = mappings.find(
        (m) =>
          m &&
          m.size &&
          m.color &&
          norm(m.size) === targetS &&
          norm(m.color) === targetC &&
          (m.image || m.imageUrl || m.assignedProductImage)
      );
      if (match) {
        return (match.image || match.imageUrl || match.assignedProductImage || "").trim() || null;
      }
    }

    // 2. Check combinationImages dictionary (normalized or direct key)
    if (product.combinationImages && typeof product.combinationImages === "object") {
      const comboDict = product.combinationImages as Record<string, string>;
      const directKey = `${s}_${c}`;
      if (comboDict[directKey]) {
        return String(comboDict[directKey]);
      }
      for (const [k, imgUrl] of Object.entries(comboDict)) {
        const parts = k.split("_");
        if (parts.length >= 2) {
          const kSize = norm(parts.slice(0, parts.length - 1).join("_"));
          const kColor = norm(parts[parts.length - 1]);
          if (kSize === targetS && kColor === targetC && imgUrl) {
            return String(imgUrl);
          }
        }
      }
    }

    return null;
  };

  const resolveActiveProductImage = (size?: string, color?: string) => {
    const s = size !== undefined ? size : selectedSize;
    const c = color !== undefined ? color : selectedColor;

    // 1. Combination image mapping (highest priority for size + colour combination)
    const comboImg = findCombinationImage(s, c);
    if (comboImg) {
      return resolveProductImage(comboImg, product.categoryId, 0);
    }

    // 2. Color image fallback
    if (c && product.colorImages && product.colorImages[c]) {
      const colVal = product.colorImages[c];
      const targetImg = Array.isArray(colVal)
        ? colVal.find((x: any) => typeof x === "string" && x.trim())
        : colVal;
      if (targetImg) return resolveProductImage(targetImg, product.categoryId, 0);
    }
    if (c && Array.isArray(product.images)) {
      const match = product.images.find((img: string) => img.toLowerCase().includes(c.toLowerCase()));
      if (match) return resolveProductImage(match, product.categoryId, 0);
    }

    // 3. Size image fallback
    if (s && product.sizeImages && product.sizeImages[s]) {
      return resolveProductImage(product.sizeImages[s], product.categoryId, 0);
    }

    // 4. Default primary gallery image
    return productImages[0] || resolveProductImage("", product.categoryId, 0);
  };

  // Synchronize activeImg whenever selectedSize/selectedColor or URL ?color= param applies
  useEffect(() => {
    const urlColor = searchParams?.get("color");
    if (urlColor && selectedColor) {
      const urlKey = `${product?.id || product?.slug}:${selectedColor.toLowerCase()}:${productImages.length}`;
      if (appliedUrlColorRef.current !== urlKey) {
        const norm = (c: string) => c.replace(/\s+/g, "").toLowerCase();
        if (norm(urlColor) === norm(selectedColor)) {
          const target = resolveActiveProductImage(selectedSize, selectedColor);
          if (target) {
            setActiveImg(target);
            const targetIdx = galleryItems.findIndex((it) => it.type === "image" && it.url === target);
            if (targetIdx !== -1) {
              setActiveItemIndex(targetIdx);
            }
          }
          appliedUrlColorRef.current = urlKey;
          return;
        }
      }
    }

    if (selectedSize && selectedColor) {
      const comboImg = findCombinationImage(selectedSize, selectedColor);
      if (comboImg) {
        const resolved = resolveProductImage(comboImg, product.categoryId, 0);
        if (resolved) {
          setActiveImg(resolved);
          const targetIdx = galleryItems.findIndex((it) => it.type === "image" && it.url === resolved);
          if (targetIdx !== -1) {
            setActiveItemIndex(targetIdx);
          }
        }
      }
    }
  }, [selectedSize, selectedColor, product, searchParams, galleryItems, productImages.length]);

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    const target = resolveActiveProductImage(selectedSize, color);
    if (target) {
      setActiveImg(target);
      const targetIdx = galleryItems.findIndex((it) => it.type === "image" && it.url === target);
      if (targetIdx !== -1) {
        setActiveItemIndex(targetIdx);
      }
      setIsPlayingVideo(false);
    }
  };

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const target = resolveActiveProductImage(size, selectedColor);
    if (target) {
      setActiveImg(target);
      const targetIdx = galleryItems.findIndex((it) => it.type === "image" && it.url === target);
      if (targetIdx !== -1) {
        setActiveItemIndex(targetIdx);
      }
      setIsPlayingVideo(false);
    }
  };

  // Helper to find associated color from an image URL strictly matching saved availableColors
  const findColorForImage = (imgUrl: string, prod: any): string | null => {
    if (!imgUrl || !prod || !Array.isArray(prod.availableColors)) return null;
    const colors: string[] = Array.from(
      new Set(prod.availableColors.filter((c: any) => isValidSpec(c)).map((c: any) => String(c).trim()))
    );
    if (colors.length === 0) return null;

    // 1. Direct check in colorImages for valid colors in availableColors
    if (prod.colorImages && typeof prod.colorImages === "object") {
      for (const color of colors) {
        const mapped = prod.colorImages[color];
        const mappedList: string[] = Array.isArray(mapped)
          ? mapped.filter((x: any): x is string => typeof x === "string" && Boolean(x.trim()))
          : (typeof mapped === "string" && mapped.trim() ? [mapped.trim()] : []);
        for (const singleMapped of mappedList) {
          const resolved = resolveProductImage(singleMapped, prod.categoryId, 0);
          if (singleMapped === imgUrl || resolved === imgUrl || imgUrl.includes(singleMapped) || singleMapped.includes(imgUrl)) {
            return color;
          }
        }
      }
    }

    // 2. Direct match with product.images mapping
    for (const color of colors) {
      const cLower = color.toLowerCase();
      const mappedImg = prod.images?.find((m: string) => m.toLowerCase().includes(cLower));
      if (mappedImg) {
        const resolved = resolveProductImage(mappedImg, prod.categoryId, 0);
        if (mappedImg === imgUrl || resolved === imgUrl || imgUrl.includes(mappedImg)) {
          return color;
        }
      }
    }

    // 3. Check filename for color match
    const filename = (imgUrl.split("/").pop() || imgUrl).toLowerCase();

    for (const color of colors) {
      const cLower = color.toLowerCase();
      if (
        filename.includes(cLower) ||
        filename.includes(cLower.replace(/\s*\/\s*/g, "-")) ||
        filename.includes(cLower.replace(/\s*\/\s*/g, "_"))
      ) {
        return color;
      }
    }

    // Try sub-parts if color has multi-words or slashes (e.g. 'Brown / Beige')
    for (const color of colors) {
      const parts = color.toLowerCase().split(/[/,]+/).map((s) => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        const allMatch = parts.every((part) => filename.includes(part));
        if (allMatch) return color;
      }
    }

    // Fallback to single part match
    for (const color of colors) {
      const parts = color.toLowerCase().split(/[/,]+/).map((s) => s.trim()).filter((p) => p.length >= 3);
      for (const part of parts) {
        const regex = new RegExp(`(^|[-_/ ])${part}([-._/ ]|$)`, "i");
        if (regex.test(filename)) {
          return color;
        }
      }
    }

    return null;
  };

  const handleThumbnailClick = (item: GalleryItem, idx: number) => {
    if (item.type === "video") {
      setActiveItemIndex(idx);
      setIsPlayingVideo(true);
    } else {
      if (activeItemIndex === idx && activeItem.type === "image") {
        setZoomModalOpen(true);
      } else {
        setActiveItemIndex(idx);
        setActiveImg(item.url);
        setIsPlayingVideo(false);
        const matchedColor = findColorForImage(item.url, product);
        if (matchedColor) {
          setSelectedColor(matchedColor);
        }
      }
    }
  };

  // Synchronize selectedColor whenever activeImg changes (clicking thumbnail, arrow nav, or initial load)
  useEffect(() => {
    if (activeImg) {
      const matched = findColorForImage(activeImg, product);
      if (matched && matched.toLowerCase() !== selectedColor.toLowerCase()) {
        setSelectedColor(matched);
      }
    }
  }, [activeImg, product]);

  const currentImgIndex = activeItemIndex;

  const handlePrevModalImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryItems.length <= 1) return;
    const newIndex = (activeItemIndex - 1 + galleryItems.length) % galleryItems.length;
    setActiveItemIndex(newIndex);
    if (galleryItems[newIndex].type === "image") {
      setActiveImg(galleryItems[newIndex].url);
      setIsPlayingVideo(false);
    } else {
      setIsPlayingVideo(true);
    }
  };

  const handleNextModalImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryItems.length <= 1) return;
    const newIndex = (activeItemIndex + 1) % galleryItems.length;
    setActiveItemIndex(newIndex);
    if (galleryItems[newIndex].type === "image") {
      setActiveImg(galleryItems[newIndex].url);
      setIsPlayingVideo(false);
    } else {
      setIsPlayingVideo(true);
    }
  };

  // Keyboard navigation & body scroll lock for lightbox modal
  useEffect(() => {
    if (!zoomModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setZoomModalOpen(false);
      } else if (e.key === "ArrowLeft") {
        if (galleryItems.length > 1) {
          const newIndex = (activeItemIndex - 1 + galleryItems.length) % galleryItems.length;
          setActiveItemIndex(newIndex);
          if (galleryItems[newIndex].type === "image") {
            setActiveImg(galleryItems[newIndex].url);
            setIsPlayingVideo(false);
          } else {
            setIsPlayingVideo(true);
          }
        }
      } else if (e.key === "ArrowRight") {
        if (galleryItems.length > 1) {
          const newIndex = (activeItemIndex + 1) % galleryItems.length;
          setActiveItemIndex(newIndex);
          if (galleryItems[newIndex].type === "image") {
            setActiveImg(galleryItems[newIndex].url);
            setIsPlayingVideo(false);
          } else {
            setIsPlayingVideo(true);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = origOverflow;
    };
  }, [zoomModalOpen, activeItemIndex, galleryItems]);

  // Tab state: strictly Description & Specifications
  const [activeTab, setActiveTab] = useState<"description" | "specifications">("specifications");

  // Inquiry / Quote / Sample modal states
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState<"quote" | "sample">("quote");
  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState("");
  const [formFieldErrors, setFormFieldErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", company: "", message: "" });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const wishlist = useWishlist();
  const inWishlist = mounted ? wishlist.hasItem(product.id, product.slug) : false;

  // Enquiry Cart Hooks & States
  const { addItem, openDrawer, getTotalItems } = useEnquiryCart();
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [addedToast, setAddedToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const handleAddToEnquiry = () => {
    const result = addItem({
      productId: product.id,
      name: product.name,
      code: product.code || product.sku || "TMX-TILE",
      slug: product.slug || "",
      size: selectedSize,
      finish: (product.finish?.trim().toLowerCase() === "matte" ? "Matt" : product.finish) || "Glossy",
      image: activeImg || productImages[0] || "",
      price: product.price || 0,
      category: product.category || product.category_name || "",
    }, 1);

    setAddedAnimation(true);
    setAddedToast({
      message: result.wasDuplicate
        ? `Updated quantity (${result.totalQty} boxes) in Enquiry List!`
        : `Added "${product.name}" (${selectedSize}) to Enquiry!`,
      visible: true,
    });

    setTimeout(() => {
      setAddedAnimation(false);
    }, 1800);

    setTimeout(() => {
      setAddedToast((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  // Thumbnail horizontal scroll controls
  const scrollThumbnails = (direction: "left" | "right") => {
    if (!thumbnailScrollRef.current) return;
    const scrollAmount = direction === "left" ? -180 : 180;
    thumbnailScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Related products carousel controls
  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselScrollRef.current) return;
    const scrollAmount = direction === "left" ? -320 : 320;
    carouselScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Form submit handler
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formLoading) return;

    // Honeypot check - silent success for bots
    if (honeypot) {
      setFormSuccess(true);
      setTimeout(() => {
        setFormSuccess(false);
        setInquiryModalOpen(false);
      }, 2000);
      return;
    }

    const nameErr = getNameError(formData.name);
    const phoneErr = getPhoneError(formData.phone);
    const emailErr = getEmailError(formData.email, true);

    if (nameErr || phoneErr || emailErr) {
      setFormFieldErrors({
        name: nameErr || "",
        phone: phoneErr || "",
        email: emailErr || "",
      });
      setFormError(nameErr || phoneErr || emailErr || "Please fill in all required fields accurately.");
      return;
    }

    setFormFieldErrors({});
    setFormLoading(true);
    setFormSuccess(false);
    setFormError("");

    const res = await createInquiry({
      type: inquiryType === "sample" ? "SAMPLE" : "GENERAL",
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      company: sanitizeText(formData.company.trim()),
      message: sanitizeText(formData.message.trim()) || `${inquiryType === "sample" ? "Sample Request" : "Price Quote"} for ${product.name}, Size: ${selectedSize}`,
      pageSource: `Product Detail: ${product.name}`,
      honeypot_field: honeypot,
      details: {
        productId: product.id,
        productName: product.name,
        productCode: product.code || "",
        size: selectedSize,
        finish: product.finish || "",
        slug: product.slug,
        productUrl: typeof window !== "undefined" ? window.location.href : `https://www.timexceramic.com/product/${product.slug}`,
      },
    });

    setFormLoading(false);
    if (res.success) {
      setFormSuccess(true);
      setFormData({ name: "", email: "", phone: "", company: "", message: "" });
      setHoneypot("");
      setTimeout(() => {
        setFormSuccess(false);
        setInquiryModalOpen(false);
      }, 2500);
    } else {
      setFormError(res.error || "Submission failed. Please check your information.");
    }
  };

  // WhatsApp click handler
  const handleWhatsApp = () => {
    window.open("https://api.whatsapp.com/send/?phone=919323777787&text=Hello%21+I+found+Timex+Ceramic+through+your+website+and+I%27m+interested+in+your+premium+tile+collection.+Please+share+your+latest+catalogue%2C+pricing%2C+available+sizes%2C+finishes%2C+and+help+me+choose+the+right+tiles+for+my+project.+I+would+also+like+to+know+about+product+availability+and+delivery+timelines.&type=phone_number&app_absent=0", "_blank");
  };

  // Dynamic Application cards: strictly sourced from spaces assigned to this specific product in Admin
  const selectedApplicationCards = useMemo(() => {
    let rawAssigned: string[] = [];

    if (Array.isArray(product?.spaces)) {
      rawAssigned = product.spaces
        .map((s: any) => String(s || "").trim())
        .filter((s: string) => isValidSpec(s));
    } else if (typeof product?.spaces === "string" && product.spaces.trim()) {
      rawAssigned = product.spaces
        .split(/[,;\n]+/)
        .map((s: string) => s.trim())
        .filter((s: string) => isValidSpec(s));
    } else {
      // Fallback only if product.spaces was undefined/null
      const fallbackStr = product?.tilesBySpace || product?.tiles_by_space || product?.spaceArea || product?.space_area;
      if (typeof fallbackStr === "string" && fallbackStr.trim()) {
        rawAssigned = fallbackStr
          .split(/[,;\n]+/)
          .map((s: string) => s.trim())
          .filter((s: string) => isValidSpec(s));
      }
    }

    if (rawAssigned.length === 0) {
      return [];
    }

    const seenSlugs = new Set<string>();
    const cards: Array<{
      id: string;
      name: string;
      slug: string;
      url: string;
      icon: any;
      image: string;
    }> = [];

    for (const assigned of rawAssigned) {
      const match = findMatchingSpaceCatalog(assigned);
      if (match) {
        if (!seenSlugs.has(match.slug)) {
          seenSlugs.add(match.slug);
          cards.push({
            id: match.id,
            name: match.name,
            slug: match.slug,
            url: match.url,
            icon: match.icon,
            image: spacesMap[match.slug]?.image || match.defaultImage,
          });
        }
      } else {
        // Unknown or custom space added in Admin
        const slug = assigned.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        if (slug && !seenSlugs.has(slug)) {
          seenSlugs.add(slug);
          cards.push({
            id: `space-${slug}`,
            name: assigned,
            slug: slug,
            url: `/${slug}`,
            icon: Layers,
            image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
          });
        }
      }
    }

    return cards;
  }, [product?.spaces, product?.tilesBySpace, product?.tiles_by_space, product?.spaceArea, product?.space_area, spacesMap]);

  // Why Choose Us features
  const whyChooseFeatures = [
    { title: "Imported Premium Collections", icon: Award },
    { title: "Global Quality Standards", icon: ShieldCheck },
    { title: "Expert Guidance & Support", icon: Headset },
    { title: "Timely Delivery Pan India", icon: Truck },
    { title: "Trusted by Professionals", icon: UserCheck },
  ];

  const isHarlem = product.slug === "harlem-series" || product.id === "prod-brick-1";

  // Dynamic catalogue URL resolution
  const rawCatalogue = product.catalogueUrl || product.catalogue_url || product.catalogue || product.productPdf;
  const hasCatalogue = Boolean(
    rawCatalogue &&
    typeof rawCatalogue === "string" &&
    rawCatalogue.trim() !== "" &&
    rawCatalogue.toLowerCase() !== "no catalogue" &&
    rawCatalogue.toLowerCase() !== "none"
  );
  let catalogueUrl = "";
  if (hasCatalogue) {
    const trimmed = rawCatalogue.trim();
    if (trimmed.startsWith("/catalogue/")) {
      catalogueUrl = trimmed;
    } else if (trimmed.startsWith("/uploads/catalogues/") || trimmed.startsWith("/catalogues/")) {
      const fn = trimmed.split("/").pop()?.toLowerCase();
      catalogueUrl = fn ? `/catalogue/${fn}` : trimmed;
    } else if (trimmed.toLowerCase().endsWith(".pdf")) {
      const fn = trimmed.split("/").pop()?.toLowerCase();
      catalogueUrl = fn ? `/catalogue/${fn}` : trimmed;
    } else {
      catalogueUrl = trimmed;
    }
  }

  const collectionInfo = resolveProductCollection(product);

  // Dynamic Specifications table rows strictly filtering out invalid/unspecified values
  const allSpecifications = [
    { label: "Product Name", value: product.name },
    { label: "Collection", value: collectionInfo.name },
    {
      label: "Tiles by Space / Area",
      value: selectedApplicationCards.length > 0 ? selectedApplicationCards.map((c) => c.name).join(", ") : "",
    },
    { label: "Primary Dimension", value: selectedSize || product.size },
    {
      label: "Tiles By Size",
      value:
        product.tilesBySize ||
        product.tiles_by_size ||
        (Array.isArray(product.tilesBySizeList) ? product.tilesBySizeList.join(", ") : ""),
    },
    { label: "Thickness", value: product.thickness },
    { label: "Surface Finish", value: product.finish?.trim().toLowerCase() === "matte" ? "Matt" : product.finish },
    { label: "Body Material", value: product.material },
    { label: "Origin / Provenance", value: product.origin },
    { label: "Tiles by Shape", value: product.tilesByShape || product.shape || (Array.isArray(product.shapes) ? product.shapes.join(", ") : "") },
    { label: "Recommended Uses", value: product.usage || product.application },
    { label: "Kg. per box", value: product.kgPerBox ? `${product.kgPerBox}` : (product.weight ? `${product.weight}` : "") },
    { label: "Pcs per box", value: product.pcsPerBox ? `${product.pcsPerBox}` : (product.packingDetails ? `${product.packingDetails}` : "") },
    { label: "Sft/Box", value: product.sftPerBox ? `${product.sftPerBox}` : (product.sft_per_box ? `${product.sft_per_box}` : "") },
  ];

  const specificationsData = allSpecifications.filter((item) => isValidSpec(item.value));

  // FAQs
  const faqs = [
    {
      q: "What is the recommended grout joint spacing for this tile?",
      a: "For rectified porcelain slabs like this, we recommend a minimum grout joint spacing of 2.0 mm using epoxy joint filler to accommodate structural micro-movements while preserving a continuous stone aesthetic.",
    },
    {
      q: "Can this porcelain tile be used for high-traffic commercial flooring?",
      a: "Yes. Engineered with a PEI Group IV rating and high breaking strength (> 1300 N), this tile is certified for luxury residential spaces, airport lounges, hotel lobbies, and heavy-footfall retail stores.",
    },
    {
      q: "Is this surface resistant to food stains and chemical cleaners?",
      a: "Absolutely. With ultra-low water absorption (< 0.5%) and vitrified glaze sealing, the surface prevents absorption of oil, wine, acids, and domestic cleaning agents.",
    },
    {
      q: "How can I request physical sample swatches for my project?",
      a: "Click on 'Request Sample' above or connect with our architectural concierge team. We provide mounted tile sample swatches for architects and project specifiers nationwide.",
    },
  ];
  return (
    <div className="w-full bg-[#F7F5F0] pb-20 relative overflow-hidden">
      {/* 1. BREADCRUMB NAVIGATION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-6 relative z-10">
        <nav aria-label="Breadcrumb" className="text-xs text-[#555555] flex flex-wrap items-center gap-2 font-normal">
          <Link href="/" className="hover:text-[#C95745] text-[#333333] transition-colors">
            Home
          </Link>
          <span className="text-[#999999] select-none">&gt;</span>
          <Link href="/products" className="hover:text-[#C95745] text-[#333333] transition-colors">
            Products
          </Link>
          <span className="text-[#999999] select-none">&gt;</span>
          <Link href={collectionInfo.url} className="hover:text-[#C95745] text-[#333333] transition-colors">
            {collectionInfo.name}
          </Link>
          <span className="text-[#999999] select-none">&gt;</span>
          <span className="text-[#101B38] font-semibold">{product.name}</span>
        </nav>
      </div>

      {/* 2. TOP PRODUCT SECTION: 2-COLUMN GRID (Photo on Left, Info on Right) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 relative z-10">
        
        {/* Left Column: Gallery & Thumbnails (span 6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Gallery Item Container */}
          {activeItem.type === "video" ? (
            isPlayingVideo ? (
              <div className="relative aspect-[4/3] w-full rounded-[2px] overflow-hidden border border-[#EDEAE4] bg-black shadow-xs">
                <iframe
                  src={activeItem.embedUrl}
                  title={`${product.name} Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    inWishlist ? wishlist.removeItem(product.id, product.slug) : wishlist.addItem(product.id);
                  }}
                  className="absolute top-4 right-16 z-10 w-10 h-10 rounded-[2px] bg-[#FCFBF8]/90 hover:bg-[#FCFBF8] shadow-sm flex items-center justify-center text-[#333333] hover:text-[#C95745] transition-all duration-200 cursor-pointer border border-[#EDEAE4]"
                  aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? "fill-[#C95745] text-[#C95745]" : ""}`} />
                </button>

                {/* Zoom Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomModalOpen(true);
                  }}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-[2px] bg-[#FCFBF8]/90 hover:bg-[#101B38] hover:text-[#FCFBF8] shadow-sm flex items-center justify-center text-[#101B38] transition-all duration-200 cursor-pointer border border-[#EDEAE4]"
                  aria-label="Zoom video"
                  title="Expand video view"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsPlayingVideo(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setIsPlayingVideo(true);
                  }
                }}
                title="Click to play video"
                className="relative aspect-[4/3] w-full rounded-[2px] overflow-hidden border border-[#EDEAE4] bg-black group shadow-xs cursor-pointer select-none"
              >
                <Image
                  src={activeItem.thumbnail}
                  alt={`${product.name} Video Preview`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out brightness-90 group-hover:brightness-100"
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C95745] text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-[#b04838] transition-all">
                    <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white text-white ml-1" />
                  </div>
                  <span className="mt-3 px-3.5 py-1 rounded-full bg-black/75 backdrop-blur-xs text-white text-xs font-semibold uppercase tracking-wider">
                    Watch Product Video
                  </span>
                </div>

                {/* Wishlist Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    inWishlist ? wishlist.removeItem(product.id, product.slug) : wishlist.addItem(product.id);
                  }}
                  className="absolute top-4 right-16 z-10 w-10 h-10 rounded-[2px] bg-[#FCFBF8]/90 hover:bg-[#FCFBF8] shadow-sm flex items-center justify-center text-[#333333] hover:text-[#C95745] transition-all duration-200 cursor-pointer border border-[#EDEAE4]"
                  aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                  title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
                >
                  <Heart className={`w-4 h-4 ${inWishlist ? "fill-[#C95745] text-[#C95745]" : ""}`} />
                </button>

                {/* Zoom Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomModalOpen(true);
                  }}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-[2px] bg-[#FCFBF8]/90 hover:bg-[#101B38] hover:text-[#FCFBF8] shadow-sm flex items-center justify-center text-[#101B38] transition-all duration-200 cursor-pointer border border-[#EDEAE4]"
                  aria-label="Zoom video"
                  title="Expand video view"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => setZoomModalOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setZoomModalOpen(true);
                }
              }}
              title="Click photo to expand view"
              className="relative aspect-[4/3] w-full rounded-[2px] overflow-hidden border border-[#EDEAE4] bg-[#FCFBF8] group shadow-xs cursor-zoom-in select-none"
            >
              <Image
                src={activeItem.url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className={`transition-transform duration-500 ease-out group-hover:scale-125 ${
                  activeItem.url.includes("ambience")
                    ? "object-cover object-center"
                    : "object-contain object-center p-4 sm:p-6"
                }`}
              />
              {/* Tile of Spain Badge Overlay */}
              {Boolean(product.showTileOfSpainBadge || product.show_tile_of_spain_badge) && (
                <TileOfSpainBadge size="lg" className="bottom-3.5 left-3.5 sm:bottom-4 sm:left-4" />
              )}
              {/* Wishlist Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inWishlist ? wishlist.removeItem(product.id, product.slug) : wishlist.addItem(product.id);
                }}
                className="absolute top-4 right-16 z-10 w-10 h-10 rounded-[2px] bg-[#FCFBF8]/90 hover:bg-[#FCFBF8] shadow-sm flex items-center justify-center text-[#333333] hover:text-[#C95745] transition-all duration-200 cursor-pointer border border-[#EDEAE4]"
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? "fill-[#C95745] text-[#C95745]" : ""}`} />
              </button>

              {/* Zoom Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setZoomModalOpen(true);
                }}
                className="absolute top-4 right-4 z-10 w-10 h-10 rounded-[2px] bg-[#FCFBF8]/90 hover:bg-[#101B38] hover:text-[#FCFBF8] shadow-sm flex items-center justify-center text-[#101B38] transition-all duration-200 cursor-pointer border border-[#EDEAE4]"
                aria-label="Zoom image"
                title="Click photo to expand view"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Horizontal Thumbnails Strip with Left & Right Arrow Navigation */}
          <div className="relative flex items-center">
            <button
              onClick={() => scrollThumbnails("left")}
              className="w-8 h-8 rounded-[2px] bg-[#FCFBF8] border border-[#EDEAE4] shadow-xs flex items-center justify-center text-[#101B38] hover:bg-[#101B38] hover:text-[#FCFBF8] transition-colors flex-shrink-0 mr-2 z-10 cursor-pointer"
              aria-label="Previous thumbnails"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div
              ref={thumbnailScrollRef}
              className="flex space-x-3 overflow-x-auto scrollbar-none py-1 flex-grow scroll-smooth"
            >
              {galleryItems.map((item, idx) => {
                const isSelected = activeItemIndex === idx;

                if (item.type === "video") {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleThumbnailClick(item, idx)}
                      className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-[2px] overflow-hidden flex-shrink-0 border-2 transition-all duration-200 cursor-pointer bg-black group ${
                        isSelected
                          ? "border-[#101B38] ring-1 ring-[#101B38]"
                          : "border-[#EDEAE4] hover:border-[#101B38]/40"
                      }`}
                      title="Play video"
                      aria-label="Play video"
                    >
                      <Image
                        src={item.thumbnail}
                        alt={`${product.name} video thumbnail`}
                        fill
                        sizes="96px"
                        className="object-cover brightness-90 group-hover:brightness-100"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/25 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-[#C95745] text-white flex items-center justify-center shadow-md">
                          <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute bottom-1 right-1 text-[8px] font-extrabold uppercase bg-black/80 text-white px-1 py-0.5 rounded-[1px] tracking-wider">
                        VIDEO
                      </span>
                    </button>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleThumbnailClick(item, idx)}
                    className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-[2px] overflow-hidden flex-shrink-0 border-2 transition-all duration-200 cursor-pointer bg-[#FCFBF8] ${
                      isSelected
                        ? "border-[#101B38] ring-1 ring-[#101B38]"
                        : "border-[#EDEAE4] hover:border-[#101B38]/40"
                    }`}
                  >
                    <Image
                      src={item.url}
                      alt={`${product.name} thumbnail ${item.originalIndex + 1}`}
                      fill
                      sizes="96px"
                      className={`transition-transform duration-300 group-hover:scale-110 ${
                        item.url.includes("ambience") ? "object-cover" : "object-contain p-1.5"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => scrollThumbnails("right")}
              className="w-8 h-8 rounded-[2px] bg-[#FCFBF8] border border-[#EDEAE4] shadow-xs flex items-center justify-center text-[#101B38] hover:bg-[#101B38] hover:text-[#FCFBF8] transition-colors flex-shrink-0 ml-2 z-10 cursor-pointer"
              aria-label="Next thumbnails"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Product Info, Attributes & CTAs (span 6) */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-6">

            {/* Top Badges & Product Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                {Boolean(product.isNewArrival || product.is_new_arrival) && (
                  <div className="flex items-center space-x-2.5 flex-wrap gap-y-1 mb-2.5">
                    <span className="text-[10px] font-semibold tracking-widest text-[#C95745] border border-[#C95745]/40 bg-[#C95745]/10 px-3 py-1 rounded-[2px] uppercase">
                      NEW
                    </span>
                  </div>
                )}
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#101B38] tracking-tight">
                  {product.name}
                </h1>
                <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#555555]">
                  {collectionInfo.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  inWishlist ? wishlist.removeItem(product.id, product.slug) : wishlist.addItem(product.id);
                }}
                className={`p-2.5 sm:px-4 sm:py-2.5 rounded-[2px] border transition-all cursor-pointer flex items-center space-x-2 shrink-0 ${
                  inWishlist
                    ? "bg-[#C95745]/10 border-[#C95745] text-[#C95745]"
                    : "bg-[#FCFBF8] border-[#EDEAE4] text-[#333333] hover:text-[#C95745] hover:border-[#C95745]/40"
                }`}
                title={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
                aria-label={inWishlist ? "Remove from wishlist" : "Save to wishlist"}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? "fill-[#C95745] text-[#C95745]" : ""}`} />
                <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">
                  {inWishlist ? "Saved" : "Save"}
                </span>
              </button>
            </div>

            {/* Product Key Specifications: Origin, Uses, Finish, Material */}
            {(() => {
              const badges = [
                { label: "Origin", value: product.origin, icon: Globe },
                { label: "Uses", value: product.usage || product.application, icon: ShieldCheck },
                { label: "Finish", value: product.finish?.trim().toLowerCase() === "matte" ? "Matt" : product.finish, icon: Sparkles },
                { label: "Material", value: product.material, icon: Layers },
              ].filter((b) => isValidSpec(b.value));

              if (badges.length === 0) return null;

              const gridColsClass =
                badges.length === 1
                  ? "grid-cols-1"
                  : badges.length === 2
                  ? "grid-cols-2"
                  : badges.length === 3
                  ? "grid-cols-2 sm:grid-cols-3"
                  : "grid-cols-2 sm:grid-cols-4";

              return (
                <div className={`grid ${gridColsClass} gap-2.5 sm:gap-3 py-3 border-y border-[#EDEAE4]`}>
                  {badges.map((b) => {
                    const IconComponent = b.icon;
                    return (
                      <div
                        key={b.label}
                        className="flex items-center space-x-2.5 p-2.5 sm:p-3 rounded-[2px] bg-[#FCFBF8] border border-[#EDEAE4] min-h-[58px]"
                      >
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[2px] bg-[#EDEAE4] flex items-center justify-center text-[#101B38] flex-shrink-0">
                          <IconComponent className="w-4 h-4 stroke-[1.5]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase tracking-wider text-[#777777] font-medium block leading-none mb-1">
                            {b.label}
                          </span>
                          <span className="text-xs font-semibold text-[#101B38] block leading-snug break-words">
                            {b.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Available Sizes Section */}
            {availableSizes.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#101B38] block">
                  Available Sizes
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {availableSizes.map((size: string) => {
                    const isSelected = selectedSize.replace(/\s+/g, "").toLowerCase() === size.replace(/\s+/g, "").toLowerCase();
                    return (
                      <button
                        key={size}
                        onClick={() => handleSizeSelect(size)}
                        className={`p-3 rounded-[2px] border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? "border-[#101B38] bg-[#101B38]/5 ring-1 ring-[#101B38] text-[#101B38] font-bold shadow-xs"
                            : "border-[#EDEAE4] hover:border-[#101B38]/40 text-[#333333] bg-[#FCFBF8]"
                        }`}
                      >
                        <span className="text-xs font-semibold leading-tight">{size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Colours Section */}
            {availableColors.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#101B38] block">
                    Available Colours
                  </span>
                  {selectedColor && (
                    <span className="text-[11px] font-semibold text-[#101B38] bg-[#EDEAE4] px-2.5 py-0.5 rounded-[2px] border border-[#DED9D0]">
                      Selected: <span className="font-bold">{selectedColor}</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {availableColors.map((color: string) => {
                      const rawCol = product.colorImages?.[color];
                      const rawImg = Array.isArray(rawCol)
                        ? rawCol.find((x: any) => typeof x === "string" && x.trim()) || rawCol[0]
                        : rawCol;
                      const mappedImg = rawImg || product.images?.find((img: string) => img.toLowerCase().includes(color.toLowerCase()));
                      const resolvedMapped = mappedImg ? resolveProductImage(mappedImg, product.categoryId, 0) : "";
                      const isSelected = selectedColor
                        ? selectedColor.toLowerCase() === color.toLowerCase()
                        : resolvedMapped && activeImg && resolvedMapped === activeImg;

                      const customHex = product.colorHexes?.[color] || product.color_hexes?.[color];

                      return (
                        <button
                          type="button"
                          key={color}
                          onClick={() => handleColorSelect(color)}
                          className={`px-4 py-2.5 rounded-[2px] border text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center space-x-2.5 ${
                            isSelected
                              ? "border-[#101B38] bg-[#101B38]/10 text-[#101B38] ring-1 ring-[#101B38] shadow-xs font-bold"
                              : "border-[#EDEAE4] bg-[#FCFBF8] hover:border-[#101B38]/40 text-[#333333]"
                          }`}
                          title={`Click to view ${color} tile`}
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs shrink-0"
                            style={{
                              backgroundColor: customHex || (
                                color.toLowerCase().includes("white")
                                  ? "#ffffff"
                                  : color.toLowerCase().includes("green") || color.toLowerCase().includes("emerald")
                                  ? "#059669"
                                  : color.toLowerCase().includes("blue") || color.toLowerCase().includes("navy")
                                  ? "#2563eb"
                                  : color.toLowerCase().includes("black")
                                  ? "#18181b"
                                  : color.toLowerCase().includes("brown")
                                  ? "#78350f"
                                  : color.toLowerCase().includes("beige") || color.toLowerCase().includes("cream")
                                  ? "#fef3c7"
                                  : color.toLowerCase().includes("gold") || color.toLowerCase().includes("bronze")
                                  ? "#b88e4f"
                                  : "#9ca3af"
                              )
                            }}
                          />
                          <span>{color}</span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-[#101B38] stroke-[3] ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Action Buttons: 2x2 Grid if catalogue present, or 3 buttons if No Catalogue */}
            <div className={`grid grid-cols-1 ${hasCatalogue ? "sm:grid-cols-2" : "sm:grid-cols-3"} gap-3 pt-3`}>
              {/* Button 1: ADD TO ENQUIRY */}
              <button
                type="button"
                onClick={handleAddToEnquiry}
                className={`w-full font-semibold text-xs uppercase tracking-wider py-4 rounded-[2px] shadow-sm transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 text-center ${
                  addedAnimation
                    ? "bg-emerald-600 text-white shadow-emerald-500/20"
                    : "bg-[#101B38] hover:bg-[#C95745] text-[#FCFBF8]"
                }`}
                title="Add to your consolidated Enquiry List"
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-4 h-4 text-white animate-scaleIn" />
                    <span>Added to Enquiry!</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-[#FCFBF8]/90" />
                    <span>Add to Enquiry &rarr;</span>
                  </>
                )}
              </button>

              {/* Button 2: WHATSAPP US */}
              <button
                onClick={handleWhatsApp}
                className="w-full bg-[#FCFBF8] hover:bg-[#101B38] hover:text-[#FCFBF8] text-[#101B38] border border-[#333333] font-semibold text-xs uppercase tracking-wider py-4 rounded-[2px] shadow-xs transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 text-center"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-emerald-600 shrink-0"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.978-.276-.1-.477-.15-.678.15-.2.301-.778.978-.954 1.179-.176.2-.351.226-.652.075s-1.271-.468-2.42-1.493c-.894-.798-1.498-1.784-1.674-2.085-.175-.301-.019-.464.132-.614.135-.135.301-.351.452-.527.15-.176.201-.301.301-.502.1-.2.05-.376-.025-.526s-.678-1.632-.929-2.235c-.244-.588-.493-.509-.678-.518l-.578-.01c-.2 0-.527.075-.803.376s-1.054 1.029-1.054 2.509c0 1.48 1.079 2.911 1.229 3.112.151.2 2.123 3.242 5.144 4.546.719.311 1.28.497 1.718.636.722.229 1.379.197 1.898.119.579-.087 1.78-.727 2.031-1.429.251-.702.251-1.304.176-.15-.075-.125-.276-.2-.577-.35z" />
                  <path d="M12.004 2C6.479 2 2 6.479 2 12.004c0 1.84.498 3.565 1.365 5.053L2 22l5.093-1.336c1.442.809 3.097 1.266 4.911 1.266 5.525 0 10.004-4.479 10.004-10.004C22.008 6.479 17.529 2 12.004 2zm0 18.283c-1.624 0-3.136-.452-4.43-1.233l-.317-.19-3.029.794.808-2.953-.207-.33c-.878-1.398-1.341-3.027-1.341-4.717 0-4.707 3.829-8.536 8.536-8.536 4.707 0 8.536 3.829 8.536 8.536 0 4.707-3.829 8.536-8.536 8.536z" />
                </svg>
                <span>WhatsApp Us</span>
              </button>

              {/* Button 3: REQUEST SAMPLE */}
              <button
                onClick={() => {
                  setInquiryType("sample");
                  setInquiryModalOpen(true);
                }}
                className="w-full bg-[#FCFBF8] hover:bg-[#101B38] hover:text-[#FCFBF8] text-[#101B38] border border-[#333333] font-semibold text-xs uppercase tracking-wider py-4 rounded-[2px] shadow-xs transition-all duration-300 cursor-pointer text-center"
              >
                Request Sample
              </button>

              {/* Button 4: DOWNLOAD CATALOGUE (Shown ONLY if catalogue is assigned) */}
              {hasCatalogue && (
                <a
                  href={catalogueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#FCFBF8] hover:bg-[#101B38] hover:text-[#FCFBF8] text-[#101B38] border border-[#333333] font-semibold text-xs uppercase tracking-wider py-4 rounded-[2px] shadow-xs transition-all duration-300 cursor-pointer flex items-center justify-center space-x-2 text-center"
                >
                  <span>Download Catalogue</span>
                  <Download className="w-4 h-4 text-current" />
                </a>
              )}
            </div>

            {/* Added Toast Notification */}
            <AnimatePresence>
              {addedToast.visible && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 bg-emerald-50 border border-emerald-200 rounded-[2px] flex items-center justify-between text-xs text-emerald-800 shadow-xs"
                >
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">{addedToast.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={openDrawer}
                    className="font-bold text-emerald-900 hover:text-black hover:underline text-[11px] ml-3 uppercase flex-shrink-0 cursor-pointer flex items-center space-x-1"
                  >
                    <span>View List</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Enquiry Cart Status / View Enquiry Bar */}
            {mounted && getTotalItems() > 0 && (
              <div className="flex items-center justify-between p-3 bg-[#FCFBF8] border border-[#EDEAE4] rounded-[2px] text-xs">
                <div className="flex items-center space-x-2 text-[#333333]">
                  <span className="w-6 h-6 rounded-[2px] bg-[#101B38] flex items-center justify-center text-[#FCFBF8] flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    <strong className="font-semibold">{getTotalItems()} item{getTotalItems() > 1 ? "s" : ""}</strong> currently in your Enquiry Cart
                  </span>
                </div>
                <button
                  type="button"
                  onClick={openDrawer}
                  className="font-semibold text-[#101B38] hover:text-[#C95745] uppercase tracking-wider text-[11px] flex items-center space-x-1.5 cursor-pointer bg-[#FCFBF8] px-3 py-1.5 rounded-[2px] border border-[#EDEAE4] hover:border-[#101B38]"
                >
                  <span>View Enquiry</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 3. MIDDLE SECTION: TABS & PRODUCT DETAILS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 border-t border-[#EDEAE4] pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* Left Column (span 6 or span 12 if Applications is hidden): Description & Specifications Tabs + Tab Content */}
          <div className={selectedApplicationCards.length > 0 ? "lg:col-span-6 space-y-6" : "lg:col-span-12 space-y-6"}>
            {/* Tabs Bar */}
            <div className="flex border-b border-[#EDEAE4] space-x-8 sm:space-x-10">
              {[
                { id: "description", label: "Description" },
                { id: "specifications", label: "Specifications" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "description" | "specifications")}
                  className={`pb-3.5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 cursor-pointer flex-shrink-0 ${
                    activeTab === tab.id
                      ? "border-[#C95745] text-[#101B38]"
                      : "border-transparent text-[#777777] hover:text-[#101B38]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Description */}
            {activeTab === "description" && (
              <div className="border border-[#EDEAE4] rounded-[2px] p-6 sm:p-8 bg-[#FCFBF8] shadow-xs space-y-5">
                <h3 className="font-serif text-xl font-normal text-[#101B38]">
                  {product.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#333333] font-normal leading-relaxed whitespace-pre-line">
                  {product.description ||
                    "Timex Ceramic surfaces reflect meticulous craftsmanship and international artistry. Engineered with high-purity vitrified minerals and pressed with thousands of tons of hydraulic force, each slab provides exceptional clarity and long-lasting durability."}
                </p>
              </div>
            )}

            {/* Tab 2: Specifications Table */}
            {activeTab === "specifications" && (
              <div className="space-y-6">
                <div className="border border-[#EDEAE4] rounded-[2px] overflow-hidden bg-[#FCFBF8] shadow-xs">
                  <div className="divide-y divide-[#EDEAE4] text-xs">
                    {specificationsData.map((item, idx) => (
                      <div
                        key={item.label}
                        className={`grid grid-cols-1 sm:grid-cols-2 py-3.5 px-4 sm:px-6 ${
                          idx % 2 === 0 ? "bg-[#FCFBF8]" : "bg-[#F7F5F0]"
                        }`}
                      >
                        <span className="font-semibold text-[#101B38]">{item.label}</span>
                        <span className="text-[#333333] font-normal sm:text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column (span 6): Applications Section - Displayed ONLY when selectedApplicationCards.length > 0 */}
          {selectedApplicationCards.length > 0 && (
            <div className="lg:col-span-6 space-y-6">
              <div className="border border-[#EDEAE4] rounded-[2px] p-6 sm:p-7 bg-[#FCFBF8] shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-[#EDEAE4]/70 pb-3">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-normal tracking-wide text-[#101B38]">
                      Applications
                    </h3>
                    <p className="text-xs text-[#555555] font-normal mt-0.5">
                      Recommended architectural areas & spaces for this surface.
                    </p>
                  </div>
                  <span className="text-[10px] tracking-wider uppercase font-semibold text-[#C95745]">
                    {selectedApplicationCards.length} {selectedApplicationCards.length === 1 ? "Space" : "Spaces"}
                  </span>
                </div>

                {/* Application Cards Grid */}
                <div
                  className={`grid gap-3.5 ${
                    selectedApplicationCards.length === 1
                      ? "grid-cols-1"
                      : selectedApplicationCards.length === 2
                      ? "grid-cols-1 sm:grid-cols-2"
                      : selectedApplicationCards.length === 3
                      ? "grid-cols-1 sm:grid-cols-3"
                      : "grid-cols-2 sm:grid-cols-2 xl:grid-cols-3"
                  }`}
                >
                  {selectedApplicationCards.map((app) => {
                    const Icon = app.icon;
                    const isSingleCard = selectedApplicationCards.length === 1;

                    return (
                      <Link
                        key={app.slug || app.name}
                        href={app.url}
                        title={`Explore ${app.name}`}
                        className="group relative flex flex-col rounded-[2px] overflow-hidden border border-[#EDEAE4] bg-[#FCFBF8] hover:border-[#101B38] hover:shadow-md transition-all duration-300"
                      >
                        {/* Card Image Banner */}
                        <div
                          className={`relative w-full overflow-hidden bg-[#101B38] ${
                            isSingleCard ? "h-44 sm:h-52" : "h-28 sm:h-32"
                          }`}
                        >
                          <Image
                            src={app.image}
                            alt={app.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          {/* Dark gradient for crisp text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#101B38]/90 via-[#101B38]/30 to-transparent" />

                          {/* Top-right Checkmark Badge */}
                          <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-[2px] bg-[#101B38]/90 text-[#FCFBF8] border border-white/20 flex items-center justify-center shadow-xs backdrop-blur-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>

                          {/* Overlaid Bottom Title & Icon on Single Featured Card */}
                          {isSingleCard && (
                            <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
                              <div className="w-9 h-9 rounded-[2px] bg-[#FCFBF8] text-[#101B38] flex items-center justify-center shadow-xs flex-shrink-0 group-hover:bg-[#101B38] group-hover:text-[#FCFBF8] transition-colors">
                                <Icon className="w-5 h-5 stroke-[1.8]" />
                              </div>
                              <div>
                                <h4 className="font-serif text-lg font-normal text-[#FCFBF8] leading-tight">
                                  {app.name}
                                </h4>
                                <span className="text-[11px] text-[#EDEAE4]/80 flex items-center gap-1 mt-0.5 group-hover:text-[#C95745] transition-colors">
                                  Explore Collection <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Body for Multi-card Grid */}
                        {!isSingleCard && (
                          <div className="p-3 sm:p-3.5 bg-[#FCFBF8] flex flex-col justify-between flex-1 border-t border-[#EDEAE4]/70">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-[2px] bg-[#EDEAE4] text-[#101B38] flex items-center justify-center shadow-2xs flex-shrink-0 group-hover:bg-[#101B38] group-hover:text-[#FCFBF8] transition-colors">
                                <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
                              </div>
                              <h4 className="font-serif text-xs sm:text-[13px] font-medium text-[#101B38] leading-snug group-hover:text-[#C95745] transition-colors line-clamp-1">
                                {app.name}
                              </h4>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-[#EDEAE4]/50">
                              <span className="text-[10px] font-semibold tracking-wider uppercase text-[#777777] group-hover:text-[#101B38] transition-colors">
                                View Tiles
                              </span>
                              <ArrowRight className="w-3 h-3 text-[#777777] group-hover:text-[#C95745] transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FULL WIDTH ROW: WHY CHOOSE TIMEX CERAMIC? */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="border border-[#EDEAE4] rounded-[2px] p-6 sm:p-8 bg-[#FCFBF8] shadow-xs space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-semibold tracking-widest uppercase text-[#C95745] block">
              TIMEX CERAMIC ADVANTAGE
            </span>
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#101B38]">
              Why Choose Timex Ceramic?
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-2">
            {whyChooseFeatures.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex flex-col items-center text-center space-y-3 p-4 rounded-[2px] bg-[#F7F5F0] border border-[#EDEAE4] hover:border-[#101B38]/40 hover:bg-[#FCFBF8] hover:shadow-sm transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-[2px] bg-[#EDEAE4] flex items-center justify-center text-[#101B38] group-hover:bg-[#C95745] group-hover:text-[#FCFBF8] transition-colors duration-300 flex-shrink-0">
                    <Icon className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <span className="text-xs font-semibold text-[#101B38] leading-snug">
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. BOTTOM SECTION: EXPLORE MORE FROM COLLECTION CAROUSEL */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 pt-4 relative">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal text-[#101B38]">
              Explore More From {collectionInfo.name}
            </h2>
          </div>
          <Link
            href={collectionInfo.url}
            className="group text-xs font-semibold text-[#101B38] hover:text-[#C95745] transition-colors inline-flex items-center gap-1.5 uppercase tracking-wider font-sans pb-2 border-b border-[#EDEAE4] hover:border-[#C95745]"
          >
            <span>View All Collection</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>

        {/* Carousel Container with Left/Right Navigation Arrows */}
        <div className="relative group">
          <button
            onClick={() => scrollCarousel("left")}
            className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-[2px] bg-[#101B38] text-[#FCFBF8] flex items-center justify-center shadow-md hover:bg-[#C95745] transition-all cursor-pointer"
            aria-label="Previous products"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div
            ref={carouselScrollRef}
            className="flex space-x-5 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth"
          >
            {relatedProducts.map((relProduct) => {
              const isRelWish = mounted ? wishlist.hasItem(relProduct.id, relProduct.slug) : false;
              return (
                <div
                  key={relProduct.id}
                  className="w-[230px] sm:w-[250px] md:w-[260px] flex-shrink-0 bg-[#FCFBF8] border border-[#EDEAE4] rounded-[2px] overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between group/card"
                >
                  <div>
                    {/* Tile Image */}
                    <div className="relative aspect-square w-full bg-[#FCFBF8] overflow-hidden border-b border-[#EDEAE4]">
                      <Image
                        src={resolveProductImage(relProduct.images?.[0] || relProduct.thumbnail, relProduct.categoryId, 0)}
                        alt={relProduct.name}
                        fill
                        sizes="260px"
                        className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                      />
                      {/* Active Badges */}
                      {Boolean(relProduct.isNewArrival || relProduct.is_new_arrival) && (
                        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 pointer-events-none">
                          <span className="text-[8px] font-semibold tracking-wider text-[#C95745] bg-[#FCFBF8]/95 px-2 py-0.5 rounded-[2px] shadow-2xs border border-[#C95745]/30 uppercase">
                            NEW
                          </span>
                        </div>
                      )}
                      {/* Tile of Spain Badge */}
                      {Boolean(relProduct.showTileOfSpainBadge || relProduct.show_tile_of_spain_badge) && (
                        <TileOfSpainBadge size="sm" />
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          isRelWish ? wishlist.removeItem(relProduct.id, relProduct.slug) : wishlist.addItem(relProduct.id);
                        }}
                        className="absolute top-3 right-3 z-10 p-2 rounded-[2px] bg-[#FCFBF8]/90 hover:bg-[#FCFBF8] shadow-xs text-gray-400 hover:text-[#C95745] transition-colors cursor-pointer"
                        aria-label="Save to wishlist"
                      >
                        <Heart className={`w-4 h-4 ${isRelWish ? "fill-[#C95745] text-[#C95745]" : ""}`} />
                      </button>
                    </div>

                    {/* Tile Info: STRICTLY Product Name & Collection Name only */}
                    <div className="p-4 space-y-1">
                      <h4 className="font-serif text-sm sm:text-base font-normal text-[#101B38] group-hover/card:text-[#C95745] transition-colors line-clamp-1">
                        {relProduct.name}
                      </h4>
                      <p className="text-[11px] text-[#555555] font-normal tracking-wider uppercase line-clamp-1">
                        {getCleanCollectionName(relProduct)}
                      </p>
                    </div>
                  </div>

                  {/* View Details Link */}
                  <div className="p-4 pt-0">
                    <Link
                      href={`/product/${relProduct.slug || relProduct.code}`}
                      className="group/btn inline-flex items-center gap-1.5 text-xs font-semibold text-[#101B38] hover:text-[#C95745] pb-1.5 border-b border-[#EDEAE4] hover:border-[#C95745] transition-colors uppercase tracking-wider font-sans"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => scrollCarousel("right")}
            className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-[2px] bg-[#101B38] text-[#FCFBF8] flex items-center justify-center shadow-md hover:bg-[#C95745] transition-all cursor-pointer"
            aria-label="Next products"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* 5. MODAL: IMAGE LIGHTBOX / ZOOM PREVIEW */}
      {zoomModalOpen && (
        <div
          onClick={() => setZoomModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200"
        >
          {/* Top Bar inside Lightbox */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl flex items-center justify-between z-20 py-2"
          >
            <div className="flex items-center gap-3 text-white">
              <span className="font-serif font-bold text-sm sm:text-base tracking-wide text-white">
                {product.name}
              </span>
              {collectionInfo?.name && (
                <span className="text-[11px] text-[#c5a880] uppercase tracking-wider font-semibold hidden sm:inline">
                  • {collectionInfo.name}
                </span>
              )}
              {galleryItems.length > 1 && (
                <span className="text-[11px] text-gray-300 font-mono bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                  {activeItemIndex + 1} / {galleryItems.length}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setZoomModalOpen(false)}
              className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer border border-white/10"
              aria-label="Close full photo view"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Center Area: Left Arrow, Main Item, Right Arrow */}
          <div className="relative w-full max-w-6xl flex-1 flex items-center justify-center my-auto min-h-0">
            {/* Previous Image Arrow */}
            {galleryItems.length > 1 && (
              <button
                type="button"
                onClick={handlePrevModalImage}
                className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 hover:border-white/40 transition-all cursor-pointer shadow-lg"
                aria-label="Previous item"
                title="Previous item (Left arrow)"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Main Full Item */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-full h-[65vh] sm:h-[75vh] max-h-[820px] rounded-2xl overflow-hidden flex items-center justify-center bg-black/20"
            >
              {activeItem.type === "video" ? (
                <iframe
                  src={activeItem.embedUrl}
                  title={`${product.name} Video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <>
                  <Image
                    src={activeItem.url}
                    alt={product.name}
                    fill
                    priority
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    className="object-contain"
                  />
                  {Boolean(product.showTileOfSpainBadge || product.show_tile_of_spain_badge) && (
                    <TileOfSpainBadge size="lg" className="bottom-4 left-4 sm:bottom-6 sm:left-6" />
                  )}
                </>
              )}
            </div>

            {/* Next Image Arrow */}
            {galleryItems.length > 1 && (
              <button
                type="button"
                onClick={handleNextModalImage}
                className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/90 hover:text-white border border-white/20 hover:border-white/40 transition-all cursor-pointer shadow-lg"
                aria-label="Next item"
                title="Next item (Right arrow)"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {galleryItems.length > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl flex items-center justify-center gap-2 overflow-x-auto py-2 px-3 bg-black/50 backdrop-blur-md rounded-[2px] border border-white/10 z-20 scrollbar-none"
            >
              {galleryItems.map((item, idx) => {
                const isSelected = activeItemIndex === idx;

                if (item.type === "video") {
                  return (
                    <button
                      type="button"
                      key={`modal-thumb-video-${item.id}`}
                      onClick={() => {
                        setActiveItemIndex(idx);
                        setIsPlayingVideo(true);
                      }}
                      className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-[2px] overflow-hidden flex-shrink-0 transition-all cursor-pointer border bg-black ${
                        isSelected
                          ? "border-[#C95745] ring-2 ring-[#C95745] scale-105"
                          : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/50"
                      }`}
                      title="Play video"
                      aria-label="Play video"
                    >
                      <Image
                        src={item.thumbnail}
                        alt="Video Thumbnail"
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                      </div>
                    </button>
                  );
                }

                return (
                  <button
                    type="button"
                    key={`modal-thumb-${item.url}-${idx}`}
                    onClick={() => {
                      setActiveItemIndex(idx);
                      setActiveImg(item.url);
                      setIsPlayingVideo(false);
                      const matched = findColorForImage(item.url, product);
                      if (matched) setSelectedColor(matched);
                    }}
                    className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-[2px] overflow-hidden flex-shrink-0 transition-all cursor-pointer border ${
                      isSelected
                        ? "border-[#C95745] ring-2 ring-[#C95745] scale-105"
                        : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/50"
                    }`}
                  >
                    <Image
                      src={item.url}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 6. MODAL: INQUIRY / QUOTE / SAMPLE REQUEST */}
      {inquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-lg w-full bg-[#FCFBF8] p-6 sm:p-8 rounded-[2px] shadow-2xl border border-[#EDEAE4] relative">
            <button
              onClick={() => setInquiryModalOpen(false)}
              className="absolute top-5 right-5 text-gray-500 hover:text-[#101B38] transition-colors cursor-pointer p-1 rounded-[2px]"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <span className="text-[10px] tracking-widest text-[#C95745] font-semibold uppercase block">
                {inquiryType === "sample" ? "Request Physical Sample" : "Get a Price Quote"}
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#101B38] mt-1">
                {product.name}
              </h3>
              <p className="text-xs text-[#555555] font-normal mt-1">
                Selected Size: <span className="font-semibold text-[#101B38]">{selectedSize}</span>
              </p>
            </div>

            {formSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-base font-normal text-[#101B38]">
                  {inquiryType === "sample" ? "Sample Request Received!" : "Quote Request Received!"}
                </h4>
                <p className="text-xs text-[#555555] font-normal max-w-sm mx-auto">
                  Our sales team will review your request and get back to you regarding your enquiry.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                {/* Honeypot anti-spam field */}
                <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
                  <input
                    type="text"
                    name="honeypot_field"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {formError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-[2px] font-medium">
                    {formError}
                  </div>
                )}

                <Input
                  label="Your Full Name *"
                  placeholder="e.g. Rajesh Malhotra"
                  required
                  value={formData.name}
                  onChange={(e) => {
                    const filtered = filterNameInput(e.target.value);
                    setFormData({ ...formData, name: filtered });
                    if (formFieldErrors.name) {
                      setFormFieldErrors((prev) => ({ ...prev, name: getNameError(filtered) || "" }));
                    }
                  }}
                  onBlur={() => {
                    const err = getNameError(formData.name);
                    if (err) setFormFieldErrors((prev) => ({ ...prev, name: err }));
                  }}
                  error={formFieldErrors.name}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="name@architect.com"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (formFieldErrors.email) {
                        setFormFieldErrors((prev) => ({ ...prev, email: getEmailError(e.target.value, true) || "" }));
                      }
                    }}
                    onBlur={() => {
                      const err = getEmailError(formData.email, true);
                      if (err) setFormFieldErrors((prev) => ({ ...prev, email: err }));
                    }}
                    error={formFieldErrors.email}
                  />
                  <Input
                    label="Phone Number *"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    leftAddon="+91"
                    placeholder="10-digit mobile number"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      const filtered = filterPhoneInput(e.target.value);
                      setFormData({ ...formData, phone: filtered });
                      if (formFieldErrors.phone) {
                        setFormFieldErrors((prev) => ({ ...prev, phone: getPhoneError(filtered) || "" }));
                      }
                    }}
                    onBlur={() => {
                      const err = getPhoneError(formData.phone);
                      if (err) setFormFieldErrors((prev) => ({ ...prev, phone: err }));
                    }}
                    error={formFieldErrors.phone}
                  />
                </div>

                <Input
                  label="Company / Architectural Firm (Optional)"
                  placeholder="Design Studio Name"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />

                <Input
                  label="Project Requirements / Message"
                  textarea
                  placeholder="Describe your site location, approximate area (sq ft / sq m), target handover date..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />

                <Button
                  variant="primary"
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-4 rounded-[2px] font-semibold uppercase text-xs tracking-wider"
                >
                  {formLoading ? "Submitting..." : inquiryType === "sample" ? "Submit Sample Request" : "Submit Quote Request"}
                </Button>
              </form>
            )}
          </Card>
        </div>
      )}

    </div>
  );
}

export default ProductDetailClient;
