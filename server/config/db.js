const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.production") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

let pool = null;
let isMysqlConnected = false;

// Fallback JSON persistence directory
const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.VERCEL ||
  process.env.LAMBDA_TASK_ROOT
);

let bundledStoreJson = null;
try {
  bundledStoreJson = require("../data/store.json");
} catch (e1) {
  try {
    bundledStoreJson = require("../../server/data/store.json");
  } catch (e2) {
    try {
      bundledStoreJson = require("./store.json");
    } catch (e3) {}
  }
}

const DATA_DIR = isServerless ? "/tmp/data" : path.resolve(__dirname, "../data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

function findBundledStoreFile() {
  const candidates = [
    path.resolve(__dirname, "../data/store.json"),
    path.resolve(process.cwd(), "server/data/store.json"),
    path.resolve(__dirname, "../../server/data/store.json"),
    "/var/task/server/data/store.json",
  ];
  for (const c of candidates) {
    try {
      if (fs.existsSync(c)) return c;
    } catch {}
  }
  return null;
}

const BUNDLED_STORE_FILE = findBundledStoreFile();

function ensureStoreReady() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (isServerless && !fs.existsSync(STORE_FILE)) {
      const src = findBundledStoreFile();
      if (src) {
        fs.copyFileSync(src, STORE_FILE);
      } else if (bundledStoreJson) {
        fs.writeFileSync(STORE_FILE, JSON.stringify(bundledStoreJson, null, 2), "utf8");
      }
    }

    // NOTE: One-time data merge (server/scripts/merge-production-data.js) must be run
    // manually via CLI when needed — never automatically on module load, because
    // PM2 cluster workers and Next.js processes repeatedly loading db.js would create
    // unbounded store.backup_pre_merge_*.json files and overwrite runtime store data.
  } catch (err) {
    console.warn("[Database] Could not prepare store directory:", err.message);
  }
}

ensureStoreReady();

function getDefaultSeoSettings() {
  return {
    id: "seo-settings-main",
    site_name: "Timex Ceramic",
    site_url: "https://www.timexceramic.com",
    default_title_template: "%s | Timex Ceramic",
    default_meta_description: "Experience luxury surfaces with Timex Ceramic. Explore premium floor tiles, vitrified slabs, bathware, and interactive visualizers for luxury spaces.",
    default_og_image: "https://www.timexceramic.com/images/og-image.jpg",
    default_robots_index: true,
    default_robots_follow: true,
    robots_txt_content: `# Timex Ceramic Robots.txt Exclusion Standard
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /customer-dashboard
Disallow: /_next/

Sitemap: https://www.timexceramic.com/sitemap.xml
`,
    sitemap_config: {
      include_pages: true,
      include_posts: true,
      include_products: true,
      include_categories: true,
      include_images: true,
      last_generated: new Date().toISOString(),
    },
    organization_data: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": "https://www.timexceramic.com/#organization",
      "name": "Timex Ceramic",
      "url": "https://www.timexceramic.com/",
      "logo": "https://www.timexceramic.com/wp-content/uploads/2023/07/Timex-Ceramic-Logo.png",
      "email": "smm@ambestmedia.com",
      "telephone": "+91-22-26122960",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "402, Pratik Avenue, Opp. Shiv Sagar Rest., Nehru Road, Vile Parle (E)",
        "addressLocality": "Mumbai",
        "addressRegion": "Maharashtra",
        "postalCode": "400057",
        "addressCountry": "IN"
      }
    },
    verification_codes: {
      google: "google-site-verification-timex-sample",
      bing: "",
      pinterest: "",
    },
    social_links: {
      facebook: "https://facebook.com/timexceramic",
      instagram: "https://instagram.com/timexceramic",
      linkedin: "https://linkedin.com/company/timexceramic",
      twitter: "https://twitter.com/timexceramic",
      youtube: "https://youtube.com/@timexceramic",
    },
    updated_at: new Date().toISOString(),
  };
}

function getDefaultHtaccessContent() {
  return `# ==============================================================================
# TIMEX CERAMIC - PRODUCTION APACHE / CPANEL CONFIGURATION (.htaccess)
# ==============================================================================
# Note: When hosted on Netlify, routing is controlled by netlify.toml & _redirects.
# This file applies when hosting on Apache 2.4+ / LiteSpeed web servers.
# ==============================================================================

# 1. Enable Rewrite Engine & Force HTTPS
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Redirect HTTP to HTTPS
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

  # Remove trailing slashes (except directories)
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^(.*)/$ /$1 [L,R=301]

  # Clean URLs: Serve .html files without extension
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{DOCUMENT_ROOT}/$1.html -f
  RewriteRule ^([^/]+)/?$ $1.html [L]

  # SPA Fallback: Route unknown requests to index.html
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>

# 2. Browser Caching & Performance
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 month"

  # HTML
  ExpiresByType text/html "access plus 0 seconds"

  # CSS & JavaScript
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"

  # Images & Media
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/x-icon "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# 3. Gzip / Deflate Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css
  AddOutputFilterByType DEFLATE application/javascript application/json application/xml
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# 4. Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
  Header set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>

# 5. Disable Directory Browsing
Options -Indexes
`;
}

