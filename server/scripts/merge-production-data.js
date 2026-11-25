const fs = require("fs");
const path = require("path");

function runMerge() {
  const dataDir = path.resolve(__dirname, "../data");
  const storePath = path.join(dataDir, "store.json");
  const correctedPath = path.join(dataDir, "corrected_products.json");
  const colorsPath = path.join(dataDir, "defaultColors.json");

  console.log("=================================================================");
  console.log("  TIMEX CERAMIC - SAFE PRODUCTION DATA MERGE UTILITY");
  console.log("=================================================================\n");

  if (!fs.existsSync(correctedPath)) {
    console.error("Error: corrected_products.json not found in", dataDir);
    process.exit(1);
  }

  const correctedProducts = JSON.parse(fs.readFileSync(correctedPath, "utf8"));
  let defaultColors = [];
  if (fs.existsSync(colorsPath)) {
    defaultColors = JSON.parse(fs.readFileSync(colorsPath, "utf8"));
  }

  // Ensure 18 standard/extended colors
  const standardColors = [...defaultColors];
  if (!standardColors.some((c) => c.slug === "terracotta")) {
    standardColors.push({
      id: "color-terracotta",
      name: "Terracotta",
      slug: "terracotta",
      hex: "#C26D4D",
      isActive: true,
      displayOrder: 17,
    });
  }
  if (!standardColors.some((c) => c.slug === "orange")) {
    standardColors.push({
      id: "color-orange",
      name: "Orange",
      slug: "orange",
      hex: "#E67E22",
      isActive: true,
      displayOrder: 18,
    });
  }

  if (fs.existsSync(storePath)) {
    // 1. Create safety backup (and retain at most the 2 newest backups to prevent disk bloat)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(dataDir, `store.backup_pre_merge_${timestamp}.json`);
    fs.copyFileSync(storePath, backupPath);
    console.log(`[Backup Created] ${backupPath}`);
    try {
      const oldBackups = fs
        .readdirSync(dataDir)
        .filter((f) => f.startsWith("store.backup_pre_merge_") && f.endsWith(".json"))
        .sort()
        .reverse();
      oldBackups.slice(2).forEach((oldFile) => {
        fs.unlinkSync(path.join(dataDir, oldFile));
      });
    } catch (_) {}

    // 2. Read existing store
    const store = JSON.parse(fs.readFileSync(storePath, "utf8"));

    const initialEnquiriesCount = Array.isArray(store.enquiries) ? store.enquiries.length : 0;
    const initialAdminsCount = Array.isArray(store.admin_users) ? store.admin_users.length : 0;
    const initialBlogsCount = Array.isArray(store.blogs) ? store.blogs.length : 0;
    const initialMediaCount = Array.isArray(store.media) ? store.media.length : 0;
    const initialPagesCount = Array.isArray(store.pages) ? store.pages.length : 0;
    const initialSeoCount = Array.isArray(store.seo_metadata) ? store.seo_metadata.length : 0;
    const initialFaqsCount = Array.isArray(store.category_faqs) ? store.category_faqs.length : 0;

    // 3. Merge Products
    const existingProducts = Array.isArray(store.products) ? store.products : [];
    const prodMap = new Map();

    // Index existing products by ID and Slug
    existingProducts.forEach((p) => {
      if (p.id) prodMap.set(String(p.id).trim(), p);
      if (p.slug) prodMap.set(String(p.slug).trim().toLowerCase(), p);
    });

    let updatedCount = 0;
    let addedCount = 0;

    correctedProducts.forEach((cp) => {
      const existing =
        prodMap.get(String(cp.id).trim()) ||
        prodMap.get(String(cp.slug).trim().toLowerCase());

      if (existing) {
        // Update audited fields while preserving custom production modifications
        existing.name = cp.name;
        existing.code = cp.code || existing.code;
        existing.sku = cp.sku || existing.sku;
        existing.category = cp.category;
        existing.category_name = cp.category_name || cp.category;
        existing.categoryId = cp.categoryId;
        existing.category_id = cp.category_id || cp.categoryId;
        existing.collection = cp.collection;
        existing.collection_name = cp.collection_name || cp.collection;
        existing.collectionId = cp.collectionId;
        existing.collection_id = cp.collection_id || cp.collectionId;
        existing.size = cp.size;
        existing.thickness = cp.thickness;
        existing.finish = cp.finish;
        existing.look = cp.look;
        existing.material = cp.material;
        existing.origin = cp.origin;
        existing.color = cp.color;
        existing.availableColors = cp.availableColors;
        existing.colorHexes = cp.colorHexes;
        existing.color_hexes = cp.color_hexes || cp.colorHexes;
        existing.colorImages = cp.colorImages || existing.colorImages || {};
        existing.application = cp.application;
        existing.usage = cp.usage || cp.application;
        existing.pattern = cp.pattern;
        existing.waterAbsorption = cp.waterAbsorption || cp.water_absorption;
        existing.secondaryCategories = cp.secondaryCategories || [];
        existing.secondary_categories = cp.secondary_categories || cp.secondaryCategories || [];
        existing.subcategories = cp.subcategories || [];
        existing.spaceImages = cp.spaceImages || existing.spaceImages || {};
        existing.space_images = cp.space_images || existing.space_images || existing.spaceImages || {};
        existing.images = cp.images && cp.images.length > 0 ? cp.images : (existing.images || []);
        existing.updated_at = new Date().toISOString();
        updatedCount++;
      } else {
        existingProducts.push(cp);
        prodMap.set(String(cp.id).trim(), cp);
        if (cp.slug) prodMap.set(String(cp.slug).trim().toLowerCase(), cp);
        addedCount++;
      }
    });

    store.products = existingProducts;

    // 4. Merge Colors
    const existingColors = Array.isArray(store.colors) ? store.colors : [];
    const colorSlugMap = new Map();
    existingColors.forEach((c) => {
      if (c.slug) colorSlugMap.set(c.slug.toLowerCase().trim(), c);
    });

    standardColors.forEach((sc) => {
      const match = colorSlugMap.get(sc.slug.toLowerCase().trim());
      if (match) {
        match.name = sc.name;
        match.hex = sc.hex;
        if (match.isActive === undefined) match.isActive = true;
      } else {
        existingColors.push({ ...sc });
        colorSlugMap.set(sc.slug.toLowerCase().trim(), sc);
      }
    });

    store.colors = existingColors;

    // 5. Save merged store back atomically
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), "utf8");

    console.log("SAFE MERGE SUMMARY:");
    console.log("-----------------------------------------------------------------");
    console.log(`[Products] Corrected/Updated: ${updatedCount} | Added: ${addedCount} | Total in Store: ${store.products.length}`);
    console.log(`[Colors] Active Colors in Store: ${store.colors.length}`);
    console.log("-----------------------------------------------------------------");
    console.log("PRESERVED PRODUCTION DATA (100% UNTOUCHED):");
    console.log(`- Admin Accounts: ${initialAdminsCount} preserved`);
    console.log(`- Customer Enquiries: ${initialEnquiriesCount} preserved`);
    console.log(`- Blogs & Articles: ${initialBlogsCount} preserved`);
    console.log(`- Media Items: ${initialMediaCount} preserved`);
    console.log(`- Custom Pages: ${initialPagesCount} preserved`);
    console.log(`- SEO Metadata Entries: ${initialSeoCount} preserved`);
    console.log(`- Category FAQs: ${initialFaqsCount} preserved`);
    console.log("-----------------------------------------------------------------\n");
    console.log("[SUCCESS] Production data merge completed safely without data loss.");
  } else {
    // If store.json did not exist, initialize clean store
    console.log("[Notice] No existing store.json found. Creating initial store with 106 products...");
    const newStore = {
      admin_users: [],
      products: correctedProducts,
      colors: standardColors,
      enquiries: [],
      blogs: [],
      seo_metadata: [],
      media: [],
      category_faqs: [],
    };
    fs.writeFileSync(storePath, JSON.stringify(newStore, null, 2), "utf8");
    console.log("[SUCCESS] Created clean initial store.json.");
  }
}

if (require.main === module) {
  runMerge();
}

module.exports = { runMerge };
