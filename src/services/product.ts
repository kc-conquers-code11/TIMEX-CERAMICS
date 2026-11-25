import { CATEGORIES, MOCK_PRODUCTS } from "@/data/products";
import { cleanSpecValue, isSpecUnspecified } from "@/utils/productSpecs";
import { matchesProductCategory } from "@/utils/productCategories";

export interface ProductFilterInput {
  search?: string;
  category?: string;
  collection?: string;
  room?: string;
  application?: string;
  space?: string;
  shape?: string;
  design?: string;
  origin?: string;
  look?: string;
  finish?: string;
  material?: string;
  color?: string;
  size?: string;
  thickness?: string;
  includeInactive?: boolean;
  includeTrashed?: boolean;
  tag?: string;
  isNewArrival?: boolean;
}

export function matchProductSearch(p: any, query: string): boolean {
  if (!query || !query.trim()) return true;
  const rawQuery = query.trim().toLowerCase();

  const sec = Array.isArray(p.secondaryCategories)
    ? p.secondaryCategories.join(" ")
    : (Array.isArray(p.secondary_categories) ? p.secondary_categories.join(" ") : "");
  const subs = Array.isArray(p.subcategories)
    ? p.subcategories.map((s: any) => typeof s === "string" ? s : (s?.name || s?.slug || "")).join(" ")
    : "";
  const spaces = Array.isArray(p.spaces)
    ? p.spaces.join(" ")
    : (p.tilesBySpace || p.spaceArea || p.tiles_by_space || "");

  const searchableText = [
    p.name,
    p.code,
    p.sku,
    p.slug,
    p.description,
    p.category,
    p.category_name,
    p.categoryId,
    p.category_id,
    p.collection,
    p.collection_name,
    p.collectionId,
    p.collection_id,
    p.look,
    p.finish,
    p.surface,
    p.material,
    p.color,
    Array.isArray(p.availableColors) ? p.availableColors.join(" ") : "",
    p.size,
    p.thickness,
    p.edgeType,
    p.edge_type,
    p.usage,
    p.application,
    p.tilePattern,
    p.pattern,
    p.keywords,
    p.shape,
    p.shapes ? (Array.isArray(p.shapes) ? p.shapes.join(" ") : p.shapes) : "",
    p.tilesByShape,
    p.tiles_by_shape,
    p.tilesBySize,
    p.tiles_by_size,
    spaces,
    sec,
    subs,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (searchableText.includes(rawQuery)) {
    return true;
  }

  const tokens = rawQuery.split(/\s+/).filter((t) => t.length > 0);
  if (tokens.length === 0) return true;

  return tokens.every((token) => searchableText.includes(token));
}

// In-memory cache for SSR & server-side requests
let _cachedProducts: any[] | null = null;
let _cachedMtime = 0;
let _lastCacheCheck = 0;

export function invalidateProductCache(): void {
  _cachedProducts = null;
  _cachedMtime = 0;
  _lastCacheCheck = 0;
}

// Single Source of Truth for Product Data
export function getStoredProducts(): any[] {
  if (typeof window === "undefined") {
    try {
      const fs = eval("require")("fs");
      const path = eval("require")("path");
      const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const storePath = (isServerless && fs.existsSync("/tmp/data/store.json"))
        ? "/tmp/data/store.json"
        : path.resolve(process.cwd(), "server/data/store.json");
      if (fs.existsSync(storePath)) {
        const now = Date.now();
        // Return memory cached products immediately if checked within last 2.5 seconds
        if (_cachedProducts && now - _lastCacheCheck < 2500) {
          return _cachedProducts;
        }

        const stat = fs.statSync(storePath);
        if (_cachedProducts && stat.mtimeMs === _cachedMtime) {
          _lastCacheCheck = now;
          return _cachedProducts;
        }

        const content = fs.readFileSync(storePath, "utf8");
        const data = JSON.parse(content);
        if (Array.isArray(data.products) && data.products.length > 0) {
          const parsedProducts = data.products.map((p: any) => {
            const name = p.name || "";
            const code = p.code || "";
            const categoryId = p.categoryId || p.category_id || "stone";
            const categoryName = p.category || p.category_name || "Stone Look";
            const collectionId = p.collectionId || p.collection_id || "coll-stone";
            const collectionName = p.collection || p.collection_name || "Timex Premium Collection";
            const price = Number(p.price) || 0;
            const b2bPrice = Number(p.b2bPrice !== undefined ? p.b2bPrice : (p.b2b_price || 0));
            const application = cleanSpecValue(p.usage !== undefined ? p.usage : p.application);
            const shapes = Array.isArray(p.shapes)
              ? p.shapes.map((s: any) => cleanSpecValue(s)).filter(Boolean)
              : (p.shape || p.tilesByShape || p.tiles_by_shape
                  ? String(p.shape || p.tilesByShape || p.tiles_by_shape).split(",").map((s: string) => cleanSpecValue(s)).filter(Boolean)
                  : []);
            const shape = cleanSpecValue(p.shape || p.tilesByShape || p.tiles_by_shape || shapes.join(", "));
            const customShape = cleanSpecValue(p.customShape || p.custom_shape);
            const tilesBySizeList = Array.isArray(p.tilesBySizeList)
              ? p.tilesBySizeList.map((s: any) => cleanSpecValue(s)).filter(Boolean)
              : (p.tilesBySize || p.tiles_by_size
                ? String(p.tilesBySize || p.tiles_by_size).split(",").map((s: string) => cleanSpecValue(s)).filter(Boolean)
                : []);
            const tilesBySize = cleanSpecValue(p.tilesBySize || p.tiles_by_size || tilesBySizeList.join(", "));
            const customTilesBySize = cleanSpecValue(p.customTilesBySize || p.custom_tiles_by_size);
            const size = cleanSpecValue(p.size);
            const thickness = cleanSpecValue(p.thickness);
            const rawFinish = cleanSpecValue(p.finish);
            const finish = rawFinish.toLowerCase() === "matte" ? "Matt" : rawFinish;
            const look = cleanSpecValue(p.look || categoryName);
            const material = cleanSpecValue(p.material);
            const origin = cleanSpecValue(p.origin);
            const color = cleanSpecValue(p.color);
            const surface = cleanSpecValue(p.surface);
            const edgeType = cleanSpecValue(p.edgeType !== undefined ? p.edgeType : p.edge_type);
            const pattern = cleanSpecValue(p.tilePattern !== undefined ? p.tilePattern : (p.pattern !== undefined ? p.pattern : ""));
            const tilesBySpace = cleanSpecValue(p.tilesBySpace !== undefined ? p.tilesBySpace : (p.tiles_by_space !== undefined ? p.tiles_by_space : p.spaceArea));
            const spaces = Array.isArray(p.spaces)
              ? p.spaces.map((s: any) => String(s).trim()).filter(Boolean)
              : (tilesBySpace
                  ? tilesBySpace.split(",").map((s: string) => s.trim()).filter((s: string) => Boolean(s) && !isSpecUnspecified(s))
                  : []);
            const kgPerBox = cleanSpecValue(p.kgPerBox !== undefined ? p.kgPerBox : (p.kg_per_box !== undefined ? p.kg_per_box : p.weight));
            const pcsPerBox = cleanSpecValue(p.pcsPerBox !== undefined ? p.pcsPerBox : (p.pcs_per_box !== undefined ? p.pcs_per_box : p.packingDetails));
            const sftPerBox = cleanSpecValue(p.sftPerBox !== undefined ? p.sftPerBox : (p.sft_per_box !== undefined ? p.sft_per_box : p.sqftPerBox));
            const availableSizes = Array.isArray(p.availableSizes)
              ? p.availableSizes.map((s: any) => cleanSpecValue(s)).filter(Boolean)
              : [];
            const availableColors = Array.isArray(p.availableColors)
              ? p.availableColors.map((c: any) => cleanSpecValue(c)).filter(Boolean)
              : [];

            // Pick the FIRST source that actually has entries. An empty object
            // (e.g. colorImages: {}) must not shadow a populated color_images_json string.
            const colorImageCandidates: any[] = [p.colorImages, p.color_images, p.color_images_json];
            let rawColorImages: any = {};
            for (const candidate of colorImageCandidates) {
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
                rawColorImages = parsed;
                break;
              }
            }
            const cleanColorImages: Record<string, string | string[]> = {};
            const availColorByLower = new Map<string, string>();
            availableColors.forEach((c: string) => {
              availColorByLower.set(c.toLowerCase(), c);
            });
            if (rawColorImages && typeof rawColorImages === "object") {
              Object.entries(rawColorImages).forEach(([k, v]) => {
                if (typeof k !== "string" || !k.trim()) return;
                const canonicalKey = availColorByLower.get(k.trim().toLowerCase()) || k.trim();
                if (typeof v === "string" && v.trim()) {
                  cleanColorImages[canonicalKey] = v.trim();
                } else if (Array.isArray(v)) {
                  const cleanedList = v
                    .filter((item: any): item is string => typeof item === "string" && Boolean(item.trim()))
                    .map((item) => item.trim());
                  if (cleanedList.length > 0) {
                    cleanColorImages[canonicalKey] = cleanedList;
                  }
                }
              });
            }

            const rawColorHexes = p.colorHexes || p.color_hexes || {};
            const cleanColorHexes: Record<string, string> = {};
            availableColors.forEach((c: string) => {
              if (rawColorHexes[c]) cleanColorHexes[c] = rawColorHexes[c];
            });

            const rawSizeImages = p.sizeImages || {};
            const cleanSizeImages: Record<string, string> = {};
            availableSizes.forEach((s: string) => {
              if (rawSizeImages[s]) cleanSizeImages[s] = rawSizeImages[s];
            });

            // Pick the FIRST source that actually has entries. An empty object
            // (e.g. spaceImages: {}) must not shadow a populated space_images_json string.
            const spaceImageCandidates: any[] = [p.spaceImages, p.space_images, p.space_images_json];
            let rawSpaceImages: any = {};
            for (const candidate of spaceImageCandidates) {
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
                rawSpaceImages = parsed;
                break;
              }
            }
            const cleanSpaceImages: Record<string, string> = {};
            if (rawSpaceImages && typeof rawSpaceImages === "object") {
              Object.entries(rawSpaceImages).forEach(([k, v]) => {
                if (typeof k === "string" && k.trim() && typeof v === "string" && v.trim()) {
                  const trimmedK = k.trim();
                  const trimmedV = v.trim();
                  cleanSpaceImages[trimmedK] = trimmedV;
                  const slugK = trimmedK
                    .toLowerCase()
                    .replace(/&/g, "and")
                    .replace(/[\s\W-]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                  if (slugK && !cleanSpaceImages[slugK]) {
                    cleanSpaceImages[slugK] = trimmedV;
                  }
                }
              });
            }
            const images = Array.isArray(p.images) ? p.images : [];
            const isActive = p.status === "Inactive" || p.status === "Inactive (Draft)"
              ? false
              : p.isActive !== undefined
              ? Boolean(p.isActive)
              : p.is_active !== undefined
              ? Boolean(p.is_active)
              : true;
            const status = isActive ? "Active" : "Inactive";
            const metaTitle = p.metaTitle || p.meta_title || `${name} | Timex Ceramic`;
            const metaDescription = p.metaDescription || p.meta_description || p.description || "";
            const keywords = p.keywords || `${name}, ${categoryName}, tiles, timex ceramic`;

            return {
              ...p,
              id: p.id,
              slug: p.slug,
              name,
              code,
              sku: p.sku || `TMX-SKU-${code}`,
              barcode: p.barcode || "",
              description: p.description || "",
              price,
              b2bPrice,
              b2b_price: b2bPrice,
              inventory: Number(p.inventory) || 100,
              categoryId,
              category_id: categoryId,
              category: categoryName,
              category_name: categoryName,
              collectionId,
              collection_id: collectionId,
              collection: collectionName,
              collection_name: collectionName,
              secondaryCategories: Array.isArray(p.secondaryCategories)
                ? p.secondaryCategories
                : (Array.isArray(p.secondary_categories)
                  ? p.secondary_categories
                  : (p.secondary_categories_json ? (() => { try { return JSON.parse(p.secondary_categories_json); } catch(_) { return []; } })() : [])),
              secondary_categories: Array.isArray(p.secondaryCategories)
                ? p.secondaryCategories
                : (Array.isArray(p.secondary_categories)
                  ? p.secondary_categories
                  : (p.secondary_categories_json ? (() => { try { return JSON.parse(p.secondary_categories_json); } catch(_) { return []; } })() : [])),
              subcategories: Array.isArray(p.subcategories)
                ? p.subcategories
                : (p.subcategories_json ? (() => { try { return JSON.parse(p.subcategories_json); } catch(_) { return []; } })() : []),
              size,
              availableSizes,
              thickness,
              finish,
              look,
              surface,
              material,
              origin,
              color,
              availableColors,
              colorImages: cleanColorImages,
              color_images: cleanColorImages,
              colorHexes: cleanColorHexes,
              color_hexes: cleanColorHexes,
              sizeImages: cleanSizeImages,
              spaceImages: cleanSpaceImages,
              space_images: cleanSpaceImages,
              space_images_json: JSON.stringify(cleanSpaceImages),
              combinationImages: p.combinationImages || {},
              combinationProductMappings: Array.isArray(p.combinationProductMappings)
                ? p.combinationProductMappings
                : (Array.isArray(p.combination_product_mappings) ? p.combination_product_mappings : []),
              combination_product_mappings: Array.isArray(p.combinationProductMappings)
                ? p.combinationProductMappings
                : (Array.isArray(p.combination_product_mappings) ? p.combination_product_mappings : []),
              edgeType,
              edge_type: edgeType,
              usage: application,
              application,
              tilePattern: pattern,
              pattern,
              spaces,
              tilesBySpace,
              tiles_by_space: tilesBySpace,
              spaceArea: tilesBySpace,
              kgPerBox,
              kg_per_box: kgPerBox,
              weight: kgPerBox,
              pcsPerBox,
              pcs_per_box: pcsPerBox,
              packingDetails: pcsPerBox,
              sftPerBox,
              sft_per_box: sftPerBox,
              sqftPerBox: sftPerBox,
              shape,
              shapes,
              tilesByShape: shape,
              tiles_by_shape: shape,
              customShape,
              custom_shape: customShape,
              tilesBySize,
              tiles_by_size: tilesBySize,
              tilesBySizeList,
              customTilesBySize,
              custom_tiles_by_size: customTilesBySize,
              images,
              videoUrl: p.videoUrl || p.video_url || "",
              video_url: p.videoUrl || p.video_url || "",
              videoPosition: Math.max(1, parseInt(p.videoPosition !== undefined ? p.videoPosition : p.video_position, 10) || 1),
              video_position: Math.max(1, parseInt(p.videoPosition !== undefined ? p.videoPosition : p.video_position, 10) || 1),
              videoEnabled: Boolean(p.videoEnabled !== undefined ? p.videoEnabled : p.video_enabled),
              video_enabled: Boolean(p.videoEnabled !== undefined ? p.videoEnabled : p.video_enabled),
              isActive,
              is_active: isActive,
              isNewArrival: p.isNewArrival !== undefined ? Boolean(p.isNewArrival) : (p.is_new_arrival !== undefined ? Boolean(p.is_new_arrival) : false),
              is_new_arrival: p.isNewArrival !== undefined ? Boolean(p.isNewArrival) : (p.is_new_arrival !== undefined ? Boolean(p.is_new_arrival) : false),
              showTileOfSpainBadge: p.showTileOfSpainBadge !== undefined ? Boolean(p.showTileOfSpainBadge) : Boolean(p.show_tile_of_spain_badge || false),
              show_tile_of_spain_badge: p.showTileOfSpainBadge !== undefined ? Boolean(p.showTileOfSpainBadge) : Boolean(p.show_tile_of_spain_badge || false),
              status,
              is_trashed: Boolean(p.is_trashed),
              deleted_at: p.deleted_at || null,
              deleted_by: p.deleted_by || null,
              metaTitle,
              meta_title: metaTitle,
              metaDescription,
              meta_description: metaDescription,
              keywords,
            };
          });
          _cachedProducts = parsedProducts;
          _cachedMtime = stat.mtimeMs;
          _lastCacheCheck = now;
          return parsedProducts;
        }
      }
    } catch (e) {
      console.warn("Could not read store.json in getStoredProducts:", e);
    }

    try {
      const fs = eval("require")("fs");
      const path = eval("require")("path");
      const fallbackPath = path.resolve(process.cwd(), "server/data/corrected_products.json");
      if (fs.existsSync(fallbackPath)) {
        const content = fs.readFileSync(fallbackPath, "utf8");
        const list = JSON.parse(content);
        if (Array.isArray(list) && list.length > 0) {
          return list;
        }
      }
    } catch (_) {}
  }
  return MOCK_PRODUCTS;
}