function getDefaultLlmsTxtContent() {
  return `# Timex Ceramic

> Luxury Architectural Surfaces, Vitrified Tiles & Porcelain Slabs

Timex Ceramic is a premier manufacturer and exporter of luxury vitrified tiles, large-format porcelain slabs, and architectural ceramic surfaces based in India. Engineered for high-end residential, commercial, and hospitality projects worldwide.

## Core Products & Collections

- [Harlem Series](/product/harlem-series): Authentic brick-look vitrified wall and floor tiles with glossy industrial glaze (150x450mm).
- [Calacatta Marble Luxe](/product/timex-calacatta-marble-luxe): Luxurious Italian Statuario & Calacatta gold porcelain slab replication (800x1600mm).
- [Brick Collection](/product-category/brick): Timeless rustic and industrial brick wall surfaces.
- [Stone Collection](/product-category/stone): Earthy cleft, travertine, and quarry stone textures.
- [Wooden Collection](/product-category/wooden): Natural hardwood grain vitrified planks.
- [Mosaic Collection](/product-category/mosaic): Precision geometric mosaic decorative tiles.
- [Subway Collection](/product-category/subway): Classic beveled and flat subway wall tiles.
- [All Products Catalog](/products): Complete filterable catalog of vitrified tiles, mosaic, subway, and terrazzo surfaces.

## Architectural Tools & Resources

- [AI 3D Room Visualiser](/visualiser): Interactive 3D visualization tool for living rooms, bathrooms, kitchens, and commercial lobbies.
- [Tile Calculator](/calculator): Precision box, square-meter, and adhesive requirement calculator.
- [Custom PDF Catalogue Maker](/catalogue-maker): Curate tailored product specifications into branded client presentations.
- [Architect Portal](/architect-portal): Technical specifications, CAD/BIM downloads, and commercial procurement for specifiers.
- [Dealer Portal](/dealer-portal): Authorized distributor onboarding and stockist resources.
- [Technical Downloads](/downloads): Download product catalogs, test reports, and compliance certificates.

## Company & Journal

- [About Timex Ceramic](/about): Heritage, manufacturing technology, sustainable production, and export credentials.
- [Design Journal & Blog](/blogs): Curated architectural trends, tile laying patterns, and interior design guides.
- [Projects Gallery](/projects): Case studies across luxury villas, corporate towers, and boutique hotels.
- [Contact & Experience Centre](/contact): Experience centers, factory contact details, and trade inquiries.

## Contact & Business Details

- Head Office: 402, Pratik Avenue, Opp. Shiv Sagar Rest., Nehru Road, Vile Parle (E), Mumbai 400057, Maharashtra, India.
- Phone: +91-22-26122960 / Toll-Free: 1800-22-84639
- Email: smm@ambestmedia.com / info@timexceramic.com
- Website: https://www.timexceramic.com
`;
}

function getDefaultCustomCode() {
  return {
    enabled: true,
    head_code: `<!-- Google Verification & Metadata -->\n<meta name="robots" content="max-image-preview:large" />\n<!-- Custom Head Analytics Script (Sample) -->\n<script>\n  // Google Tag Manager / Analytics bootstrap placeholder\n  window.dataLayer = window.dataLayer || [];\n</script>`,
    body_start_code: `<!-- Body Start: e.g. GTM Noscript Fallback -->\n<noscript>\n  <!-- <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXX" height="0" width="0" style="display:none;visibility:hidden"></iframe> -->\n</noscript>`,
    body_end_code: `<!-- Body End: e.g. Live Chat Widget or Tracking Pixels -->\n<script>\n  // Live chat or conversion pixel initialization\n</script>`,
    updated_at: new Date().toISOString(),
  };
}

