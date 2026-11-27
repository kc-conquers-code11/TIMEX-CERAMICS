/**
 * Central registry of high-resolution photorealistic dummy ceramic & tile images.
 * Organized by the 19 official brand categories.
 * Each category includes distinct angles:
 * 1. Ambience (Real luxury room installation)
 * 2. Front (Direct tile face shot)
 * 3. Texture (Macro surface / glaze detail)
 * 4. Close (Angled perspective / light reflection)
 * 5. Surface (Tactile / relief finish)
 * 6. Edge (Rectified seam / profile)
 */

export interface CategoryImageSet {
  ambience: string;
  front: string;
  texture: string;
  close: string;
  surface: string;
  edge: string;
}

export const CATEGORY_IMAGE_REGISTRY: Record<string, CategoryImageSet> = {
  // 1. Stone Look (Italian Statuario, Calacatta Marble, Natural Quarry)
  stone: {
    ambience: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
  },

  // 2. Subway Tiles (Glazed Metro Tiles & Wall Backsplashes)
  subway: {
    ambience: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80",
  },

  // 3. Moroccan Tiles (Zellige & Handcrafted Arabesque)
  moroccan: {
    ambience: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80",
  },

  // 4. Octagonal Tiles (Victorian Key Dot Patterns)
  octagonal: {
    ambience: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
  },

  // 5. Wooden Look (Oak, Walnut, & Teak Porcelain Planks)
  wooden: {
    ambience: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
  },

  // 6. Texture / 3D (Sculpted Linear Relief & Fluted Surfaces)
  texture: {
    ambience: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
  },

  // 7. Colorful Tiles (Glazed Pigments & Jewel Tones)
  colorful: {
    ambience: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80",
  },

  // 8. Terrazzo Pattern (Speckled Composite & Quartz Flakes)
  terrazzo: {
    ambience: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
  },

  // 9. Tropical / Floral (Botanical Murals & Palm Leaf Ceramics)
  tropical: {
    ambience: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80",
  },

  // 10. Metallic Finish (Oxidized Corten Steel & Titanium Patinas)
  metallic: {
    ambience: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
  },

  // 11. Geometric Pattern (Optical Rhombus & Diamond Arrays)
  geometric: {
    ambience: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80",
  },

  // 12. Highlighter Tiles (Gold Veined & Luxury Accent Slabs)
  highlighter: {
    ambience: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
  },

  // 13. White / Plain (Pristine Pure White & Satin Alabaster)
  white: {
    ambience: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80",
  },

  // 14. Mosaic Tiles (Glass, Stone & Tesserae Mesh)
  mosaic: {
    ambience: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
  },

  // 15. Boutique Tiles (Haute Couture Luxury Ceramics)
  boutique: {
    ambience: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
  },

  // 16. French Frames (Classic Boiserie Molded Relief Panels)
  "french-frames": {
    ambience: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
  },

  // 17. Fabric Texture (Linen & Canvas Weave Ceramic)
  fabric: {
    ambience: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
  },

  // 18. Brick Look (Exposed Terracotta & Clinker)
  brick: {
    ambience: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1000&q=80",
  },

  // 19. Hexagon Tiles (Honeycomb Geometries)
  hexagon: {
    ambience: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1000&q=80",
  },

  // 20. Marble Look (Italian Statuario, Calacatta & Royal Veining)
  marble: {
    ambience: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1000&q=80",
  },

  // 21. Modular Tiles (Interlocking Grid & Versailles Patterns)
  modular: {
    ambience: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80",
    front: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1000&q=80",
    texture: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=80",
    close: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=1000&q=80",
    surface: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1000&q=80",
    edge: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80",
  },
};

/**
 * Return array of 6 distinct image angles for a given category
 */
export function getCategoryDummyImages(categorySlug: string): string[] {
  const norm = (categorySlug || "stone").toLowerCase().trim();
  const set = CATEGORY_IMAGE_REGISTRY[norm] || CATEGORY_IMAGE_REGISTRY.stone;
  return [set.ambience, set.front, set.texture, set.close, set.surface, set.edge];
}