export async function getProducts(filters?: ProductFilterInput): Promise<any[]> {
  const catalog = getStoredProducts();
  let result = catalog.filter((p) => {
    if (!filters?.includeTrashed && (p.is_trashed || p.isTrashed)) return false;
    if (filters?.includeInactive) return true;
    return p.isActive !== false && p.is_active !== false && p.status !== "Inactive";
  });

  if (filters) {
    if (filters.search) {
      result = result.filter((p) => matchProductSearch(p, filters.search!));
    }
    if (filters.category) {
      const cat = filters.category.toLowerCase().trim();
      result = result.filter((p) => matchesProductCategory(p, cat));
    }
    if (filters.collection) {
      const col = filters.collection.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.collectionId?.toLowerCase().includes(col) ||
          p.collection_id?.toLowerCase().includes(col) ||
          p.collection?.toLowerCase().includes(col) ||
          p.collection_name?.toLowerCase().includes(col) ||
          p.look?.toLowerCase().includes(col)
      );
    }
    if (filters.finish) {
      const f = (filters.finish.toLowerCase() === "matte" ? "matt" : filters.finish.toLowerCase()).trim();
      result = result.filter((p) => {
        const pf = (p.finish || "").toLowerCase();
        return pf.includes(f) || (f === "matt" && pf.includes("matte"));
      });
    }
    if (filters.look) {
      const l = filters.look.toLowerCase().trim();
      result = result.filter((p) => p.look?.toLowerCase().includes(l));
    }
    if (filters.material) {
      const m = filters.material.toLowerCase().trim();
      result = result.filter((p) => p.material?.toLowerCase().includes(m));
    }
    if (filters.color) {
      const target = filters.color.replace(/-color$/, "").toLowerCase().trim();
      result = result.filter((p) => {
        const pColor = (p.color || "").toLowerCase().trim();
        const availColors: string[] = Array.isArray(p.availableColors)
          ? (p.availableColors as unknown[]).map((c) => String(c).toLowerCase().trim())
          : [];

        const matchesTarget = (colorStr: string): boolean => {
          if (!colorStr) return false;
          if (target === "colourful" || target === "colorful") {
            return colorStr.includes("colour") || colorStr.includes("color");
          }
          if (target === "grey" || target === "gray") {
            return colorStr.includes("grey") || colorStr.includes("gray");
          }
          const cleanStr = colorStr.replace(/-/g, " ").trim();
          const cleanTarget = target.replace(/-/g, " ").trim();
          return cleanStr === cleanTarget || cleanStr.includes(cleanTarget) || cleanTarget.includes(cleanStr);
        };

        return matchesTarget(pColor) || availColors.some((c) => matchesTarget(c));
      });
    }
    if (filters.application) {
      const appFilter = filters.application.toLowerCase().trim();
      result = result.filter((p) => {
        const app = (p.application || p.usage || "").toLowerCase();
        if (!app) return false;
        if (appFilter === "wall") return app.includes("wall");
        if (appFilter === "floor") return app.includes("floor");
        if (appFilter.includes("wall & floor") || appFilter === "wall-floor") {
          return (app.includes("wall") && app.includes("floor")) || app.includes("wall & floor");
        }
        if (appFilter === "exterior") {
          return app.includes("exterior") || app.includes("outdoor") || app.includes("facade");
        }
        return app.includes(appFilter);
      });
    }
    if (filters.size) {
      const s = filters.size.toLowerCase().trim();
      result = result.filter((p) => p.size?.toLowerCase().includes(s));
    }
    if (filters.thickness) {
      const t = filters.thickness.toLowerCase().trim();
      result = result.filter((p) => p.thickness?.toLowerCase().includes(t));
    }
    if (filters.room) {
      const r = filters.room.toLowerCase().trim();
      result = result.filter((p) => (p.usage || p.application)?.toLowerCase().includes(r));
    }
    if (filters.isNewArrival !== undefined) {
      result = result.filter((p) => Boolean(p.isNewArrival || p.is_new_arrival) === filters.isNewArrival);
    }
    if (filters.tag) {
      const t = filters.tag.toLowerCase().trim();
      if (t === "new-arrival" || t === "new_arrival") {
        result = result.filter((p) => p.isNewArrival || p.is_new_arrival);
      }
    }
  }

  return result;
}