// Initial seed data for fallback store
function getInitialStore() {
  if (bundledStoreJson && Array.isArray(bundledStoreJson.products) && bundledStoreJson.products.length > 0) {
    return JSON.parse(JSON.stringify(bundledStoreJson));
  }
  return {
    admin_users: [],
    products: [],
    seo_metadata: [
      {
        id: "seo-home",
        page_path: "/",
        content_type: "page",
        title: "Home - Timex Ceramic Luxury Surfaces",
        meta_title: "Timex Ceramic | International Premium Tiles & Ceramics",
        meta_description: "Experience luxury surfaces with Timex Ceramic. Explore premium floor tiles, vitrified slabs, bathware, and interactive visualizers for luxury spaces.",
        focus_keyword: "premium tiles",
        secondary_keywords: "luxury ceramics, vitrified tiles, italian tiles, bathroom tiles, living room slabs",
        canonical_url: "https://www.timexceramic.com",
        robots_index: true,
        robots_follow: true,
        og_title: "Timex Ceramic | International Premium Tiles & Ceramics",
        og_description: "Experience luxury surfaces with Timex Ceramic. Explore premium floor tiles, vitrified slabs, bathware, and interactive visualizers for luxury spaces.",
        og_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_title: "Timex Ceramic | Premium Surfaces",
        twitter_description: "Redefining premium spaces with international quality ceramic tiles.",
        twitter_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_card: "summary_large_image",
        schema_type: "Organization",
        schema_data: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Timex Ceramic",
          "url": "https://www.timexceramic.com"
        }, null, 2),
        seo_score: 92,
        updated_at: new Date().toISOString(),
      },
      {
        id: "seo-products",
        page_path: "/products",
        content_type: "page",
        title: "Product Catalog - All Tiles & Slabs",
        meta_title: "Explore All Ceramic & Vitrified Tiles | Timex Ceramic",
        meta_description: "Browse 500+ architectural tile surfaces across 19 categories: Stone Look, Subway, Moroccan, Wooden Plank, Terrazzo, and more.",
        focus_keyword: "vitrified tiles",
        secondary_keywords: "tile catalogue, porcelain slabs, architectural surfaces, tile shop",
        canonical_url: "https://www.timexceramic.com/products",
        robots_index: true,
        robots_follow: true,
        og_title: "Explore All Ceramic & Vitrified Tiles | Timex Ceramic",
        og_description: "Browse 500+ architectural tile surfaces across 19 categories.",
        og_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_title: "Explore All Ceramic & Vitrified Tiles | Timex Ceramic",
        twitter_description: "Browse 500+ architectural tile surfaces across 19 categories.",
        twitter_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_card: "summary_large_image",
        schema_type: "WebPage",
        schema_data: "",
        seo_score: 88,
        updated_at: new Date().toISOString(),
      },
      {
        id: "seo-collections",
        page_path: "/collections",
        content_type: "page",
        title: "Curated Design Collections",
        meta_title: "Curated Tile Collections | Timex Ceramic",
        meta_description: "Explore our curated design collections inspired by Italian artistry and engineered with zero-porosity durability.",
        focus_keyword: "tile collections",
        secondary_keywords: "luxury slab lookbook, italian marble porcelain",
        canonical_url: "https://www.timexceramic.com/collections",
        robots_index: true,
        robots_follow: true,
        og_title: "Curated Tile Collections | Timex Ceramic",
        og_description: "Explore our curated design collections inspired by Italian artistry.",
        og_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_title: "Curated Tile Collections | Timex Ceramic",
        twitter_description: "Explore our curated design collections inspired by Italian artistry.",
        twitter_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_card: "summary_large_image",
        schema_type: "WebPage",
        schema_data: "",
        seo_score: 85,
        updated_at: new Date().toISOString(),
      },
      {
        id: "seo-visualiser",
        page_path: "/visualiser",
        content_type: "page",
        title: "3D Virtual Room Visualizer",
        meta_title: "AI 3D Room Visualiser | Timex Ceramic",
        meta_description: "Experience virtual reality tile placement. Test stone, wooden, and luxury Moroccan accent tiles directly inside 3D architectures.",
        focus_keyword: "tile visualiser",
        secondary_keywords: "3D room designer, virtual tile preview",
        canonical_url: "https://www.timexceramic.com/visualiser",
        robots_index: true,
        robots_follow: true,
        og_title: "AI 3D Room Visualiser | Timex Ceramic",
        og_description: "Experience virtual reality tile placement in 3D architectures.",
        og_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_title: "AI 3D Room Visualiser | Timex Ceramic",
        twitter_description: "Experience virtual reality tile placement in 3D architectures.",
        twitter_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_card: "summary_large_image",
        schema_type: "WebPage",
        schema_data: "",
        seo_score: 86,
        updated_at: new Date().toISOString(),
      },
      {
        id: "seo-contact",
        page_path: "/contact",
        content_type: "page",
        title: "Contact Timex Ceramic & Experience Centre",
        meta_title: "Contact Us & Store Locator | Timex Ceramic",
        meta_description: "Connect with Timex Ceramic relationship managers, request trade pricing quotes, or visit our Mumbai Experience Centre.",
        focus_keyword: "contact timex",
        secondary_keywords: "tile dealer contact, mumbai experience centre",
        canonical_url: "https://www.timexceramic.com/contact",
        robots_index: true,
        robots_follow: true,
        og_title: "Contact Us & Store Locator | Timex Ceramic",
        og_description: "Connect with Timex Ceramic relationship managers or visit our Mumbai Experience Centre.",
        og_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_title: "Contact Us & Store Locator | Timex Ceramic",
        twitter_description: "Connect with Timex Ceramic relationship managers.",
        twitter_image: "https://www.timexceramic.com/images/og-image.jpg",
        twitter_card: "summary_large_image",
        schema_type: "LocalBusiness",
        schema_data: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          "name": "Timex Ceramic Mumbai Experience Centre",
          "address": "Vile Parle (E), Mumbai",
          "telephone": "+91-22-26122960"
        }, null, 2),
        seo_score: 90,
        updated_at: new Date().toISOString(),
      },
    ],
    seo_redirects: [
      {
        id: "redir-1",
        source_url: "/tiles",
        destination_url: "/products",
        redirect_type: 301,
        is_active: true,
        hit_count: 14,
        created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "redir-2",
        source_url: "/showroom",
        destination_url: "/contact",
        redirect_type: 301,
        is_active: true,
        hit_count: 8,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    seo_404_logs: [
      {
        id: "log-404-1",
        url: "/catalogue-2024.pdf",
        referrer: "https://google.com",
        user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        hit_count: 5,
        last_detected: new Date(Date.now() - 3600000 * 4).toISOString(),
        resolved_to: "/downloads",
      },
      {
        id: "log-404-2",
        url: "/old-blog/marble-vs-vitrified",
        referrer: "Direct",
        user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        hit_count: 12,
        last_detected: new Date(Date.now() - 3600000 * 1).toISOString(),
        resolved_to: null,
      },
    ],
    seo_settings: getDefaultSeoSettings(),
    enquiries: [
      {
        id: "inq-sample-1",
        type: "QUOTE_REQUEST",
        name: "Arjun Singhania",
        email: "arjun@singhaniagroup.com",
        phone: "+91 98200 12345",
        company: "Singhania Luxury Living",
        message: "Need quote for 2500 sq ft 1200x2400mm Statuario porcelain slabs for South Mumbai penthouse.",
        status: "PENDING",
        page_source: "Sticky CTA Panel",
        details_json: JSON.stringify({ city: "Mumbai", projectType: "Residential Villa / Apartment" }),
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        id: "inq-sample-2",
        type: "VISIT_REQUEST",
        name: "Pooja Malhotra",
        email: "pooja.architects@gmail.com",
        phone: "+91 98110 54321",
        company: "Malhotra & Associates Architects",
        message: "Requesting slot to visit Mumbai Experience Centre with client for tile selection.",
        status: "IN_PROGRESS",
        page_source: "Sticky CTA Panel",
        details_json: JSON.stringify({ preferredDate: "2026-09-12", city: "Mumbai" }),
        created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: "inq-sample-3",
        type: "PRODUCT_ENQUIRY",
        name: "Vikram Rathore",
        email: "vrathore@hotelgroup.in",
        phone: "+91 98760 98765",
        company: "Heritage Royal Resorts",
        message: "Interested in bulk order of Subway Royal B2 tiles for 40 guest bathroom suites.",
        status: "RESOLVED",
        page_source: "Product Detail Page",
        details_json: JSON.stringify({ productCode: "TMX-202", productName: "Timex Subway Royal B2" }),
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    ],
    colors: (() => {
      try {
        return require("../data/defaultColors.json");
      } catch (_) {
        return [];
      }
    })(),
  };
}

let _cachedStore = null;
let _cachedStoreMtime = 0;
let _lastStoreCheck = 0;

function invalidateStoreCache() {
  _cachedStore = null;
  _cachedStoreMtime = 0;
  _lastStoreCheck = 0;
}

function loadFallbackStore() {
  ensureStoreReady();
  const fileToRead = fs.existsSync(STORE_FILE)
    ? STORE_FILE
    : (fs.existsSync(BUNDLED_STORE_FILE) ? BUNDLED_STORE_FILE : null);

  if (!fileToRead) {
    const initial = getInitialStore();
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
    } catch {}
    _cachedStore = initial;
    return initial;
  }

  const now = Date.now();
  // Return in-memory cached store if checked within last 2000ms
  if (_cachedStore && now - _lastStoreCheck < 2000) {
    return _cachedStore;
  }
  _lastStoreCheck = now;

  try {
    const stat = fs.statSync(fileToRead);
    if (_cachedStore && stat.mtimeMs === _cachedStoreMtime) {
      return _cachedStore;
    }
    _cachedStoreMtime = stat.mtimeMs;
  } catch (_) {}

  try {
    const content = fs.readFileSync(fileToRead, "utf8");
    const data = JSON.parse(content);
    let mutated = false;
    if (!data.products || !Array.isArray(data.products) || data.products.length === 0) {
      if (bundledStoreJson && Array.isArray(bundledStoreJson.products) && bundledStoreJson.products.length > 0) {
        data.products = JSON.parse(JSON.stringify(bundledStoreJson.products));
        mutated = true;
      }
    }
    if (!data.blogs || !Array.isArray(data.blogs) || data.blogs.length === 0) {
      if (bundledStoreJson && Array.isArray(bundledStoreJson.blogs) && bundledStoreJson.blogs.length > 0) {
        data.blogs = JSON.parse(JSON.stringify(bundledStoreJson.blogs));
        mutated = true;
      }
    }
    if (!data.seo_metadata || !Array.isArray(data.seo_metadata)) {
      data.seo_metadata = getInitialStore().seo_metadata;
      mutated = true;
    }
    if (!data.seo_redirects || !Array.isArray(data.seo_redirects)) {
      data.seo_redirects = getInitialStore().seo_redirects;
      mutated = true;
    }
    if (!data.seo_404_logs || !Array.isArray(data.seo_404_logs)) {
      data.seo_404_logs = getInitialStore().seo_404_logs;
      mutated = true;
    }
    if (!data.seo_settings || typeof data.seo_settings !== "object") {
      data.seo_settings = getDefaultSeoSettings();
      mutated = true;
    }
    if (!data.htaccess_content || typeof data.htaccess_content !== "string") {
      data.htaccess_content = getDefaultHtaccessContent();
      mutated = true;
    }
    if (!data.htaccess_backups || !Array.isArray(data.htaccess_backups)) {
      data.htaccess_backups = [];
      mutated = true;
    }
    if (!data.llms_txt_content || typeof data.llms_txt_content !== "string") {
      data.llms_txt_content = getDefaultLlmsTxtContent();
      mutated = true;
    }
    if (!data.llms_txt_backups || !Array.isArray(data.llms_txt_backups)) {
      data.llms_txt_backups = [];
      mutated = true;
    }
    if (!data.custom_code || typeof data.custom_code !== "object") {
      data.custom_code = getDefaultCustomCode();
      mutated = true;
    }
    if (!data.custom_code_backups || !Array.isArray(data.custom_code_backups)) {
      data.custom_code_backups = [];
      mutated = true;
    }
    if (!data.colors || !Array.isArray(data.colors) || data.colors.length === 0) {
      try {
        const defaultColors = require("../data/defaultColors.json");
        data.colors = JSON.parse(JSON.stringify(defaultColors));
        mutated = true;
      } catch (_) {}
    }
    if (mutated) {
      try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf8");
        _cachedStoreMtime = fs.statSync(STORE_FILE).mtimeMs;
      } catch {}
    }
    _cachedStore = data;
    return data;
  } catch (err) {
    console.error("Error reading store.json, resetting to initial:", err);
    const initial = getInitialStore();
    try {
      fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), "utf8");
    } catch {}
    _cachedStore = initial;
    return initial;
  }
}

