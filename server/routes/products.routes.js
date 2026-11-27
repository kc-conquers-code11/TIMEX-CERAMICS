const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { getPool, isMysqlConnected, loadFallbackStore, saveFallbackStore } = require("../config/db");
const { safeDeleteMediaFile, formatCatalogueUrl } = require("../utils/mediaHelper");
const { isSpecUnspecified, cleanSpecValue, isValidSpec } = require("../utils/productSpecs");

// Helper to generate a clean URL slug from product name
function slugify(text) {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Robust boolean converter for request bodies, database rows (0/1), and form payloads
function toBoolean(val, fallback = false) {
  if (val === undefined || val === null) return fallback;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") {
    const s = val.trim().toLowerCase();
    if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
    if (s === "false" || s === "0" || s === "no" || s === "off" || s === "") return false;
  }
  return Boolean(val);
}

// Generate unique slug
function getUniqueSlug(baseSlug, existingProducts = [], currentId = null) {
  const cleanBase = slugify(baseSlug || "tile-surface");
  let candidate = cleanBase;
  let counter = 1;
  while (existingProducts.some((p) => p.slug === candidate && p.id !== currentId)) {
    candidate = `${cleanBase}-${counter}`;
    counter++;
  }
  return candidate;
}

// Helper to strictly clean collection names from "Timex Premium", "Timex Royal", etc.
function cleanCollectionTitle(raw, catName) {
  if (!raw || typeof raw !== "string") {
    if (catName) {
      let cleanCat = catName.replace(/\s+Look$/i, "").replace(/\s+Tiles$/i, "").trim();
      return cleanCat + " Collection";
    }
    return "Porcelain Collection";
  }
  let clean = raw.trim();
  clean = clean.replace(/^(timex\s+)+(premium\s+|royal\s+)?/i, "");
  clean = clean.replace(/^(premium\s+|royal\s+)/i, "");
  if (/^collection$/i.test(clean) || clean === "") {
    if (catName) {
      let cleanCat = catName.replace(/\s+Look$/i, "").replace(/\s+Tiles$/i, "").trim();
      return cleanCat + " Collection";
    }
    return "Porcelain Collection";
  }
  clean = clean.replace(/\s+(look|series|collection)$/i, "");
  clean = clean.replace(/\s+(look|series|collection)$/i, "");
  clean = clean.trim();
  if (!clean) return "Porcelain Collection";
  clean = clean.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return clean + " Collection";
}