/**
 * Get category banner image
 */
export function getCategoryBanner(categorySlug: string): string {
  const norm = (categorySlug || "stone").toLowerCase().trim();
  const set = CATEGORY_IMAGE_REGISTRY[norm] || CATEGORY_IMAGE_REGISTRY.stone;
  return set.ambience;
}

/**
 * Get category thumbnail image
 */
export function getCategoryThumbnail(categorySlug: string): string {
  const norm = (categorySlug || "stone").toLowerCase().trim();
  const set = CATEGORY_IMAGE_REGISTRY[norm] || CATEGORY_IMAGE_REGISTRY.stone;
  return set.front;
}

/**
 * Resolve any image URL. If missing, undefined, or ending with .svg, replace with high-res photo.
 */
export function resolveProductImage(
  imageUrl?: any,
  categorySlug?: string,
  index: number = 0
): string {
  if (Array.isArray(imageUrl)) {
    imageUrl = imageUrl.find((x: any) => typeof x === "string" && x.trim()) || imageUrl[0];
  }
  if (typeof imageUrl !== "string") {
    imageUrl = "";
  }

  const isSvgOrMissing =
    !imageUrl ||
    imageUrl.trim() === "" ||
    imageUrl.endsWith(".svg") ||
    imageUrl.includes("ambience.svg") ||
    imageUrl.includes("front.svg") ||
    imageUrl.includes("texture.svg") ||
    imageUrl.includes("close.svg") ||
    imageUrl.includes("surface.svg") ||
    imageUrl.includes("edge.svg");

  if (!isSvgOrMissing) {
    return imageUrl;
  }

  const categoryImages = getCategoryDummyImages(categorySlug || "stone");
  return categoryImages[index % categoryImages.length];
}

/**
 * Clean and normalize a space name or slug for robust fuzzy-key matching.
 */
function cleanSpaceKey(str?: string): string {
  if (!str || typeof str !== "string") return "";
  return str
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+tiles$/i, "")
    .replace(/-tiles$/i, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Retrieve space-specific assigned image for a product.
 * Returns null if no custom space assignment exists, so the caller can fall back to the default product image.
 */
export function getProductSpaceImage(product: any, spaceNameOrSlug?: string): string | null {
  if (!product || !spaceNameOrSlug || typeof spaceNameOrSlug !== "string") return null;

  // Pick the FIRST source that actually has entries. An empty object
  // (e.g. spaceImages: {}) must not shadow a populated space_images_json string.
  const candidates = [product.spaceImages, product.space_images, product.space_images_json];
  let map: any = null;
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    let parsed = candidate;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (_) {
        continue;
      }
    }
    if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
      map = parsed;
      break;
    }
  }
  if (!map || typeof map !== "object") return null;

  const targetTrimmed = spaceNameOrSlug.trim();
  if (!targetTrimmed) return null;

  // 1. Direct exact key match (case-sensitive or lowercase)
  if (typeof map[targetTrimmed] === "string" && map[targetTrimmed].trim()) {
    return map[targetTrimmed].trim();
  }
  const lowerTarget = targetTrimmed.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (k.toLowerCase() === lowerTarget && typeof v === "string" && (v as string).trim()) {
      return (v as string).trim();
    }
  }

  const targetClean = cleanSpaceKey(targetTrimmed);
  if (!targetClean) return null;

  for (const [key, val] of Object.entries(map)) {
    if (!val || typeof val !== "string" || !val.trim()) continue;
    const kClean = cleanSpaceKey(key);
    if (kClean === targetClean) {
      return val.trim();
    }
    // Sub-match for composite spaces (e.g., Living & Dining vs Living Room)
    if (kClean && targetClean) {
      if (kClean.includes(targetClean) || targetClean.includes(kClean)) {
        return val.trim();
      }
      if (targetClean.includes("living") && kClean.includes("living")) return val.trim();
      if (targetClean.includes("bedroom") && kClean.includes("bedroom")) return val.trim();
      if (targetClean.includes("bathroom") && kClean.includes("bathroom")) return val.trim();
      if (targetClean.includes("kitchen") && kClean.includes("kitchen")) return val.trim();
      if (targetClean.includes("balcony") && (kClean.includes("balcony") || kClean.includes("terrace"))) return val.trim();
      if (targetClean.includes("outdoor") && (kClean.includes("outdoor") || kClean.includes("landscape"))) return val.trim();
      if (targetClean.includes("cafe") && (kClean.includes("cafe") || kClean.includes("restaurant"))) return val.trim();
      if (targetClean.includes("commercial") && (kClean.includes("commercial") || kClean.includes("office"))) return val.trim();
      if (targetClean.includes("elevation") && (kClean.includes("elevation") || kClean.includes("exterior"))) return val.trim();
      if (targetClean.includes("spa") && kClean.includes("spa")) return val.trim();
      if (targetClean.includes("pool") && kClean.includes("pool")) return val.trim();
    }
  }

  return null;
}