export async function getProductBySlug(slug: string, includeInactive = false): Promise<any | null> {
  const norm = (slug || "").toString().toLowerCase().trim();
  if (!norm) return null;

  const catalog = getStoredProducts();
  let prod = catalog.find(
    (p) =>
      p.slug?.toLowerCase().trim() === norm ||
      p.code?.toLowerCase().trim() === norm ||
      p.id?.toLowerCase().trim() === norm ||
      p.sku?.toLowerCase().trim() === norm
  );

  if (!prod) {
    prod = MOCK_PRODUCTS.find(
      (p) =>
        p.slug?.toLowerCase().trim() === norm ||
        p.code?.toLowerCase().trim() === norm ||
        p.id?.toLowerCase().trim() === norm ||
        p.sku?.toLowerCase().trim() === norm
    );
  }

  if (!prod) return null;
  if (prod.is_trashed || prod.isTrashed) return null;
  if (!includeInactive && (prod.isActive === false || prod.is_active === false || prod.status === "Inactive")) {
    return null;
  }
  return prod;
}

export async function getProductByCode(code: string, includeInactive = false): Promise<any | null> {
  const norm = (code || "").toString().toLowerCase().trim();
  if (!norm) return null;

  const catalog = getStoredProducts();
  let prod = catalog.find(
    (p) =>
      p.code?.toLowerCase().trim() === norm ||
      p.slug?.toLowerCase().trim() === norm ||
      p.id?.toLowerCase().trim() === norm
  );

  if (!prod) {
    prod = MOCK_PRODUCTS.find(
      (p) =>
        p.code?.toLowerCase().trim() === norm ||
        p.slug?.toLowerCase().trim() === norm ||
        p.id?.toLowerCase().trim() === norm
    );
  }

  if (!prod) return null;
  if (prod.is_trashed || prod.isTrashed) return null;
  if (!includeInactive && (prod.isActive === false || prod.is_active === false || prod.status === "Inactive")) {
    return null;
  }
  return prod;
}