function saveFallbackStore(store) {
  try {
    ensureStoreReady();
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
    _cachedStore = store;
    try {
      _cachedStoreMtime = fs.statSync(STORE_FILE).mtimeMs;
      _lastStoreCheck = Date.now();
    } catch {}
  } catch (err) {
    console.error("Could not write store.json in saveFallbackStore:", err.message);
  }
}

// Attempt to initialize MySQL pool and schema
async function initDb() {
  let host = process.env.MYSQL_HOST || process.env.DB_HOST || "localhost";
  let user = process.env.MYSQL_USER || process.env.DB_USER || "root";
  let password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || "";
  let database = process.env.MYSQL_DATABASE || process.env.DB_NAME || "timex_ceramic";
  let port = parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || "3306", 10);
  let ssl = undefined;

  // Support standard DATABASE_URL format (e.g. mysql://user:pass@host:port/database)
  if (process.env.DATABASE_URL) {
    try {
      const parsed = new URL(process.env.DATABASE_URL);
      host = parsed.hostname;
      port = parseInt(parsed.port || "3306", 10);
      user = decodeURIComponent(parsed.username);
      password = decodeURIComponent(parsed.password);
      database = parsed.pathname.replace(/^\//, "");
      if (parsed.searchParams.has("ssl") || parsed.searchParams.get("sslmode") === "require" || process.env.MYSQL_SSL === "true") {
        ssl = { rejectUnauthorized: false };
      }
    } catch (e) {
      console.warn("Could not parse DATABASE_URL:", e.message);
    }
  } else if (process.env.MYSQL_SSL === "true") {
    ssl = { rejectUnauthorized: false };
  }

  try {
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      ssl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 4000,
      multipleStatements: true,
    });

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isMysqlConnected = true;
    console.log(`[Database] MySQL connected successfully to ${database}@${host}:${port}`);

    // Auto-initialize tables and seed if database is new
    await initSchemaAndSeed(pool);
  } catch (err) {
    isMysqlConnected = false;
    console.warn(`[Database] MySQL connection offline (${err.message}). Using resilient local storage.`);
  }
}