/**
 * Retrieve color-variant image for a product (colorImages keyed by variant color name).
 * Supports both single image string and array of image URLs (returns the first/primary photo).
 * Exact or case-insensitive key match only — never fuzzy — so the displayed variant
 * always matches the active color filter.
 */
export function getProductColorImage(product: any, colorName?: string): string | null {
  if (!product || !colorName || typeof colorName !== "string") return null;

  let map = product.colorImages || product.color_images;
  if (!map && typeof product.color_images_json === "string") {
    try {
      map = JSON.parse(product.color_images_json);
    } catch (_) {}
  }

  const targetTrimmed = colorName.trim();
  if (!targetTrimmed) return null;

  const extractFirst = (val: any): string | null => {
    if (typeof val === "string" && val.trim()) return val.trim();
    if (Array.isArray(val) && val.length > 0) {
      const first = val.find((x: any) => typeof x === "string" && x.trim());
      if (first) return (first as string).trim();
    }
    return null;
  };

  if (map && typeof map === "object") {
    if (map[targetTrimmed] !== undefined) {
      const first = extractFirst(map[targetTrimmed]);
      if (first) return first;
    }
    const lowerTarget = targetTrimmed.toLowerCase();
    for (const [k, v] of Object.entries(map)) {
      if (k.toLowerCase() === lowerTarget) {
        const first = extractFirst(v);
        if (first) return first;
      }
    }
  }

  // Fallback: boundary-safe filename match in product.images (e.g. Belle-Beige-240-x-740.webp)
  if (Array.isArray(product.images) && product.images.length > 0) {
    const escaped = targetTrimmed.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const tokenRegex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i");
    const filenameMatch = product.images.find((img: any) => {
      if (typeof img !== "string" || !img.trim()) return false;
      const filename = img.split("/").pop() || img;
      return tokenRegex.test(filename);
    });
    if (filenameMatch) return filenameMatch.trim();
  }

  return null;
}

/**
 * Retrieve all color-variant images for a product (colorImages keyed by variant color name).
 * Returns array of image URLs (whether configured as a single string or an array).
 */
export function getProductColorImages(product: any, colorName?: string): string[] {
  if (!product || !colorName || typeof colorName !== "string") return [];

  let map = product.colorImages || product.color_images;
  if (!map && typeof product.color_images_json === "string") {
    try {
      map = JSON.parse(product.color_images_json);
    } catch (_) {}
  }
  if (!map || typeof map !== "object") return [];

  const targetTrimmed = colorName.trim();
  if (!targetTrimmed) return [];

  const extractList = (val: any): string[] => {
    if (Array.isArray(val)) {
      return val
        .filter((x: any): x is string => typeof x === "string" && Boolean(x.trim()))
        .map((x) => x.trim());
    }
    if (typeof val === "string" && val.trim()) {
      return [val.trim()];
    }
    return [];
  };

  if (map[targetTrimmed] !== undefined) {
    const list = extractList(map[targetTrimmed]);
    if (list.length > 0) return list;
  }
  const lowerTarget = targetTrimmed.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (k.toLowerCase() === lowerTarget) {
      const list = extractList(v);
      if (list.length > 0) return list;
    }
  }

  return [];
}