// Normalize and synchronize all product fields (both camelCase and snake_case)
function normalizeProduct(raw = {}, existing = {}, isNew = false) {
  const name = raw.name !== undefined ? raw.name.trim() : (existing.name || "");
  const code = raw.code !== undefined ? raw.code.trim() : (existing.code || `TMX-${Math.floor(100 + Math.random() * 900)}`);
  const sku = raw.sku !== undefined ? raw.sku.trim() : (existing.sku || `TMX-SKU-${code}`);
  const price = raw.price !== undefined ? parseFloat(raw.price) || 0 : (existing.price || 0);

  const b2bPrice = raw.b2b_price !== undefined
    ? parseFloat(raw.b2b_price) || 0
    : (raw.b2bPrice !== undefined ? parseFloat(raw.b2bPrice) || 0 : (existing.b2b_price || existing.b2bPrice || 0));

  const categoryId = raw.category_id || raw.categoryId || existing.category_id || existing.categoryId || "stone";
  const categoryName = raw.category_name || raw.category || existing.category_name || existing.category || "Stone Look";
  const collectionId = raw.collection_id || raw.collectionId || existing.collection_id || existing.collectionId || "coll-stone";
  
  const rawCollection = raw.collection_name || raw.collection || existing.collection_name || existing.collection || "";
  const collectionName = cleanCollectionTitle(rawCollection, categoryName);

  // Secondary categories support (array of strings)
  const secondaryCategories = Array.isArray(raw.secondaryCategories)
    ? raw.secondaryCategories
    : (Array.isArray(raw.secondary_categories)
      ? raw.secondary_categories
      : (raw.secondary_categories_json
        ? (() => { try { return JSON.parse(raw.secondary_categories_json); } catch(_) { return []; } })()
        : (Array.isArray(existing.secondaryCategories)
          ? existing.secondaryCategories
          : (Array.isArray(existing.secondary_categories)
            ? existing.secondary_categories
            : (existing.secondary_categories_json ? (() => { try { return JSON.parse(existing.secondary_categories_json); } catch(_) { return []; } })() : [])))));

  // Subcategories support (array of strings)
  const subcategories = Array.isArray(raw.subcategories)
    ? raw.subcategories.map((s) => (typeof s === "string" ? s.trim() : (s?.name || s?.slug || ""))).filter(Boolean)
    : (Array.isArray(raw.sub_categories)
      ? raw.sub_categories.map((s) => (typeof s === "string" ? s.trim() : (s?.name || s?.slug || ""))).filter(Boolean)
      : (raw.subcategories_json
        ? (() => { try { return JSON.parse(raw.subcategories_json); } catch(_) { return []; } })()
        : (Array.isArray(existing.subcategories)
          ? existing.subcategories.map((s) => (typeof s === "string" ? s.trim() : (s?.name || s?.slug || ""))).filter(Boolean)
          : (existing.subcategories_json ? (() => { try { return JSON.parse(existing.subcategories_json); } catch(_) { return []; } })() : []))));

  // Sanitize all technical specifications: if marked "Not Specified" or empty, return empty string ""
  const size = cleanSpecValue(raw.size !== undefined ? raw.size : existing.size);
  const thickness = cleanSpecValue(raw.thickness !== undefined ? raw.thickness : existing.thickness);
  let finish = cleanSpecValue(raw.finish !== undefined ? raw.finish : existing.finish);
  if (finish && finish.toLowerCase() === "matte") {
    finish = "Matt";
  }
  const look = cleanSpecValue(raw.look !== undefined ? raw.look : existing.look);
  const surface = cleanSpecValue(raw.surface !== undefined ? raw.surface : existing.surface);
  const material = cleanSpecValue(raw.material !== undefined ? raw.material : existing.material);
  const origin = cleanSpecValue(raw.origin !== undefined ? raw.origin : existing.origin);
  const color = cleanSpecValue(raw.color !== undefined ? raw.color : existing.color);

  const edgeType = cleanSpecValue(
    raw.edgeType !== undefined ? raw.edgeType : (
      raw.edge_type !== undefined ? raw.edge_type : (
        existing.edgeType !== undefined ? existing.edgeType : existing.edge_type
      )
    )
  );

  const application = cleanSpecValue(
    raw.application !== undefined ? raw.application : (
      raw.usage !== undefined ? raw.usage : (
        existing.application !== undefined ? existing.application : existing.usage
      )
    )
  );

  const pattern = cleanSpecValue(
    raw.pattern !== undefined ? raw.pattern : (
      raw.tilePattern !== undefined ? raw.tilePattern : (
        existing.pattern !== undefined ? existing.pattern : existing.tilePattern
      )
    )
  );

  // Shapes normalization: strictly respect raw.shapes or raw.shape / raw.tilesByShape
  const shapes = Array.isArray(raw.shapes)
    ? raw.shapes.map((s) => String(s).trim()).filter(Boolean)
    : (raw.shape !== undefined || raw.tilesByShape !== undefined || raw.tiles_by_shape !== undefined
      ? cleanSpecValue(raw.shape || raw.tilesByShape || raw.tiles_by_shape).split(",").map((s) => s.trim()).filter(Boolean)
      : (Array.isArray(existing.shapes)
        ? existing.shapes.map((s) => String(s).trim()).filter(Boolean)
        : (existing.shape || existing.tilesByShape || existing.tiles_by_shape
            ? String(existing.shape || existing.tilesByShape || existing.tiles_by_shape).split(",").map((s) => s.trim()).filter(Boolean)
            : [])));

  const shape = cleanSpecValue(
    raw.shape !== undefined ? raw.shape : (
      raw.tilesByShape !== undefined ? raw.tilesByShape : (
        raw.tiles_by_shape !== undefined ? raw.tiles_by_shape : (
          shapes.length > 0 ? shapes.join(", ") : (
            existing.shape !== undefined ? existing.shape : (
              existing.tilesByShape !== undefined ? existing.tilesByShape : (
                existing.tiles_by_shape !== undefined ? existing.tiles_by_shape : ""
              )
            )
          )
        )
      )
    )
  );

  const customShape = cleanSpecValue(
    raw.customShape !== undefined ? raw.customShape : (
      raw.custom_shape !== undefined ? raw.custom_shape : (
        existing.customShape !== undefined ? existing.customShape : existing.custom_shape
      )
    )
  );

  // Tiles By Size normalization: respect raw.tilesBySizeList or raw.tilesBySize / raw.tiles_by_size
  const tilesBySizeList = Array.isArray(raw.tilesBySizeList)
    ? raw.tilesBySizeList.map((s) => String(s).trim()).filter(Boolean)
    : (raw.tilesBySize !== undefined || raw.tiles_by_size !== undefined
      ? cleanSpecValue(raw.tilesBySize || raw.tiles_by_size).split(",").map((s) => s.trim()).filter(Boolean)
      : (Array.isArray(existing.tilesBySizeList)
        ? existing.tilesBySizeList.map((s) => String(s).trim()).filter(Boolean)
        : (existing.tilesBySize || existing.tiles_by_size
          ? String(existing.tilesBySize || existing.tiles_by_size).split(",").map((s) => s.trim()).filter(Boolean)
          : [])));

  const tilesBySize = cleanSpecValue(
    raw.tilesBySize !== undefined ? raw.tilesBySize : (
      raw.tiles_by_size !== undefined ? raw.tiles_by_size : (
        tilesBySizeList.length > 0 ? tilesBySizeList.join(", ") : (
          existing.tilesBySize !== undefined ? existing.tilesBySize : (
            existing.tiles_by_size !== undefined ? existing.tiles_by_size : ""
          )
        )
      )
    )
  );

  const customTilesBySize = cleanSpecValue(
    raw.customTilesBySize !== undefined ? raw.customTilesBySize : (
      raw.custom_tiles_by_size !== undefined ? raw.custom_tiles_by_size : (
        existing.customTilesBySize !== undefined ? existing.customTilesBySize : existing.custom_tiles_by_size
      )
    )
  );

  // Spaces normalization: strictly respect raw.spaces when provided (even if empty [])
  const spaces = Array.isArray(raw.spaces)
    ? raw.spaces.map((s) => String(s).trim()).filter(Boolean)
    : (raw.tilesBySpace !== undefined || raw.tiles_by_space !== undefined || raw.spaceArea !== undefined
      ? cleanSpecValue(raw.tilesBySpace || raw.tiles_by_space || raw.spaceArea).split(",").map((s) => s.trim()).filter(Boolean)
      : (Array.isArray(existing.spaces)
        ? existing.spaces.map((s) => String(s).trim()).filter(Boolean)
        : (existing.tilesBySpace ? String(existing.tilesBySpace).split(",").map((s) => s.trim()).filter(Boolean) : [])));

  const tilesBySpace = spaces.join(", ");

  const kgPerBox = cleanSpecValue(
    raw.kgPerBox !== undefined ? raw.kgPerBox : (
      raw.kg_per_box !== undefined ? raw.kg_per_box : (
        raw.weight !== undefined ? raw.weight : (
          existing.kgPerBox !== undefined ? existing.kgPerBox : (
            existing.kg_per_box !== undefined ? existing.kg_per_box : existing.weight
          )
        )
      )
    )
  );

  const pcsPerBox = cleanSpecValue(
    raw.pcsPerBox !== undefined ? raw.pcsPerBox : (
      raw.pcs_per_box !== undefined ? raw.pcs_per_box : (
        raw.packingDetails !== undefined ? raw.packingDetails : (
          existing.pcsPerBox !== undefined ? existing.pcsPerBox : (
            existing.pcs_per_box !== undefined ? existing.pcs_per_box : existing.packingDetails
          )
        )
      )
    )
  );

  const sftPerBox = cleanSpecValue(
    raw.sftPerBox !== undefined ? raw.sftPerBox : (
      raw.sft_per_box !== undefined ? raw.sft_per_box : (
        raw.sqftPerBox !== undefined ? raw.sqftPerBox : (
          existing.sftPerBox !== undefined ? existing.sftPerBox : (
            existing.sft_per_box !== undefined ? existing.sft_per_box : existing.sqftPerBox
          )
        )
      )
    )
  );

  const isActive = raw.is_active !== undefined
    ? toBoolean(raw.is_active)
    : (raw.isActive !== undefined ? toBoolean(raw.isActive) : (existing.is_active !== undefined ? toBoolean(existing.is_active) : true));

  // Determine if this is a new product creation (when existing has no id)
  const isNewProduct = isNew || (!existing || !existing.id);

  const isNewArrival = raw.isNewArrival !== undefined
    ? toBoolean(raw.isNewArrival)
    : (raw.is_new_arrival !== undefined
        ? toBoolean(raw.is_new_arrival)
        : (existing.isNewArrival !== undefined
            ? toBoolean(existing.isNewArrival)
            : (existing.is_new_arrival !== undefined
                ? toBoolean(existing.is_new_arrival)
                : isNewProduct)));

  const isBestseller = raw.isBestseller !== undefined
    ? toBoolean(raw.isBestseller)
    : (raw.is_bestseller !== undefined
        ? toBoolean(raw.is_bestseller)
        : (existing.isBestseller !== undefined
            ? toBoolean(existing.isBestseller)
            : toBoolean(existing.is_bestseller, false)));

  const showTileOfSpainBadge = raw.showTileOfSpainBadge !== undefined
    ? toBoolean(raw.showTileOfSpainBadge)
    : (raw.show_tile_of_spain_badge !== undefined
        ? toBoolean(raw.show_tile_of_spain_badge)
        : (existing.showTileOfSpainBadge !== undefined
            ? toBoolean(existing.showTileOfSpainBadge)
            : toBoolean(existing.show_tile_of_spain_badge, false)));

  const metaTitle = raw.meta_title || raw.metaTitle || existing.meta_title || existing.metaTitle || `${name} | Timex Ceramic`;
  const metaDescription = raw.meta_description || raw.metaDescription || raw.description || existing.meta_description || existing.metaDescription || existing.description || "";
  const keywords = raw.keywords || existing.keywords || `${name}, ${categoryName}, tiles, timex ceramic`;
  const images = Array.isArray(raw.images) ? raw.images : (Array.isArray(existing.images) ? existing.images : []);

  const availableSizes = Array.isArray(raw.availableSizes)
    ? raw.availableSizes.map((s) => cleanSpecValue(s)).filter(Boolean)
    : (Array.isArray(existing.availableSizes)
        ? existing.availableSizes.map((s) => cleanSpecValue(s)).filter(Boolean)
        : []);

  let availableColors = Array.isArray(raw.availableColors)
    ? raw.availableColors.map((c) => cleanSpecValue(c)).filter(Boolean)
    : (Array.isArray(existing.availableColors)
        ? existing.availableColors.map((c) => cleanSpecValue(c)).filter(Boolean)
        : []);

  if (availableColors.length === 0) {
    if (raw.color) {
      const c = cleanSpecValue(raw.color);
      if (c) availableColors = [c];
    } else if (existing.color) {
      const c = cleanSpecValue(existing.color);
      if (c) availableColors = [c];
    }
  }

  const rawColorImages = raw.colorImages !== undefined ? raw.colorImages : (existing.colorImages || {});
  const colorImages = {};
  if (rawColorImages && typeof rawColorImages === "object") {
    availableColors.forEach((c) => {
      if (rawColorImages[c]) colorImages[c] = rawColorImages[c];
    });
  }

  const rawColorHexes = raw.colorHexes !== undefined ? raw.colorHexes : (raw.color_hexes !== undefined ? raw.color_hexes : (existing.colorHexes || existing.color_hexes || {}));
  const colorHexes = {};
  if (rawColorHexes && typeof rawColorHexes === "object") {
    availableColors.forEach((c) => {
      if (rawColorHexes[c]) colorHexes[c] = rawColorHexes[c];
    });
  }

  const rawSizeImages = raw.sizeImages !== undefined ? raw.sizeImages : (existing.sizeImages || {});
  const sizeImages = {};
  if (rawSizeImages && typeof rawSizeImages === "object") {
    availableSizes.forEach((s) => {
      if (rawSizeImages[s]) sizeImages[s] = rawSizeImages[s];
    });
  }

  const SPACES_LOOKUP = {
    "bathroom-tiles": "Bathroom Tiles",
    "kitchen-tiles": "Kitchen Tiles",
    "living-dining-room-tiles": "Living & Dining Room Tiles",
    "living-and-dining-room-tiles": "Living & Dining Room Tiles",
    "bedroom-tiles": "Bedroom Tiles",
    "balcony-terrace-tiles": "Balcony & Outdoor Tiles",
    "balcony-outdoor-tiles": "Balcony & Outdoor Tiles",
    "balcony-and-outdoor-tiles": "Balcony & Outdoor Tiles",
    "cafe-restaurant-tiles": "Café & Restaurant Tiles",
    "cafe-and-restaurant-tiles": "Café & Restaurant Tiles",
    "commercial-office-tiles": "Commercial & Office Tiles",
    "commercial-and-office-tiles": "Commercial & Office Tiles",
    "elevation-exterior-tiles": "Elevation & Exterior Tiles",
    "elevation-and-exterior-tiles": "Elevation & Exterior Tiles",
    "hotel-hospitality-tiles": "Hotel & Hospitality Tiles",
    "hotel-and-hospitality-tiles": "Hotel & Hospitality Tiles",
    "outdoor-landscape-tiles": "Outdoor & Landscape Tiles",
    "outdoor-and-landscape-tiles": "Outdoor & Landscape Tiles",
    "spa-wellness-tiles": "Spa & Wellness Tiles",
    "spa-and-wellness-tiles": "Spa & Wellness Tiles",
    "swimming-pool-tiles": "Swimming Pool Tiles",
  };

  const CANONICAL_SPACE_SLUGS = {
    "bathroom-tiles": "bathroom-tiles",
    "bathroom tiles": "bathroom-tiles",
    "kitchen-tiles": "kitchen-tiles",
    "kitchen tiles": "kitchen-tiles",
    "living-dining-room-tiles": "living-dining-room-tiles",
    "living-and-dining-room-tiles": "living-dining-room-tiles",
    "living & dining room tiles": "living-dining-room-tiles",
    "bedroom-tiles": "bedroom-tiles",
    "bedroom tiles": "bedroom-tiles",
    "balcony-terrace-tiles": "balcony-terrace-tiles",
    "balcony-and-outdoor-tiles": "balcony-terrace-tiles",
    "balcony & outdoor tiles": "balcony-terrace-tiles",
    "cafe-restaurant-tiles": "cafe-restaurant-tiles",
    "cafe-and-restaurant-tiles": "cafe-restaurant-tiles",
    "café & restaurant tiles": "cafe-restaurant-tiles",
    "commercial-office-tiles": "commercial-office-tiles",
    "commercial-and-office-tiles": "commercial-office-tiles",
    "commercial & office tiles": "commercial-office-tiles",
    "elevation-exterior-tiles": "elevation-exterior-tiles",
    "elevation-and-exterior-tiles": "elevation-exterior-tiles",
    "elevation & exterior tiles": "elevation-exterior-tiles",
    "hotel-hospitality-tiles": "hotel-hospitality-tiles",
    "hotel-and-hospitality-tiles": "hotel-hospitality-tiles",
    "hotel & hospitality tiles": "hotel-hospitality-tiles",
    "outdoor-landscape-tiles": "outdoor-landscape-tiles",
    "outdoor-and-landscape-tiles": "outdoor-landscape-tiles",
    "outdoor & landscape tiles": "outdoor-landscape-tiles",
    "spa-wellness-tiles": "spa-wellness-tiles",
    "spa-and-wellness-tiles": "spa-wellness-tiles",
    "spa & wellness tiles": "spa-wellness-tiles",
    "swimming-pool-tiles": "swimming-pool-tiles",
    "swimming pool tiles": "swimming-pool-tiles",
  };

  // Pick the FIRST space-image source that actually has entries.
  // An empty object (e.g. spaceImages: {}) must NOT shadow a populated space_images_json string.
  const spaceImageCandidates = [
    raw.spaceImages,
    raw.space_images,
    raw.space_images_json,
    existing.spaceImages,
    existing.space_images,
    existing.space_images_json,
  ];
  let rawSpaceImages = {};
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

  const spaceImages = {};
  if (rawSpaceImages && typeof rawSpaceImages === "object") {
    Object.entries(rawSpaceImages).forEach(([k, v]) => {
      if (typeof k === "string" && k.trim() && typeof v === "string" && v.trim()) {
        const trimmedK = k.trim();
        const trimmedV = v.trim();
        spaceImages[trimmedK] = trimmedV;

        const slugK = slugify(trimmedK);
        if (slugK && !spaceImages[slugK]) {
          spaceImages[slugK] = trimmedV;
        }

        const lowerK = trimmedK.toLowerCase();
        if (CANONICAL_SPACE_SLUGS[lowerK] && !spaceImages[CANONICAL_SPACE_SLUGS[lowerK]]) {
          spaceImages[CANONICAL_SPACE_SLUGS[lowerK]] = trimmedV;
        }
        if (CANONICAL_SPACE_SLUGS[slugK] && !spaceImages[CANONICAL_SPACE_SLUGS[slugK]]) {
          spaceImages[CANONICAL_SPACE_SLUGS[slugK]] = trimmedV;
        }

        if (SPACES_LOOKUP[slugK] && !spaceImages[SPACES_LOOKUP[slugK]]) {
          spaceImages[SPACES_LOOKUP[slugK]] = trimmedV;
        }
      }
    });
  }
  const combinationImages = raw.combinationImages || existing.combinationImages || {};
  const rawMappings = raw.combinationProductMappings !== undefined
    ? raw.combinationProductMappings
    : (raw.combination_product_mappings !== undefined
        ? raw.combination_product_mappings
        : (existing.combinationProductMappings || existing.combination_product_mappings || []));

  const combinationProductMappings = Array.isArray(rawMappings)
    ? rawMappings.map((m) => {
        if (!m || typeof m !== "object") return null;
        const size = cleanSpecValue(m.size);
        const color = cleanSpecValue(m.color);
        const image = String(m.image || m.imageUrl || m.assignedProductImage || m.assigned_product_image || "").trim();
        const productId = String(m.productId || m.product_id || m.assignedProductId || existing.id || "").trim();
        if (!size || !color) return null;
        return {
          productId,
          size,
          color,
          image,
          assignedProductImage: image,
        };
      }).filter(Boolean)
    : [];

  if (Array.isArray(combinationProductMappings)) {
    combinationProductMappings.forEach((m) => {
      if (m.size && m.color && m.image) {
        combinationImages[`${m.size}_${m.color}`] = m.image;
      }
    });
  }
  const catalogueMediaId = raw.catalogueMediaId !== undefined ? raw.catalogueMediaId : (raw.catalogue_media_id !== undefined ? raw.catalogue_media_id : (existing.catalogueMediaId || existing.catalogue_media_id || ""));

  const rawCatUrl = raw.catalogueUrl !== undefined
    ? raw.catalogueUrl
    : (raw.catalogue_url !== undefined ? raw.catalogue_url : (raw.catalogue !== undefined ? raw.catalogue : (raw.productPdf !== undefined ? raw.productPdf : (existing.catalogueUrl || existing.catalogue_url || existing.catalogue || existing.productPdf || ""))));
  let catalogueUrl = rawCatUrl && rawCatUrl.toLowerCase() !== "no catalogue" && rawCatUrl.toLowerCase() !== "none" ? rawCatUrl.trim() : "";
  if (catalogueUrl) {
    catalogueUrl = formatCatalogueUrl(catalogueUrl);
  }

  const catalogueName = raw.catalogueName !== undefined
    ? raw.catalogueName.trim()
    : (raw.catalogue_name !== undefined ? raw.catalogue_name.trim() : (existing.catalogueName || existing.catalogue_name || ""));

  const videoUrl = raw.videoUrl !== undefined
    ? String(raw.videoUrl).trim()
    : (raw.video_url !== undefined
        ? String(raw.video_url).trim()
        : (existing.videoUrl || existing.video_url || ""));

  const rawVideoPos = raw.videoPosition !== undefined
    ? raw.videoPosition
    : (raw.video_position !== undefined
        ? raw.video_position
        : (existing.videoPosition !== undefined ? existing.videoPosition : existing.video_position));
  const videoPosition = Math.max(1, parseInt(rawVideoPos, 10) || 1);

  const videoEnabled = raw.videoEnabled !== undefined
    ? Boolean(raw.videoEnabled)
    : (raw.video_enabled !== undefined
        ? Boolean(raw.video_enabled)
        : (existing.videoEnabled !== undefined ? Boolean(existing.videoEnabled) : Boolean(existing.video_enabled || false)));

  return {
    id: raw.id || existing.id,
    slug: raw.slug || existing.slug,
    name,
    code,
    sku,
    barcode: raw.barcode !== undefined ? raw.barcode : (existing.barcode || ""),
    description: raw.description !== undefined ? raw.description : (existing.description || ""),
    price,
    b2b_price: b2bPrice,
    b2bPrice,
    inventory: raw.inventory !== undefined ? parseInt(raw.inventory, 10) || 0 : (existing.inventory || 100),
    category_id: categoryId,
    categoryId,
    category_name: categoryName,
    category: categoryName,
    collection_id: collectionId,
    collectionId,
    collection_name: collectionName,
    collection: collectionName,
    secondaryCategories,
    secondary_categories: secondaryCategories,
    secondary_categories_json: JSON.stringify(secondaryCategories),
    subcategories,
    subcategories_json: JSON.stringify(subcategories),
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
    colorImages,
    colorHexes,
    color_hexes: colorHexes,
    sizeImages,
    spaceImages,
    space_images: spaceImages,
    space_images_json: JSON.stringify(spaceImages),
    combinationImages,
    combinationProductMappings,
    combination_product_mappings: combinationProductMappings,
    edgeType,
    edge_type: edgeType,
    application,
    usage: application,
    pattern,
    tilePattern: pattern,
    tilesBySpace,
    tiles_by_space: tilesBySpace,
    spaceArea: tilesBySpace,
    spaces,
    catalogueMediaId,
    catalogue_media_id: catalogueMediaId,
    catalogue: catalogueUrl,
    catalogueUrl,
    catalogue_url: catalogueUrl,
    catalogueName,
    catalogue_name: catalogueName,
    productPdf: catalogueUrl,
    videoUrl,
    video_url: videoUrl,
    videoPosition,
    video_position: videoPosition,
    videoEnabled,
    video_enabled: videoEnabled,
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
    is_active: isActive,
    isActive,
    isNewArrival,
    is_new_arrival: isNewArrival,
    isBestseller,
    is_bestseller: isBestseller,
    showTileOfSpainBadge,
    show_tile_of_spain_badge: showTileOfSpainBadge,
    is_trashed: raw.is_trashed !== undefined ? Boolean(raw.is_trashed) : Boolean(existing.is_trashed),
    deleted_at: raw.deleted_at !== undefined ? raw.deleted_at : (existing.deleted_at || null),
    deleted_by: raw.deleted_by !== undefined ? raw.deleted_by : (existing.deleted_by || null),
    meta_title: metaTitle,
    metaTitle,
    meta_description: metaDescription,
    metaDescription,
    keywords,
    created_at: existing.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function normalizeCategoryToken(token) {
  if (!token) return "";
  let clean = String(token).toLowerCase().trim();
  clean = clean.replace(/^(cat|coll)-/i, "");
  clean = clean.replace(/\s+(look|finish|tiles|collection|series|pattern)$/i, "").trim();
  if (clean === "colourful") clean = "colorful";
  return clean;
}

function matchesProductCategory(product, targetCategoryOrSlugOrId) {
  if (!product || !targetCategoryOrSlugOrId) return false;
  const rawTarget = String(targetCategoryOrSlugOrId).toLowerCase().trim();
  const cleanTarget = normalizeCategoryToken(rawTarget);
  if (!cleanTarget) return false;

  // 1. Primary Category
  const pCatId = String(product.categoryId || product.category_id || "").toLowerCase().trim();
  const pCatName = String(product.category || product.category_name || "").toLowerCase().trim();
  const cleanCatId = normalizeCategoryToken(pCatId);
  const cleanCatName = normalizeCategoryToken(pCatName);

  if (
    pCatId === rawTarget ||
    cleanCatId === cleanTarget ||
    pCatName === rawTarget ||
    cleanCatName === cleanTarget ||
    cleanCatName.includes(cleanTarget) ||
    cleanTarget.includes(cleanCatName)
  ) {
    return true;
  }

  // 2. Collection
  const pColId = String(product.collectionId || product.collection_id || "").toLowerCase().trim();
  const pColName = String(product.collection || product.collection_name || "").toLowerCase().trim();
  const cleanColId = normalizeCategoryToken(pColId);
  const cleanColName = normalizeCategoryToken(pColName);

  if (
    pColId === rawTarget ||
    cleanColId === cleanTarget ||
    pColName === rawTarget ||
    cleanColName === cleanTarget ||
    cleanColName.includes(cleanTarget) ||
    cleanTarget.includes(cleanColName)
  ) {
    return true;
  }

  // 3. Additional Categories
  let secList = [];
  if (Array.isArray(product.secondaryCategories)) {
    secList.push(...product.secondaryCategories);
  }
  if (Array.isArray(product.secondary_categories)) {
    secList.push(...product.secondary_categories);
  }
  if (typeof product.secondary_categories_json === "string" && product.secondary_categories_json.trim()) {
    try {
      const parsed = JSON.parse(product.secondary_categories_json);
      if (Array.isArray(parsed)) secList.push(...parsed);
    } catch (_) {}
  }

  for (const item of secList) {
    const rawItem = String(item || "").toLowerCase().trim();
    const cleanItem = normalizeCategoryToken(rawItem);
    if (!cleanItem) continue;

    if (
      rawItem === rawTarget ||
      cleanItem === cleanTarget ||
      rawItem === cleanTarget ||
      cleanItem === rawTarget ||
      cleanItem.includes(cleanTarget) ||
      cleanTarget.includes(cleanItem)
    ) {
      return true;
    }
  }

  // 4. Subcategories
  let subList = [];
  if (Array.isArray(product.subcategories)) {
    subList.push(...product.subcategories);
  }
  if (typeof product.subcategories_json === "string" && product.subcategories_json.trim()) {
    try {
      const parsed = JSON.parse(product.subcategories_json);
      if (Array.isArray(parsed)) subList.push(...parsed);
    } catch (_) {}
  }

  for (const sub of subList) {
    const rawSub = String(typeof sub === "string" ? sub : (sub?.name || sub?.slug || "")).toLowerCase().trim();
    const cleanSub = normalizeCategoryToken(rawSub);
    if (!cleanSub) continue;

    if (
      rawSub === rawTarget ||
      cleanSub === cleanTarget ||
      cleanSub.includes(cleanTarget) ||
      cleanTarget.includes(cleanSub)
    ) {
      return true;
    }
  }

  return false;
}

// Expand a MySQL products row: parse every *_json column into its camelCase
// object/array form so normalizeProduct receives complete data.
function expandMysqlProductRow(r) {
  const jsonColumnMap = {
    images_json: "images",
    space_images_json: "spaceImages",
    secondary_categories_json: "secondaryCategories",
    subcategories_json: "subcategories",
    available_colors_json: "availableColors",
    color_hexes_json: "colorHexes",
    available_sizes_json: "availableSizes",
    size_images_json: "sizeImages",
    color_images_json: "colorImages",
    spaces_json: "spaces",
    shapes_json: "shapes",
    tiles_by_size_list_json: "tilesBySizeList",
    combination_images_json: "combinationImages",
    combination_mappings_json: "combinationProductMappings",
  };
  const out = { ...r };
  for (const [col, key] of Object.entries(jsonColumnMap)) {
    if (out[col] === undefined || out[col] === null || out[col] === "") continue;
    try {
      const parsed = JSON.parse(out[col]);
      if (parsed !== null && typeof parsed === "object") out[key] = parsed;
    } catch (_) {}
  }
  return out;
}

// MySQL holds only the original schema columns. The complete product (spaces,
// sizes, color/size images, video, catalogue, trash state, etc.) is mirrored
// into store.json on every admin write. Merge those fields back so API
// consumers receive complete data WITHOUT any schema change.
function isEmptyValue(v) {
  return v === undefined || v === null || v === "" ||
    (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);
}

function buildStoreProductIndex(store) {
  const index = new Map();
  for (const p of store.products || []) {
    if (p.id) index.set(String(p.id).toLowerCase(), p);
    if (p.slug) index.set(String(p.slug).toLowerCase(), p);
    if (p.code) index.set(String(p.code).toLowerCase(), p);
  }
  return index;
}

function mergeStoreProduct(mysqlProduct, storeIndex) {
  if (!storeIndex) return mysqlProduct;
  const twin =
    storeIndex.get(String(mysqlProduct.id || "").toLowerCase()) ||
    storeIndex.get(String(mysqlProduct.slug || "").toLowerCase()) ||
    storeIndex.get(String(mysqlProduct.code || "").toLowerCase());
  if (!twin) return mysqlProduct;

  const merged = { ...mysqlProduct };
  for (const [key, value] of Object.entries(twin)) {
    if (isEmptyValue(merged[key]) && !isEmptyValue(value)) {
      merged[key] = value;
    }
  }
  // Trash state authority is the store (MySQL has no is_trashed column)
  if (twin.is_trashed) merged.is_trashed = true;
  if (twin.is_active === false) merged.is_active = false;
  return merged;
}

// Insert (or upsert) a normalized product into MySQL using the original schema.
// If a row already exists (id/sku/slug/code are UNIQUE), it is refreshed instead
// of failing — used by create, duplicate. Fields without MySQL columns keep
// living in store.json and are merged back on read (see mergeStoreProduct).
const PRODUCT_COLUMNS = [
  "id", "sku", "slug", "name", "code", "barcode", "description", "price", "b2b_price", "inventory",
  "category_id", "category_name", "collection_id", "collection_name", "size", "thickness",
  "finish", "look", "material", "origin", "color", "application", "pattern", "water_absorption",
  "images_json", "space_images_json", "secondary_categories_json", "subcategories_json",
  "available_colors_json", "color_hexes_json",
  "is_active", "is_new_arrival", "is_bestseller", "show_tile_of_spain_badge",
  "meta_title", "meta_description", "keywords",
  "is_trashed", "available_sizes_json", "color_images_json", "size_images_json", "spaces_json",
  "tiles_by_space", "combination_images_json", "combination_product_mappings_json",
  "edge_type", "weight", "kg_per_box", "pcs_per_box", "packing_details", "sft_per_box",
  "shape", "shapes_json", "tiles_by_shape", "custom_shape", "tiles_by_size",
  "catalogue_url", "catalogue_name", "catalogue_media_id", "product_pdf",
  "video_url", "video_position", "video_enabled",
];

function productColumnValues(p) {
  return {
    id: p.id,
    sku: p.sku || `TMX-SKU-${p.code || p.id}`,
    slug: p.slug,
    name: p.name,
    code: p.code || p.slug,
    barcode: p.barcode || null,
    description: p.description || "",
    price: p.price || 0,
    b2b_price: p.b2b_price || p.b2bPrice || 0,
    inventory: p.inventory || 0,
    category_id: p.category_id || p.categoryId || "stone",
    category_name: p.category_name || p.category || "Stone Look",
    collection_id: p.collection_id || p.collectionId || "coll-stone",
    collection_name: p.collection_name || p.collection || "Timex Premium Collection",
    size: p.size || "",
    thickness: p.thickness || "",
    finish: p.finish || "",
    look: p.look || "",
    material: p.material || "",
    origin: p.origin || "",
    color: p.color || "",
    application: p.application || p.usage || "",
    pattern: p.pattern || p.tilePattern || "",
    water_absorption: p.water_absorption || p.waterAbsorption || null,
    images_json: JSON.stringify(p.images || []),
    space_images_json: p.space_images_json || JSON.stringify(p.spaceImages || p.space_images || {}),
    secondary_categories_json: p.secondary_categories_json || JSON.stringify(p.secondaryCategories || p.secondary_categories || []),
    subcategories_json: p.subcategories_json || JSON.stringify(p.subcategories || []),
    available_colors_json: JSON.stringify(p.availableColors || (p.color ? [p.color] : [])),
    color_hexes_json: JSON.stringify(p.colorHexes || p.color_hexes || {}),
    is_active: p.is_active !== false && p.isActive !== false,
    is_new_arrival: Boolean(p.is_new_arrival || p.isNewArrival),
    is_bestseller: Boolean(p.is_bestseller || p.isBestseller),
    show_tile_of_spain_badge: Boolean(p.show_tile_of_spain_badge || p.showTileOfSpainBadge),
    meta_title: p.meta_title || p.metaTitle || `${p.name || ""} | Timex Ceramic`,
    meta_description: p.meta_description || p.metaDescription || p.description || "",
    keywords: p.keywords || "",
    is_trashed: Boolean(p.is_trashed),
    available_sizes_json: JSON.stringify(p.availableSizes || []),
    color_images_json: JSON.stringify(p.colorImages || {}),
    size_images_json: JSON.stringify(p.sizeImages || {}),
    spaces_json: JSON.stringify(p.spaces || []),
    tiles_by_space: p.tilesBySpace || p.tiles_by_space || "",
    combination_images_json: JSON.stringify(p.combinationImages || {}),
    combination_product_mappings_json: JSON.stringify(p.combinationProductMappings || []),
    edge_type: p.edgeType || p.edge_type || "",
    weight: p.weight || "",
    kg_per_box: p.kgPerBox || p.kg_per_box || "",
    pcs_per_box: p.pcsPerBox || p.pcs_per_box || "",
    packing_details: p.packingDetails || p.packing_details || "",
    sft_per_box: p.sftPerBox || p.sft_per_box || "",
    shape: p.shape || "",
    shapes_json: JSON.stringify(p.shapes || []),
    tiles_by_shape: p.tilesByShape || p.tiles_by_shape || "",
    custom_shape: p.customShape || p.custom_shape || "",
    tiles_by_size: p.tilesBySize || p.tiles_by_size || "",
    catalogue_url: p.catalogueUrl || p.catalogue_url || "",
    catalogue_name: p.catalogueName || p.catalogue_name || "",
    catalogue_media_id: p.catalogueMediaId || p.catalogue_media_id || "",
    product_pdf: p.productPdf || p.product_pdf || "",
    video_url: p.videoUrl || p.video_url || "",
    video_position: parseInt(p.videoPosition || p.video_position || 1, 10),
    video_enabled: Boolean(p.videoEnabled || p.video_enabled),
  };
}

async function insertProductRow(pool, p) {
  const valueMap = productColumnValues(p);
  const values = PRODUCT_COLUMNS.map((c) => valueMap[c]);
  const placeholders = PRODUCT_COLUMNS.map(() => "?").join(", ");
  const updateClause = PRODUCT_COLUMNS
    .filter((c) => c !== "id")
    .map((c) => `${c} = VALUES(${c})`)
    .join(", ");

  await pool.query(
    `INSERT INTO products (${PRODUCT_COLUMNS.join(", ")}) VALUES (${placeholders})
     ON DUPLICATE KEY UPDATE ${updateClause}`,
    values
  );
}

// GET /api/v1/products
router.get("/", async (req, res) => {
  const { category, search, activeOnly, includeTrashed, tag, newArrivals, sort } = req.query;
  const allowTrashed = includeTrashed === "true";
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = req.query.limit !== undefined ? Math.max(0, parseInt(req.query.limit)) : 0;

  try {
    if (isMysqlConnected()) {
      const pool = getPool();
      let sql = "SELECT * FROM products WHERE 1=1";
      const params = [];

      if (!allowTrashed) {
        // MySQL products might not have is_trashed column if created before
      }

      if (category && category !== "ALL") {
        const catNorm = normalizeCategoryToken(category);
        sql += ` AND (
          category_id = ? OR category_name = ? OR LOWER(category_id) = ? OR LOWER(category_name) = ?
          OR (secondary_categories_json IS NOT NULL AND (
            secondary_categories_json LIKE ? OR secondary_categories_json LIKE ? OR secondary_categories_json LIKE ?
          ))
        )`;
        const q1 = `%"${category}"%`;
        const q2 = `%"${catNorm}"%`;
        const q3 = `%${catNorm}%`;
        params.push(category, category, catNorm, catNorm, q1, q2, q3);
      }
      if (search) {
        sql += " AND (name LIKE ? OR code LIKE ? OR sku LIKE ? OR description LIKE ? OR category_name LIKE ? OR collection_name LIKE ? OR keywords LIKE ? OR material LIKE ? OR finish LIKE ?)";
        const q = `%${search}%`;
        params.push(q, q, q, q, q, q, q, q, q);
      }
      if (activeOnly === "true") {
        sql += " AND is_active = TRUE";
      }

      sql += " ORDER BY updated_at DESC";

      const [rows] = await pool.query(sql, params);
      const storeIndex = buildStoreProductIndex(loadFallbackStore());
      let parsed = rows.map((r) => {
        const expanded = expandMysqlProductRow(r);
        const norm = normalizeProduct({
          ...expanded,
          availableColors: Array.isArray(expanded.availableColors) && expanded.availableColors.length > 0 ? expanded.availableColors : (r.color ? [r.color] : []),
        });
        return mergeStoreProduct(norm, storeIndex);
      });

      if (!allowTrashed) {
        parsed = parsed.filter((p) => !p.is_trashed);
      }

      if (newArrivals === "true" || tag === "new-arrival" || tag === "new_arrival") {
        parsed = parsed.filter((p) => p.isNewArrival === true || p.is_new_arrival === true);
      }

      const total = parsed.length;
      const totalPages = limit > 0 ? Math.ceil(total / limit) || 1 : 1;
      const paginated = limit > 0 ? parsed.slice((page - 1) * limit, page * limit) : parsed;

      return res.json({
        success: true,
        count: paginated.length,
        total,
        page,
        totalPages,
        limit,
        products: paginated,
      });
    }

    // Fallback store
    const store = loadFallbackStore();
    let result = (store.products || []).map((p) => normalizeProduct(p));

    if (!allowTrashed) {
      result = result.filter((p) => !p.is_trashed);
    }

    if (category && category !== "ALL") {
      result = result.filter((p) => matchesProductCategory(p, category));
    }

    if (search) {
      const q = search.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      result = result.filter((p) => {
        const sec = Array.isArray(p.secondaryCategories)
          ? p.secondaryCategories.join(" ")
          : (Array.isArray(p.secondary_categories) ? p.secondary_categories.join(" ") : "");
        const subs = Array.isArray(p.subcategories)
          ? p.subcategories.map((s) => (typeof s === "string" ? s : (s?.name || s?.slug || ""))).join(" ")
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

        if (searchableText.includes(q)) return true;
        if (tokens.length === 0) return true;
        return tokens.every((token) => searchableText.includes(token));
      });
    }

    if (activeOnly === "true") {
      result = result.filter((p) => p.is_active !== false);
    }

    if (newArrivals === "true" || tag === "new-arrival" || tag === "new_arrival") {
      result = result.filter((p) => p.isNewArrival === true || p.is_new_arrival === true);
    }

    // Sort options if requested
    if (sort === "name_asc") {
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "name_desc") {
      result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    } else if (sort === "oldest") {
      result.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
    }

    const total = result.length;
    const totalPages = limit > 0 ? Math.ceil(total / limit) || 1 : 1;
    const paginated = limit > 0 ? result.slice((page - 1) * limit, page * limit) : result;

    return res.json({
      success: true,
      count: paginated.length,
      total,
      page,
      totalPages,
      limit,
      products: paginated,
    });
  } catch (err) {
    console.error("Fetch products error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/products/bulk-tags and POST /api/v1/products/tags/bulk-sync
// Bulk synchronize product tags across multiple products simultaneously
router.post(["/bulk-tags", "/tags/bulk-sync"], async (req, res) => {
  const { tag, productIds = [] } = req.body;
  if (!tag) {
    return res.status(400).json({ success: false, error: "Tag identifier is required." });
  }

  const rawTag = String(tag).trim();
  const isSpainTag =
    rawTag === "TILE_OF_SPAIN" ||
    rawTag === "showTileOfSpainBadge" ||
    rawTag === "show_tile_of_spain_badge" ||
    rawTag.toLowerCase().includes("spain");

  const isNewArrivalTag =
    rawTag === "NEW" ||
    rawTag === "NEW_ARRIVAL" ||
    rawTag === "isNewArrival" ||
    rawTag === "is_new_arrival" ||
    rawTag.toLowerCase().includes("arrival");

  if (!isSpainTag && !isNewArrivalTag) {
    return res.status(400).json({
      success: false,
      error: `Unsupported tag: "${tag}". Supported tags: "NEW_ARRIVAL", "TILE_OF_SPAIN"`,
    });
  }

  const targetIdSet = new Set((Array.isArray(productIds) ? productIds : []).map((id) => String(id).trim()));

  try {
    const store = loadFallbackStore();
    const existingProducts = store.products || [];

    // 1. Update fallback store products
    existingProducts.forEach((p) => {
      const isSelected =
        targetIdSet.has(String(p.id)) ||
        targetIdSet.has(String(p.slug)) ||
        targetIdSet.has(String(p.code)) ||
        targetIdSet.has(String(p.sku));

      if (isSpainTag) {
        p.showTileOfSpainBadge = isSelected;
        p.show_tile_of_spain_badge = isSelected;
      } else if (isNewArrivalTag) {
        p.isNewArrival = isSelected;
        p.is_new_arrival = isSelected;
      }
      p.updated_at = new Date().toISOString();
    });

    store.products = existingProducts;
    saveFallbackStore(store);

    // 2. Update MySQL if connected
    if (isMysqlConnected()) {
      const pool = getPool();
      const colName = isSpainTag ? "show_tile_of_spain_badge" : "is_new_arrival";
      const idArray = Array.from(targetIdSet);

      if (idArray.length > 0) {
        await pool.query(
          `UPDATE products SET ${colName} = CASE WHEN id IN (?) OR slug IN (?) OR code IN (?) THEN TRUE ELSE FALSE END`,
          [idArray, idArray, idArray]
        );
      } else {
        await pool.query(`UPDATE products SET ${colName} = FALSE`);
      }
    }

    const assignedCount = existingProducts.filter((p) =>
      isSpainTag ? Boolean(p.showTileOfSpainBadge || p.show_tile_of_spain_badge) : Boolean(p.isNewArrival || p.is_new_arrival)
    ).length;

    return res.json({
      success: true,
      tag: isSpainTag ? "TILE_OF_SPAIN" : "NEW_ARRIVAL",
      assignedCount,
      totalProducts: existingProducts.length,
      message: `Successfully synchronized ${assignedCount} products for ${isSpainTag ? "Tile of Spain" : "New Arrival"}.`,
    });
  } catch (err) {
    console.error("Bulk tags error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/v1/products/:idOrSlug
router.get("/:idOrSlug", async (req, res) => {
  const { idOrSlug } = req.params;
  const lookup = (idOrSlug || "").toLowerCase().trim();
  const allowTrashed = req.query.includeTrashed === "true";

  try {
    if (isMysqlConnected()) {
      const pool = getPool();
      const [rows] = await pool.query(
        "SELECT * FROM products WHERE LOWER(id) = ? OR LOWER(slug) = ? OR LOWER(code) = ? OR LOWER(sku) = ? LIMIT 1",
        [lookup, lookup, lookup, lookup]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: "Product not found." });
      }
      const prod = rows[0];
      const expanded = expandMysqlProductRow(prod);
      const norm = normalizeProduct({
        ...expanded,
        availableColors: Array.isArray(expanded.availableColors) && expanded.availableColors.length > 0 ? expanded.availableColors : (prod.color ? [prod.color] : []),
      });
      const normalized = mergeStoreProduct(norm, buildStoreProductIndex(loadFallbackStore()));
      if (normalized.is_trashed && !allowTrashed) {
        return res.status(404).json({ success: false, error: "Product not found." });
      }
      return res.json({ success: true, product: normalized });
    }

    const store = loadFallbackStore();
    const prod = (store.products || []).find(
      (p) =>
        p.id?.toLowerCase().trim() === lookup ||
        p.slug?.toLowerCase().trim() === lookup ||
        p.code?.toLowerCase().trim() === lookup ||
        p.sku?.toLowerCase().trim() === lookup
    );
    if (!prod) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }
    const normalized = normalizeProduct(prod);
    if (normalized.is_trashed && !allowTrashed) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }
    return res.json({ success: true, product: normalized });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/products
router.post("/", async (req, res) => {
  const data = req.body;

  if (!data.name || !data.name.trim()) {
    return res.status(400).json({ success: false, error: "Product name is required." });
  }

  const id = data.id || `prod-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const store = loadFallbackStore();
  const existingProducts = store.products || [];

  const rawSlug = data.slug ? slugify(data.slug) : slugify(data.name);
  const slug = getUniqueSlug(rawSlug, existingProducts, id);

  const newProduct = normalizeProduct(
    {
      ...data,
      id,
      slug,
      isNewArrival: data.isNewArrival !== undefined ? Boolean(data.isNewArrival) : true,
      isBestseller: data.isBestseller !== undefined ? Boolean(data.isBestseller) : false,
      showTileOfSpainBadge: data.showTileOfSpainBadge !== undefined ? Boolean(data.showTileOfSpainBadge) : Boolean(data.show_tile_of_spain_badge || false),
    },
    {},
    true
  );

  try {
    if (isMysqlConnected()) {
      const pool = getPool();
      await insertProductRow(pool, newProduct);
    }

    // Always update fallback store so Next.js server components can read instantly
    store.products = [newProduct, ...existingProducts.filter((p) => p.id !== id)];

    // Sync to store.seo_metadata
    if (!Array.isArray(store.seo_metadata)) {
      store.seo_metadata = [];
    }
    const prodPagePath = `/product/${newProduct.slug}`;
    const seoIdx = store.seo_metadata.findIndex((s) => s.page_path === prodPagePath);
    const seoRecord = {
      id: seoIdx >= 0 ? store.seo_metadata[seoIdx].id : `seo-prod-${newProduct.id}`,
      page_path: prodPagePath,
      content_type: "product",
      content_id: newProduct.id,
      title: newProduct.name,
      meta_title: newProduct.meta_title || newProduct.metaTitle || `${newProduct.name} | Timex Ceramic`,
      seo_title: newProduct.meta_title || newProduct.metaTitle || `${newProduct.name} | Timex Ceramic`,
      meta_description: newProduct.meta_description || newProduct.metaDescription || newProduct.description || "",
      focus_keyword: newProduct.keywords ? newProduct.keywords.split(',')[0].trim() : "",
      canonical_url: `https://www.timexceramic.com${prodPagePath}`,
      robots_index: newProduct.is_active !== false && newProduct.isActive !== false,
      robots_follow: true,
      og_title: newProduct.meta_title || newProduct.metaTitle || newProduct.name,
      og_description: newProduct.meta_description || newProduct.metaDescription || newProduct.description || "",
      og_image: Array.isArray(newProduct.images) && newProduct.images.length > 0 ? newProduct.images[0] : "",
      updated_at: new Date().toISOString(),
    };
    if (seoIdx >= 0) {
      store.seo_metadata[seoIdx] = { ...store.seo_metadata[seoIdx], ...seoRecord };
    } else {
      store.seo_metadata.push(seoRecord);
    }

    saveFallbackStore(store);

    return res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error("Create product error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/v1/products/:id
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const store = loadFallbackStore();
    const existingProducts = store.products || [];
    let idx = existingProducts.findIndex((p) => p.id === id || p.slug === id || p.code === id);
    let current = idx !== -1 ? existingProducts[idx] : null;

    if (!current && isMysqlConnected()) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          "SELECT * FROM products WHERE id = ? OR slug = ? OR code = ? LIMIT 1",
          [id, id, id]
        );
        if (rows.length > 0) {
          const r = rows[0];
          const safeJson = (val, fallback) => {
            if (!val) return fallback;
            if (typeof val === "object") return val;
            try { return JSON.parse(val); } catch (_) { return fallback; }
          };
          const imgs = safeJson(r.images_json, []);
          const spImgs = safeJson(r.space_images_json, {});
          const colImgs = safeJson(r.color_images_json, {});
          const colHexes = safeJson(r.color_hexes_json, {});
          const szImgs = safeJson(r.size_images_json, {});
          const comboImgs = safeJson(r.combination_images_json, {});
          const comboMaps = safeJson(r.combination_product_mappings_json, []);
          const availCols = safeJson(r.available_colors_json, []);
          const availSizes = safeJson(r.available_sizes_json, []);
          const spacesArr = safeJson(r.spaces_json, []);
          const sizeList = safeJson(r.tiles_by_size_list_json, []);
          const secCats = safeJson(r.secondary_categories_json, []);
          const subCats = safeJson(r.subcategories_json, []);
          current = normalizeProduct({
            ...r,
            images: imgs,
            spaceImages: spImgs,
            space_images: spImgs,
            colorImages: colImgs,
            colorHexes: colHexes,
            color_hexes: colHexes,
            sizeImages: szImgs,
            combinationImages: comboImgs,
            combinationProductMappings: comboMaps,
            availableColors: availCols,
            availableSizes: availSizes,
            spaces: spacesArr,
            tilesBySizeList: sizeList,
            secondaryCategories: secCats,
            secondary_categories: secCats,
            subcategories: subCats,
          });
        }
      } catch (_) {}
    }

    if (!current) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }

    // Determine slug
    let targetSlug = current.slug;
    if (updates.slug && updates.slug.trim()) {
      targetSlug = getUniqueSlug(updates.slug, existingProducts, current.id);
    } else if (updates.name && updates.name.trim() !== current.name) {
      // If name changed and slug was previously auto-derived, update slug
      const oldAuto = slugify(current.name);
      if (current.slug === oldAuto) {
        targetSlug = getUniqueSlug(updates.name, existingProducts, current.id);
      }
    }

    const updated = normalizeProduct(
      {
        ...updates,
        id: current.id,
        slug: targetSlug,
      },
      current
    );

    if (isMysqlConnected()) {
      const pool = getPool();
      await insertProductRow(pool, updated);
    }

    // Always update fallback store
    if (idx !== -1) {
      existingProducts[idx] = updated;
    } else {
      existingProducts.unshift(updated);
    }
    store.products = existingProducts;

    // Sync to store.seo_metadata
    if (!Array.isArray(store.seo_metadata)) {
      store.seo_metadata = [];
    }
    const prodPagePath = `/product/${updated.slug}`;
    const seoIdx = store.seo_metadata.findIndex((s) => s.page_path === prodPagePath || (current.slug && s.page_path === `/product/${current.slug}`));
    const seoRecord = {
      id: seoIdx >= 0 ? store.seo_metadata[seoIdx].id : `seo-prod-${updated.id}`,
      page_path: prodPagePath,
      content_type: "product",
      content_id: updated.id,
      title: updated.name,
      meta_title: updated.meta_title || updated.metaTitle || `${updated.name} | Timex Ceramic`,
      seo_title: updated.meta_title || updated.metaTitle || `${updated.name} | Timex Ceramic`,
      meta_description: updated.meta_description || updated.metaDescription || updated.description || "",
      focus_keyword: updated.keywords ? updated.keywords.split(',')[0].trim() : "",
      canonical_url: `https://www.timexceramic.com${prodPagePath}`,
      robots_index: updated.is_active !== false && updated.isActive !== false,
      robots_follow: true,
      og_title: updated.meta_title || updated.metaTitle || updated.name,
      og_description: updated.meta_description || updated.metaDescription || updated.description || "",
      og_image: Array.isArray(updated.images) && updated.images.length > 0 ? updated.images[0] : "",
      updated_at: new Date().toISOString(),
    };
    if (seoIdx >= 0) {
      store.seo_metadata[seoIdx] = { ...store.seo_metadata[seoIdx], ...seoRecord };
    } else {
      store.seo_metadata.push(seoRecord);
    }

    saveFallbackStore(store);

    return res.json({ success: true, product: updated });
  } catch (err) {
    console.error("Update product error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/products/:id (SOFT DELETE -> Recycle Bin)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const store = loadFallbackStore();
    const existingProducts = store.products || [];
    let idx = existingProducts.findIndex((p) => p.id === id || p.slug === id || p.code === id);
    let current = idx !== -1 ? existingProducts[idx] : null;

    if (!current && isMysqlConnected()) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          "SELECT * FROM products WHERE id = ? OR slug = ? OR code = ? LIMIT 1",
          [id, id, id]
        );
        if (rows.length > 0) {
          const r = rows[0];
          const safeJson = (val, fallback) => {
            if (!val) return fallback;
            if (typeof val === "object") return val;
            try { return JSON.parse(val); } catch (_) { return fallback; }
          };
          const imgs = safeJson(r.images_json, []);
          const spImgs = safeJson(r.space_images_json, {});
          const colImgs = safeJson(r.color_images_json, {});
          const colHexes = safeJson(r.color_hexes_json, {});
          const szImgs = safeJson(r.size_images_json, {});
          const comboImgs = safeJson(r.combination_images_json, {});
          const comboMaps = safeJson(r.combination_product_mappings_json, []);
          const availCols = safeJson(r.available_colors_json, []);
          const availSizes = safeJson(r.available_sizes_json, []);
          const spacesArr = safeJson(r.spaces_json, []);
          const sizeList = safeJson(r.tiles_by_size_list_json, []);
          const secCats = safeJson(r.secondary_categories_json, []);
          const subCats = safeJson(r.subcategories_json, []);
          current = normalizeProduct({
            ...r,
            images: imgs,
            spaceImages: spImgs,
            space_images: spImgs,
            colorImages: colImgs,
            colorHexes: colHexes,
            color_hexes: colHexes,
            sizeImages: szImgs,
            combinationImages: comboImgs,
            combinationProductMappings: comboMaps,
            availableColors: availCols,
            availableSizes: availSizes,
            spaces: spacesArr,
            tilesBySizeList: sizeList,
            secondaryCategories: secCats,
            secondary_categories: secCats,
            subcategories: subCats,
          });
        }
      } catch (_) {}
    }

    if (!current) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }
    current.is_trashed = true;
    current.is_active = false;
    current.deleted_at = new Date().toISOString();
    current.deleted_by = req.body?.deletedBy || "admin";

    if (isMysqlConnected()) {
      try {
        const pool = getPool();
        await pool.query(
          "UPDATE products SET is_trashed = TRUE, is_active = FALSE WHERE id = ? OR slug = ? OR code = ?",
          [current.id, current.slug, current.code]
        );
      } catch (dbErr) {
        console.warn("[Database] Could not flag product as trashed in MySQL:", dbErr.message);
      }
    }

    // Handle attached images safely:
    // If an image is ONLY used by this deleted product, flag it as trashed in store.media.
    // If used by other products or blogs or pages, keep it active!
    const affectedImages = [];
    if (Array.isArray(current.images) && Array.isArray(store.media)) {
      current.images.forEach((imgUrl) => {
        const otherProducts = existingProducts.filter((p) => p.id !== current.id && !p.is_trashed);
        const otherBlogs = (store.blogs || []).filter((b) => !b.is_trashed);

        const usedByOtherProduct = otherProducts.some((p) => Array.isArray(p.images) && p.images.includes(imgUrl));
        const usedByBlog = otherBlogs.some((b) => b.coverImage === imgUrl);

        if (!usedByOtherProduct && !usedByBlog) {
          const m = store.media.find((item) => item.url === imgUrl);
          if (m) {
            m.is_trashed = true;
            m.deleted_at = current.deleted_at;
            m.deleted_by = current.deleted_by;
            affectedImages.push(m.filename);
          }
        }
      });
    }

    saveFallbackStore(store);

    return res.json({
      success: true,
      message: `Product "${current.name}" moved to Recycle Bin.`,
      product: current,
      trashedMediaFiles: affectedImages,
    });
  } catch (err) {
    console.error("Delete product error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/products/:id/duplicate (CLONE a product with all specifications, images, and details)
router.post("/:id/duplicate", async (req, res) => {
  const { id } = req.params;
  try {
    const store = loadFallbackStore();
    const existingProducts = store.products || [];
    let source = existingProducts.find((p) => p.id === id || p.slug === id || p.code === id);

    // In MySQL mode the source may live only in the database
    if (!source && isMysqlConnected()) {
      try {
        const pool = getPool();
        const [rows] = await pool.query(
          "SELECT * FROM products WHERE id = ? OR slug = ? OR code = ? LIMIT 1",
          [id, id, id]
        );
        if (rows.length > 0) {
          source = normalizeProduct(expandMysqlProductRow(rows[0]));
        }
      } catch (_) {}
    }

    if (!source) {
      return res.status(404).json({ success: false, error: "Product not found." });
    }

    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(3).toString("hex");
    const newId = `prod-${timestamp}-${randomHex}`;
    const newName = `${source.name} (Copy)`;
    const rawSlug = slugify(`${source.slug}-copy-${randomHex.slice(0, 4)}`);
    const newSlug = getUniqueSlug(rawSlug, existingProducts, newId);
    const newCode = `TMX-${Math.floor(100 + Math.random() * 900)}`;

    const duplicatedProduct = normalizeProduct(
      {
        ...JSON.parse(JSON.stringify(source)),
        id: newId,
        name: newName,
        slug: newSlug,
        code: newCode,
        sku: `TMX-SKU-${newCode}`,
        barcode: `890${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        isActive: true,
        is_trashed: false,
        deleted_at: null,
        deleted_by: null,
      },
      {},
      true
    );

    existingProducts.unshift(duplicatedProduct);

    // Insert the duplicate into MySQL as well
    if (isMysqlConnected()) {
      try {
        const pool = getPool();
        await insertProductRow(pool, duplicatedProduct);
      } catch (_) {}
    }

    saveFallbackStore(store);

    return res.status(201).json({
      success: true,
      message: `Product "${source.name}" duplicated successfully.`,
      product: duplicatedProduct,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/v1/products/:id/restore (RESTORE from Recycle Bin)
router.post("/:id/restore", async (req, res) => {
  const { id } = req.params;

  try {
    const store = loadFallbackStore();
    const existingProducts = store.products || [];
    const idx = existingProducts.findIndex((p) => p.id === id || p.slug === id || p.code === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Product not found in Recycle Bin." });
    }

    const current = existingProducts[idx];
    current.is_trashed = false;
    current.is_active = true;
    current.deleted_at = null;
    current.deleted_by = null;
    // Note: no MySQL trash columns; the row was never flagged in MySQL.

    // Restore any attached media that were trashed for this product
    if (Array.isArray(current.images) && Array.isArray(store.media)) {
      store.media.forEach((m) => {
        if (m.is_trashed && current.images.includes(m.url)) {
          m.is_trashed = false;
          m.deleted_at = null;
          m.deleted_by = null;
        }
      });
    }

    saveFallbackStore(store);

    return res.json({
      success: true,
      message: `Product "${current.name}" restored to catalogue.`,
      product: current,
    });
  } catch (err) {
    console.error("Restore product error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/v1/products/:id/permanent (PERMANENT DELETE)
router.delete("/:id/permanent", async (req, res) => {
  const { id } = req.params;

  try {
    const store = loadFallbackStore();
    const existingProducts = store.products || [];
    const idx = existingProducts.findIndex((p) => p.id === id || p.slug === id || p.code === id);

    if (idx === -1) {
      return res.status(404).json({ success: false, error: "Product not found in Recycle Bin." });
    }

    const current = existingProducts[idx];
    const currentImages = Array.isArray(current.images) ? [...current.images] : [];

    // Remove product record
    existingProducts.splice(idx, 1);
    store.products = existingProducts;

    // Remove the MySQL row as well
    if (isMysqlConnected()) {
      try {
        const pool = getPool();
        await pool.query(
          "DELETE FROM products WHERE id = ? OR slug = ? OR code = ?",
          [current.id, current.slug, current.code]
        );
      } catch (_) {}
    }

    // Clean up unshared media files
    const cleanedFiles = [];
    for (const imgUrl of currentImages) {
      const otherProducts = existingProducts.filter((p) => !p.is_trashed);
      const otherBlogs = (store.blogs || []).filter((b) => !b.is_trashed);
      const isShared = otherProducts.some((p) => Array.isArray(p.images) && p.images.includes(imgUrl)) ||
                       otherBlogs.some((b) => b.coverImage === imgUrl);

      if (!isShared && Array.isArray(store.media)) {
        const mIdx = store.media.findIndex((m) => m.url === imgUrl);
        if (mIdx !== -1) {
          const mediaItem = store.media[mIdx];
          safeDeleteMediaFile(mediaItem, store);
          store.media.splice(mIdx, 1);
          cleanedFiles.push(mediaItem.filename);
        }
      }
    }

    saveFallbackStore(store);

    return res.json({
      success: true,
      message: `Product "${current.name}" permanently deleted.`,
      cleanedMediaFiles: cleanedFiles,
    });
  } catch (err) {
    console.error("Permanent delete product error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
module.exports.normalizeProduct = normalizeProduct;
module.exports.insertProductRow = insertProductRow;
module.exports.expandMysqlProductRow = expandMysqlProductRow;