async function initSchemaAndSeed(dbPool) {
  try {
    // 1. Admin Users
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'ADMIN',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Products
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        sku VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(100) NOT NULL UNIQUE,
        barcode VARCHAR(100) NULL,
        description TEXT NULL,
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        b2b_price DECIMAL(10,2) NULL DEFAULT 0.00,
        inventory INT NOT NULL DEFAULT 0,
        category_id VARCHAR(100) NOT NULL,
        category_name VARCHAR(100) NULL,
        collection_id VARCHAR(100) NULL,
        collection_name VARCHAR(100) NULL,
        size VARCHAR(100) NULL,
        thickness VARCHAR(100) NULL,
        finish VARCHAR(100) NULL,
        look VARCHAR(100) NULL,
        material VARCHAR(100) NULL,
        origin VARCHAR(100) NULL DEFAULT 'Imported',
        color VARCHAR(100) NULL,
        application VARCHAR(255) NULL,
        pattern VARCHAR(100) NULL,
        water_absorption VARCHAR(100) NULL,
        images_json LONGTEXT NULL,
        space_images_json LONGTEXT NULL,
        secondary_categories_json LONGTEXT NULL,
        subcategories_json LONGTEXT NULL,
        available_colors_json LONGTEXT NULL,
        color_hexes_json LONGTEXT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_new_arrival BOOLEAN NOT NULL DEFAULT TRUE,
        is_bestseller BOOLEAN NOT NULL DEFAULT FALSE,
        show_tile_of_spain_badge BOOLEAN NOT NULL DEFAULT FALSE,
        meta_title VARCHAR(255) NULL,
        meta_description TEXT NULL,
        keywords TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category_id),
        INDEX idx_slug (slug),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Blogs
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS blogs (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        slug VARCHAR(255) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        subtitle TEXT NULL,
        category VARCHAR(100) NOT NULL DEFAULT 'DESIGN TIPS',
        author_name VARCHAR(100) NULL,
        author_role VARCHAR(100) NULL,
        author_avatar VARCHAR(500) NULL,
        cover_image VARCHAR(500) NULL,
        excerpt TEXT NULL,
        content_json LONGTEXT NULL,
        tags_json TEXT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Published',
        read_time VARCHAR(50) NULL DEFAULT '5 Min Read',
        meta_title VARCHAR(255) NULL,
        meta_description TEXT NULL,
        keywords TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. SEO Metadata
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS seo_metadata (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        page_path VARCHAR(255) NOT NULL UNIQUE,
        content_type VARCHAR(50) NOT NULL DEFAULT 'page',
        title VARCHAR(255) NULL,
        meta_title VARCHAR(255) NOT NULL,
        meta_description TEXT NULL,
        focus_keyword VARCHAR(255) NULL,
        secondary_keywords TEXT NULL,
        canonical_url VARCHAR(255) NULL,
        robots_index BOOLEAN NOT NULL DEFAULT TRUE,
        robots_follow BOOLEAN NOT NULL DEFAULT TRUE,
        og_title VARCHAR(255) NULL,
        og_description TEXT NULL,
        og_image VARCHAR(500) NULL,
        twitter_title VARCHAR(255) NULL,
        twitter_description TEXT NULL,
        twitter_image VARCHAR(500) NULL,
        twitter_card VARCHAR(50) NOT NULL DEFAULT 'summary_large_image',
        schema_type VARCHAR(100) NULL,
        schema_data LONGTEXT NULL,
        seo_score INT NOT NULL DEFAULT 70,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_page_path (page_path),
        INDEX idx_content_type (content_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. SEO Redirects
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS seo_redirects (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        source_url VARCHAR(255) NOT NULL UNIQUE,
        destination_url VARCHAR(255) NOT NULL,
        redirect_type INT NOT NULL DEFAULT 301,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        hit_count INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_source_url (source_url),
        INDEX idx_redirect_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Enquiries
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        type VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        company VARCHAR(150) NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        page_source VARCHAR(255) NULL,
        details_json LONGTEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS category_faqs (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        category_id VARCHAR(100) NOT NULL,
        question TEXT NOT NULL,
        answer LONGTEXT NOT NULL,
        display_order INT NOT NULL DEFAULT 1,
        status VARCHAR(20) NOT NULL DEFAULT 'published',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category_id),
        INDEX idx_status (status),
        INDEX idx_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS colors (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        hex VARCHAR(20) NOT NULL DEFAULT '#808080',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_active (is_active),
        INDEX idx_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 9. Unified Categories
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT NULL,
        banner VARCHAR(500) NULL,
        parent_id VARCHAR(64) NULL,
        media_id VARCHAR(64) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'published',
        display_order INT NOT NULL DEFAULT 1,
        seo_title VARCHAR(255) NULL,
        meta_description TEXT NULL,
        focus_keyword VARCHAR(255) NULL,
        canonical_url VARCHAR(255) NULL,
        og_title VARCHAR(255) NULL,
        og_description TEXT NULL,
        og_image VARCHAR(500) NULL,
        twitter_title VARCHAR(255) NULL,
        twitter_description TEXT NULL,
        twitter_image VARCHAR(500) NULL,
        twitter_card VARCHAR(50) NOT NULL DEFAULT 'summary_large_image',
        schema_type VARCHAR(100) NULL,
        schema_json LONGTEXT NULL,
        custom_code LONGTEXT NULL,
        show_in_nav BOOLEAN NOT NULL DEFAULT TRUE,
        show_in_explore BOOLEAN NOT NULL DEFAULT TRUE,
        show_in_world_of_tiles BOOLEAN NOT NULL DEFAULT TRUE,
        redirect_urls_json TEXT NULL,
        is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_cat_slug (slug),
        INDEX idx_cat_trashed (is_trashed),
        INDEX idx_cat_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 10. Spaces (Architectural Applications)
      CREATE TABLE IF NOT EXISTS spaces (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        space_area VARCHAR(150) NULL,
        page_title VARCHAR(255) NULL,
        description TEXT NULL,
        image VARCHAR(500) NULL,
        media_id VARCHAR(64) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'published',
        display_order INT NOT NULL DEFAULT 1,
        seo_title VARCHAR(255) NULL,
        meta_description TEXT NULL,
        focus_keyword VARCHAR(255) NULL,
        secondary_keywords TEXT NULL,
        canonical_url VARCHAR(255) NULL,
        robots_index BOOLEAN NOT NULL DEFAULT TRUE,
        robots_follow BOOLEAN NOT NULL DEFAULT TRUE,
        og_title VARCHAR(255) NULL,
        og_description TEXT NULL,
        og_image VARCHAR(500) NULL,
        schema_type VARCHAR(100) NULL,
        schema_data LONGTEXT NULL,
        seo_score INT NOT NULL DEFAULT 80,
        is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_space_slug (slug),
        INDEX idx_space_trashed (is_trashed),
        INDEX idx_space_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 11. Collections
      CREATE TABLE IF NOT EXISTS collections (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        description TEXT NULL,
        image VARCHAR(500) NULL,
        display_order INT NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_coll_slug (slug),
        INDEX idx_coll_trashed (is_trashed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 12. Media Library
      CREATE TABLE IF NOT EXISTS media (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NULL,
        url VARCHAR(500) NOT NULL,
        mime_type VARCHAR(100) NULL,
        file_type VARCHAR(50) NULL DEFAULT 'image',
        size BIGINT NOT NULL DEFAULT 0,
        dimensions VARCHAR(50) NULL,
        uploaded_by VARCHAR(100) NULL DEFAULT 'admin',
        alt_text VARCHAR(255) NULL,
        caption TEXT NULL,
        is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
        deleted_at TIMESTAMP NULL,
        deleted_by VARCHAR(100) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_media_url (url),
        INDEX idx_media_trashed (is_trashed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 13. Videos
      CREATE TABLE IF NOT EXISTS videos (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        display_order INT NOT NULL DEFAULT 1,
        platform VARCHAR(50) NOT NULL DEFAULT 'YouTube',
        post_type VARCHAR(50) NOT NULL DEFAULT 'Short',
        url VARCHAR(500) NOT NULL,
        video_id VARCHAR(100) NULL,
        shortcode VARCHAR(100) NULL,
        categories_json TEXT NULL,
        thumbnail VARCHAR(500) NULL,
        hq_thumbnail VARCHAR(500) NULL,
        embed_url VARCHAR(500) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'published',
        is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_video_trashed (is_trashed),
        INDEX idx_video_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 14. Managed Pages
      CREATE TABLE IF NOT EXISTS pages (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(150) NOT NULL UNIQUE,
        path VARCHAR(255) NOT NULL,
        template VARCHAR(100) NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Published',
        meta_title VARCHAR(255) NULL,
        meta_description TEXT NULL,
        content_json LONGTEXT NULL,
        is_trashed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_page_slug (slug),
        INDEX idx_page_trashed (is_trashed)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

      -- 15. Site Settings (Key-Value)
      CREATE TABLE IF NOT EXISTS site_settings (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value LONGTEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_setting_key (setting_key)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Check and seed initial colors if table is empty
    try {
      const [colorRows] = await dbPool.query("SELECT COUNT(*) AS count FROM colors");
      if (colorRows[0].count === 0) {
        let initialColors = [];
        try {
          initialColors = require("../data/defaultColors.json");
        } catch (_) {}
        for (const c of initialColors) {
          try {
            await dbPool.query(
              `INSERT IGNORE INTO colors (id, name, slug, hex, is_active, display_order, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
              [c.id, c.name, c.slug, c.hex, c.isActive !== false, c.displayOrder || 1]
            );
          } catch (_) {}
        }
        console.log(`[Database] Seeded ${initialColors.length} initial colors into MySQL`);
      }
    } catch (_) {}

    // Check and seed initial category_faqs if table is empty
    try {
      const [faqRows] = await dbPool.query("SELECT COUNT(*) AS count FROM category_faqs");
      if (faqRows[0].count === 0) {
        const store = loadFallbackStore();
        const initialFaqs = store.category_faqs || [];
        for (const f of initialFaqs) {
          try {
            await dbPool.query(
              `INSERT IGNORE INTO category_faqs (id, category_id, question, answer, display_order, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                f.id,
                f.categoryId || f.category_id,
                f.question,
                f.answer,
                f.displayOrder || f.order || 1,
                f.status || "published",
                f.createdAt || new Date(),
                f.updatedAt || new Date(),
              ]
            );
          } catch (_) {}
        }
      }
    } catch (_) {}

    // Check admin users status
    const [adminRows] = await dbPool.query("SELECT COUNT(*) AS count FROM admin_users");
    if (adminRows[0].count === 0) {
      console.log("[Database] No administrator registered yet. First admin setup will be required on /admin.");
    }


    // Alter migrations for products table
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN is_new_arrival BOOLEAN NOT NULL DEFAULT TRUE");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN is_bestseller BOOLEAN NOT NULL DEFAULT FALSE");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN show_tile_of_spain_badge BOOLEAN NOT NULL DEFAULT FALSE");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN space_images_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN secondary_categories_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN subcategories_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN available_colors_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN color_hexes_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN is_trashed BOOLEAN NOT NULL DEFAULT FALSE");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN available_sizes_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN color_images_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN size_images_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN spaces_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN tiles_by_space VARCHAR(500) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN combination_images_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN combination_product_mappings_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN edge_type VARCHAR(100) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN weight VARCHAR(50) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN kg_per_box VARCHAR(50) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN pcs_per_box VARCHAR(50) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN packing_details VARCHAR(100) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN sft_per_box VARCHAR(50) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN shape VARCHAR(100) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN shapes_json LONGTEXT NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN tiles_by_shape VARCHAR(100) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN custom_shape VARCHAR(100) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN tiles_by_size VARCHAR(100) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN catalogue_url VARCHAR(500) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN catalogue_name VARCHAR(255) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN catalogue_media_id VARCHAR(100) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN product_pdf VARCHAR(500) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN video_url VARCHAR(500) NULL");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN video_position INT NOT NULL DEFAULT 1");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN video_enabled BOOLEAN NOT NULL DEFAULT FALSE");
    } catch (_) {}
    try {
      await dbPool.query("ALTER TABLE products ADD COLUMN extra_specs_json LONGTEXT NULL");
    } catch (_) {}

    // Check and seed initial products if table is empty
    const [prodRows] = await dbPool.query("SELECT COUNT(*) AS count FROM products");
    if (prodRows[0].count === 0) {
      const store = loadFallbackStore();
      const initialProducts = store.products || [];
      // Pick the FIRST source that actually has entries so an empty object
      // (e.g. spaceImages: {}) never shadows a populated *_json string.
      function pickMap(...candidates) {
        for (const c of candidates) {
          if (c === undefined || c === null) continue;
          let parsed = c;
          if (typeof parsed === "string") {
            try { parsed = JSON.parse(parsed); } catch (_) { continue; }
          }
          if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) return parsed;
        }
        return {};
      }
      for (const p of initialProducts) {
        try {
          await dbPool.query(
            `INSERT IGNORE INTO products (
              id, sku, slug, name, code, barcode, description, price, b2b_price, inventory,
              category_id, category_name, collection_id, collection_name, size, thickness,
              finish, look, material, origin, color, application, pattern, water_absorption,
              images_json, space_images_json, secondary_categories_json, subcategories_json,
              available_colors_json, color_hexes_json,
              is_active, is_new_arrival, is_bestseller, show_tile_of_spain_badge, meta_title, meta_description, keywords
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              p.id, p.sku || `TMX-SKU-${p.code || p.id}`, p.slug, p.name, p.code || p.slug, p.barcode || null,
              p.description || "", p.price || 0, p.b2bPrice || p.b2b_price || 0, p.inventory || 0,
              p.categoryId || p.category_id || "stone", p.category || p.category_name || "Stone Look",
              p.collectionId || p.collection_id || "coll-stone", p.collection || p.collection_name || "Timex Premium Collection",
              p.size || "800x1600 mm", p.thickness || "15 mm", p.finish || "Polished", p.look || "Stone Look",
              p.material || "Vitrified Porcelain", p.origin || "Imported", p.color || "White",
              p.application || p.usage || "Floor & Wall", p.pattern || p.tilePattern || "Straight",
              p.waterAbsorption || p.water_absorption || "< 0.05%",
              JSON.stringify(p.images || []),
              JSON.stringify(pickMap(p.spaceImages, p.space_images, p.space_images_json)),
              JSON.stringify(p.secondaryCategories || p.secondary_categories || []),
              JSON.stringify(p.subcategories || []),
              JSON.stringify(p.availableColors || (p.color ? [p.color] : [])),
              JSON.stringify(p.colorHexes || p.color_hexes || {}),
              p.isActive !== false,
              Boolean(p.isNewArrival || p.is_new_arrival),
              Boolean(p.isBestseller || p.is_bestseller),
              Boolean(p.showTileOfSpainBadge || p.show_tile_of_spain_badge || false),
              p.metaTitle || p.meta_title || `${p.name} | Timex Ceramic`,
              p.metaDescription || p.meta_description || "",
              p.keywords || ""
            ]
          );
        } catch (e) {
          // ignore duplicate during seed
        }
      }
      console.log(`[Database] Seeded ${initialProducts.length} initial products into MySQL`);
    }

    // Check and seed initial blogs if table is empty
    const [blogRows] = await dbPool.query("SELECT COUNT(*) AS count FROM blogs");
    if (blogRows[0].count === 0) {
      const store = loadFallbackStore();
      const initialBlogs = store.blogs || [];
      for (const b of initialBlogs) {
        try {
          await dbPool.query(
            `INSERT IGNORE INTO blogs (
              id, slug, title, subtitle, category, author_name, author_role, author_avatar,
              cover_image, excerpt, content_json, tags_json, status, read_time, meta_title,
              meta_description, keywords
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              b.id, b.slug, b.title, b.subtitle || "", b.category || "DESIGN TIPS",
              b.author?.name || "Timex Design Editorial", b.author?.role || "Senior Tile Architect",
              b.author?.avatar || "", b.coverImage || "", b.excerpt || "",
              JSON.stringify(b.content || {}), JSON.stringify(b.tags || []),
              b.status || "Published", b.readTime || "5 Min Read",
              b.metaTitle || `${b.title} | Timex Ceramic Journal`,
              b.metaDescription || b.excerpt || "",
              b.keywords || ""
            ]
          );
        } catch (e) {
          // ignore
        }
      }
      console.log(`[Database] Seeded ${initialBlogs.length} initial blogs into MySQL`);
    }

    // Check and seed initial SEO metadata if table is empty
    const [seoRows] = await dbPool.query("SELECT COUNT(*) AS count FROM seo_metadata");
    if (seoRows[0].count === 0) {
      const store = loadFallbackStore();
      const initialSeo = store.seo_metadata || [];
      for (const s of initialSeo) {
        try {
          await dbPool.query(
            `INSERT IGNORE INTO seo_metadata (
              id, page_path, content_type, title, meta_title, meta_description, focus_keyword,
              secondary_keywords, canonical_url, robots_index, robots_follow, og_title,
              og_description, og_image, twitter_title, twitter_description, twitter_image,
              twitter_card, schema_type, schema_data, seo_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              s.id, s.page_path, s.content_type || "page", s.title || "", s.meta_title || s.title || "",
              s.meta_description || "", s.focus_keyword || "",
              Array.isArray(s.secondary_keywords) ? s.secondary_keywords.join(", ") : (s.secondary_keywords || ""),
              s.canonical_url || `https://www.timexceramic.com${s.page_path}`,
              s.robots_index !== false, s.robots_follow !== false, s.og_title || s.meta_title || "",
              s.og_description || s.meta_description || "", s.og_image || "",
              s.twitter_title || s.meta_title || "", s.twitter_description || s.meta_description || "",
              s.twitter_image || s.og_image || "", s.twitter_card || "summary_large_image",
              s.schema_type || "WebPage", s.schema_data || "", s.seo_score || 85
            ]
          );
        } catch (e) {}
      }
      console.log(`[Database] Seeded ${initialSeo.length} initial SEO records into MySQL`);
    }

    // Check and seed initial categories if table is empty
    try {
      const [catRows] = await dbPool.query("SELECT COUNT(*) AS count FROM categories");
      if (catRows[0].count === 0) {
        const store = loadFallbackStore();
        const initialCats = store.custom_categories || [];
        for (const c of initialCats) {
          if (!c.id || !c.slug) continue;
          try {
            await dbPool.query(
              `INSERT IGNORE INTO categories (
                id, name, slug, description, banner, parent_id, media_id, status, display_order,
                seo_title, meta_description, focus_keyword, canonical_url, og_title, og_description,
                og_image, twitter_title, twitter_description, twitter_image, twitter_card,
                schema_type, schema_json, custom_code, show_in_nav, show_in_explore, show_in_world_of_tiles,
                redirect_urls_json, is_trashed
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                c.id, c.name, c.slug, c.description || "", c.banner || "", c.parentId || null,
                c.mediaId || null, c.status || "published", c.order || 1,
                c.seoTitle || c.name, c.metaDescription || c.description || "", c.focusKeyword || "",
                c.canonicalUrl || `/product-category/${c.slug}`, c.ogTitle || c.seoTitle || "",
                c.ogDescription || c.metaDescription || "", c.ogImage || "", c.twitterTitle || "",
                c.twitterDescription || "", c.twitterImage || "", c.twitterCard || "summary_large_image",
                c.schemaType || "CollectionPage", c.schemaJson || "", c.customCode || "",
                c.showInNav !== false, c.showInExplore !== false, c.showInWorldOfTiles !== false,
                JSON.stringify(c.redirectUrls || []), Boolean(c.is_trashed)
              ]
            );
          } catch (_) {}
        }
        console.log(`[Database] Seeded ${initialCats.length} initial categories into MySQL`);
      }
    } catch (_) {}

    // Check and seed initial spaces if table is empty
    try {
      const [spaceRows] = await dbPool.query("SELECT COUNT(*) AS count FROM spaces");
      if (spaceRows[0].count === 0) {
        const store = loadFallbackStore();
        const initialSpaces = store.tiles_by_space || [];
        for (const sp of initialSpaces) {
          if (!sp.id || !sp.slug) continue;
          try {
            await dbPool.query(
              `INSERT IGNORE INTO spaces (
                id, name, slug, space_area, page_title, description, image, media_id,
                status, display_order, seo_title, meta_description, focus_keyword,
                secondary_keywords, canonical_url, robots_index, robots_follow,
                og_title, og_description, og_image, schema_type, schema_data, seo_score, is_trashed
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                sp.id, sp.name, sp.slug, sp.spaceArea || sp.name, sp.pageTitle || sp.name,
                sp.description || "", sp.image || "", sp.mediaId || null, sp.status || "published",
                sp.order || 1, sp.seoTitle || sp.name, sp.metaDescription || sp.description || "",
                sp.focusKeyword || "", sp.secondaryKeywords || "", sp.canonicalUrl || `/${sp.slug}`,
                sp.robotsIndex !== false, sp.robotsFollow !== false, sp.ogTitle || sp.seoTitle || "",
                sp.ogDescription || sp.metaDescription || "", sp.ogImage || sp.image || "",
                sp.schemaType || "CollectionPage", sp.schemaData || "", sp.seoScore || 80,
                Boolean(sp.is_trashed)
              ]
            );
          } catch (_) {}
        }
        console.log(`[Database] Seeded ${initialSpaces.length} initial spaces into MySQL`);
      }
    } catch (_) {}
  } catch (schemaErr) {
    console.warn("[Database] Schema check / auto-seed notice:", schemaErr.message);
  }
}

module.exports = {
  getPool: () => pool,
  isMysqlConnected: () => isMysqlConnected,
  loadFallbackStore,
  saveFallbackStore,
  invalidateStoreCache,
  getDefaultHtaccessContent,
  getDefaultLlmsTxtContent,
  getDefaultCustomCode,
};

initDb();

try {
  const { migrateExistingMedia } = require("../utils/mediaMigration");
  migrateExistingMedia();
} catch (_) {}
