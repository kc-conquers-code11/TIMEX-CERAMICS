"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Star,
  ExternalLink,
  FileText,
  Upload,
  Loader2,
  Layers,
  Search,
  ChevronDown,
  Tag,
  FolderPlus,
  RotateCcw,
  Video,
  Play,
  Palette,
} from "lucide-react";
import { ColorItem } from "@/types/colors";
import { fetchColors } from "@/services/colors";
import { ProductItem } from "@/types/admin";
import { isSpecUnspecified } from "@/utils/productSpecs";
import { extractYouTubeVideoId, getYouTubeThumbnailUrl } from "@/utils/youtube";
import { MediaManagerClient } from "./media/MediaManagerClient";
import { TilesByShapeField } from "./TilesByShapeField";
import { TilesBySizeField } from "./TilesBySizeField";
import { CombinationProductMappingManager } from "./CombinationProductMappingManager";
import { getAdminThumbnailUrl } from "@/utils/adminThumbnails";
import { getProductSpaceImage } from "@/utils/productImages";

export const DEFAULT_COLLECTIONS = [
  { id: "coll-brick", name: "Brick Collection", slug: "brick" },
  { id: "coll-stone", name: "Stone Collection", slug: "stone" },
  { id: "coll-wooden", name: "Wooden Collection", slug: "wooden" },
  { id: "coll-tropical", name: "Tropical Collection", slug: "tropical" },
  { id: "coll-mosaic", name: "Mosaic Collection", slug: "mosaic" },
  { id: "coll-marble", name: "Marble Collection", slug: "marble" },
  { id: "coll-subway", name: "Subway Collection", slug: "subway" },
  { id: "coll-texture", name: "Texture Collection", slug: "texture" },
  { id: "coll-metallic", name: "Metallic Collection", slug: "metallic" },
  { id: "coll-boutique", name: "Boutique Collection", slug: "boutique" },
  { id: "coll-hexagon", name: "Hexagon Collection", slug: "hexagon" },
  { id: "coll-moroccan", name: "Moroccan Collection", slug: "moroccan" },
  { id: "coll-colorful", name: "Colorful Collection", slug: "colorful" },
  { id: "coll-highlighter", name: "Highlighter Collection", slug: "highlighter" },
  { id: "coll-french-frames", name: "French Frames Collection", slug: "french-frames" },
  { id: "coll-modular", name: "Modular Collection", slug: "modular" },
  { id: "coll-octagonal", name: "Octagonal Collection", slug: "octagonal" },
  { id: "coll-terrazzo", name: "Terrazzo Collection", slug: "terrazzo" },
  { id: "coll-white", name: "White Collection", slug: "white" },
  { id: "coll-fabric", name: "Fabric Collection", slug: "fabric" },
  { id: "coll-geometric", name: "Geometric Collection", slug: "geometric" },
];

export const CATEGORIES = [
  { id: "brick", name: "Brick Look", slug: "brick" },
  { id: "stone", name: "Stone Look", slug: "stone" },
  { id: "wooden", name: "Wooden Look", slug: "wooden" },
  { id: "tropical", name: "Tropical / Floral", slug: "tropical" },
  { id: "mosaic", name: "Mosaic Tiles", slug: "mosaic" },
  { id: "marble", name: "Marble Look", slug: "marble" },
  { id: "subway", name: "Subway Tiles", slug: "subway" },
  { id: "texture", name: "Texture / 3D", slug: "texture" },
  { id: "metallic", name: "Metallic Finish", slug: "metallic" },
  { id: "boutique", name: "Boutique Tiles", slug: "boutique" },
  { id: "hexagon", name: "Hexagon Tiles", slug: "hexagon" },
  { id: "moroccan", name: "Moroccan Tiles", slug: "moroccan" },
  { id: "colorful", name: "Colorful Tiles", slug: "colorful" },
  { id: "highlighter", name: "Highlighter Tiles", slug: "highlighter" },
  { id: "french-frames", name: "French Frames", slug: "french-frames" },
  { id: "modular", name: "Modular Tiles", slug: "modular" },
  { id: "octagonal", name: "Octagonal Tiles", slug: "octagonal" },
  { id: "terrazzo", name: "Terrazzo Pattern", slug: "terrazzo" },
  { id: "white", name: "White / Plain", slug: "white" },
  { id: "fabric", name: "Fabric Texture", slug: "fabric" },
  { id: "geometric", name: "Geometric Pattern", slug: "geometric" },
];

export const DEFAULT_SUBCATEGORIES_BY_CATEGORY: Record<string, string[]> = {
  brick: ["Rustic Brick", "Glossy Brick", "Subway Brick", "Antique Brick", "Exposed Brick", "Handmade Brick"],
  stone: ["Slate Look", "Travertine", "Limestone", "Sandstone", "Quartzite", "River Pebble", "Cleft Stone"],
  wooden: ["Oak Wood", "Teak Wood", "Walnut Wood", "Chevron Planks", "Rustic Hardwood", "Weathered Timber"],
  marble: ["Calacatta", "Statuario", "Carrara", "Black Marquina", "Onyx", "Travertino Marble", "Gold Vein"],
  subway: ["Beveled Subway", "Flat Subway", "Crackle Glaze Subway", "Gloss Subway", "Matte Subway", "Fluted Subway"],
  mosaic: ["Glass Mosaic", "Hexagonal Mosaic", "Penny Round Mosaic", "Herringbone Mosaic", "Stone Mosaic", "Metallic Mosaic"],
  hexagon: ["Mini Hexagon", "Large Hexagon", "Geometric Hexagon", "3D Hexagon", "Patterned Hexagon"],
  moroccan: ["Encaustic Star", "Floral Arabesque", "Zellige", "Mediterranean Patchwork", "Geometric Moroccan"],
  modular: ["French Pattern", "4-Format Modular", "Versailles Pattern", "Border Framing", "Roman Modular"],
  terrazzo: ["Micro-Terrazzo", "Venetian Chunky Aggregate", "Pastel Terrazzo", "Monochrome Terrazzo", "Polished Terrazzo"],
  tropical: ["Botanical Leaves", "Palm Fronds", "Exotic Floral", "Jungle Green", "Paradise Bloom"],
  metallic: ["Brushed Gold", "Oxidized Rust", "Copper Glaze", "Titanium Steel", "Gunmetal Metallic"],
  texture: ["Fluted Lines", "Wave Relief", "Chiseled Carving", "Ribbed Texture", "Geometric Embossed"],
  colorful: ["Emerald Green", "Cobalt Blue", "Terracotta Clay", "Mustard Yellow", "Pastel Pink", "Sage Green"],
  highlighter: ["Gold Leaf Accents", "Decorative Feature Strips", "Luxury Highlighter Slabs", "Lustre Motifs"],
  white: ["Pure Super White", "Silk Off-White", "Chalk Matte", "Warm Ivory", "Frost Polished"],
  "french-frames": ["Classic French Moulding", "Ornate Frame", "Geometric Border", "Panel Dado"],
  octagonal: ["Victorian Octagon with Dot", "Classic Octagonal", "Beveled Octagon"],
  fabric: ["Linen Weave", "Tweed Texture", "Silk Canvas", "Burlap Relief"],
  geometric: ["Chevron", "Diamonds", "Cube 3D", "Abstract Lines", "Harlequin"],
  boutique: ["Art Deco", "Handcrafted Cotto", "Bespoke Atelier", "Designer Boutique"],
};

export const FINISHES = [
  "Matt",
  "Glossy",
  "High Gloss",
  "Shiny",
  "Rustic",
  "Textured",
  "3D",
  "Metallic",
  "Polished",
  "Satin",
  "Carving",
  "Sugar / Granula",
  "Lappato",
  "Bookmatch / Gloss",
];

export const MATERIALS = [
  "Vitrified Porcelain",
  "Glazed Vitrified (GVT)",
  "Full Body Vitrified",
  "Porcelain",
  "Ceramic Wall Tile",
  "Double Charge",
  "Sintered Stone",
];

export const ORIGINS = [
  "Made in India",
  "Imported",
  "Italian Design",
  "Spanish Collection",
];


export const EDGE_TYPES = [
  "Rectified / Seamless",
  "Natural / Pressed",
  "Beveled / Pillowed",
  "Chiseled Edge",
];

export const LAYING_PATTERNS = [
  "Straight Grid",
  "Brick / Staggered",
  "Herringbone",
  "Chevron",
  "Random Vein Match",
  "Modular",
];

export const COMMON_SFT_PER_BOX = [
  "9.69",
  "10.76",
  "12.00",
  "12.50",
  "14.53",
  "15.50",
  "16.00",
  "19.38",
  "21.53",
  "31.00",
];

export const COMMON_SIZES = [
  "150mm X 450mm",
  "400mm X 600mm",
  "600x1200 mm",
  "800x1600 mm",
  "1200x2400 mm",
  "600x600 mm",
  "300x600 mm",
  "1200x1200 mm",
];

export const COMMON_COLORS = [
  "White",
  "Black",
  "Grey",
  "Beige",
  "Brown",
  "Blue",
  "Green",
  "Terracotta",
  "Gold",
  "Ivory",
];

export const COMMON_APPLICATIONS = [
  "Wall & Floor",
  "Wall Only",
  "Floor Only",
  "Indoor Living",
  "Outdoor & Patio",
  "Commercial Heavy Duty",
  "Bathroom & Wet Areas",
  "Kitchen Backsplash",
  "Exterior Facade",
];

export const TILES_BY_SPACE_OPTIONS = [
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
];

export const PRESET_IMAGE_SAMPLES = [
  { label: "Harlem Blue Ambience", url: "https://www.timexceramic.com/wp-content/uploads/2025/08/timex-ceramic-harlem-series-blue-wall-and-floor-tiles-shiny-finish-tiles-ambience.jpg" },
  { label: "Harlem White Tile", url: "https://www.timexceramic.com/wp-content/uploads/2025/08/timex-ceramic-harlem-series-white-wall-and-floor-tiles-shiny-finish-tiles-150mm-450mm-size.jpg" },
  { label: "Harlem Green Tile", url: "https://www.timexceramic.com/wp-content/uploads/2025/08/timex-ceramic-harlem-series-green-wall-and-floor-tiles-shiny-finish-tiles-150mm-450mm-size.jpg" },
  { label: "Harlem Blue Tile", url: "https://www.timexceramic.com/wp-content/uploads/2025/08/timex-ceramic-harlem-series-blue-wall-and-floor-tiles-shiny-finish-tiles-150mm-450mm-size.jpg" },
  { label: "Luxury Calacatta Slab", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" },
  { label: "Modern Grey Stone", url: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80" },
  { label: "Honed Quartz Surface", url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80" },
];

function slugify(text: string): string {
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

function getColorPreview(colorName: string): string {
  const c = colorName.toLowerCase();
  if (c.includes("white")) return "#ffffff";
  if (c.includes("black")) return "#18181b";
  if (c.includes("grey") || c.includes("gray")) return "#71717a";
  if (c.includes("beige") || c.includes("cream")) return "#fef3c7";
  if (c.includes("brown")) return "#78350f";
  if (c.includes("blue") || c.includes("navy")) return "#2563eb";
  if (c.includes("green") || c.includes("emerald")) return "#059669";
  if (c.includes("gold") || c.includes("yellow")) return "#eab308";
  if (c.includes("terracotta") || c.includes("red")) return "#dc2626";
  if (c.includes("ivory")) return "#fffff0";
  return "#94a3b8";
}

interface SpecDropdownFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
  helpText?: string;
  isNumeric?: boolean;
}

function SpecDropdownField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select or specify...",
  helpText,
  isNumeric = false,
}: SpecDropdownFieldProps) {
  const trimmed = (value || "").trim();
  const isUnspecified = isSpecUnspecified(value);
  const isStandard = options.includes(trimmed);

  const [selectedMode, setSelectedMode] = useState<string>(() => {
    if (isUnspecified) return "";
    if (isStandard) return trimmed;
    if (trimmed.toLowerCase() === "matte" && options.includes("Matt")) {
      return "Matt";
    }
    return "__CUSTOM__";
  });

  const [customValue, setCustomValue] = useState<string>(() => {
    if (trimmed.toLowerCase() === "matte" && options.includes("Matt")) {
      return "";
    }
    return !isUnspecified && !isStandard ? trimmed : "";
  });

  const [numericError, setNumericError] = useState<string>("");

  useEffect(() => {
    if (isSpecUnspecified(value)) {
      setSelectedMode("");
      setCustomValue("");
      setNumericError("");
    } else {
      const val = (value || "").trim();
      if (options.includes(val)) {
        setSelectedMode(val);
        setCustomValue("");
        setNumericError("");
      } else if (val.toLowerCase() === "matte" && options.includes("Matt")) {
        setSelectedMode("Matt");
        setCustomValue("");
        setNumericError("");
        onChange("Matt");
      } else {
        setSelectedMode("__CUSTOM__");
        setCustomValue(val);
        setNumericError("");
      }
    }
  }, [value, options]);

  const handleDropdownChange = (newMode: string) => {
    setSelectedMode(newMode);
    setNumericError("");
    if (newMode === "") {
      onChange("");
    } else if (newMode === "__CUSTOM__") {
      onChange(customValue);
    } else {
      onChange(newMode);
    }
  };

  const handleCustomInputChange = (text: string) => {
    if (isNumeric) {
      if (text.includes("-")) {
        setNumericError("Negative values are not allowed.");
        return;
      }
      setNumericError("");
      // Allow only numbers and at most one decimal point
      let cleaned = text.replace(/[^0-9.]/g, "");
      const parts = cleaned.split(".");
      if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
      }
      setCustomValue(cleaned);
      onChange(cleaned);
    } else {
      setCustomValue(text);
      onChange(text);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold text-gray-200">{label}</label>
      <select
        value={selectedMode}
        onChange={(e) => handleDropdownChange(e.target.value)}
        className="w-full bg-[#111827] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880] transition-colors"
      >
        <option value="">Not Specified (Hide from public page)</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        <option value="__CUSTOM__">Custom (Specify below)</option>
      </select>

      {selectedMode === "__CUSTOM__" && (
        <div className="animate-in fade-in duration-200 pt-1 space-y-1">
          <label className="block text-[11px] font-semibold text-[#c5a880]">
            {label.includes("Space") ? "Custom Space / Area" : `Custom ${label}`}
          </label>
          <input
            type="text"
            inputMode={isNumeric ? "decimal" : undefined}
            value={customValue}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            placeholder={
              isNumeric
                ? "e.g. 12.50"
                : label.includes("Space")
                ? "e.g. Luxury Villa, Penthouse, etc."
                : `Type custom ${label.toLowerCase()}...`
            }
            className="w-full bg-[#0c1220] border border-[#c5a880]/50 rounded-xl px-3.5 py-2 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#c5a880] placeholder-gray-500"
          />
          {numericError && (
            <p className="text-[10px] text-red-400">{numericError}</p>
          )}
        </div>
      )}

      {helpText && <p className="text-[10px] text-gray-400">{helpText}</p>}
    </div>
  );
}

function TechnicalSpecsColorField({
  selectedColors,
  onChange,
  colorHexes,
  onHexesChange,
}: {
  selectedColors: string[];
  onChange: (colors: string[]) => void;
  colorHexes?: Record<string, string>;
  onHexesChange?: (hexes: Record<string, string>) => void;
}) {
  const [availableDbColors, setAvailableDbColors] = useState<ColorItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetchColors({ activeOnly: true })
      .then((items) => {
        if (mounted && Array.isArray(items)) {
          setAvailableDbColors(items);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleColor = (colorName: string, hex?: string) => {
    const exists = selectedColors.some((c) => c.toLowerCase() === colorName.toLowerCase());
    let updated: string[];
    if (exists) {
      updated = selectedColors.filter((c) => c.toLowerCase() !== colorName.toLowerCase());
    } else {
      updated = [...selectedColors, colorName];
      if (hex && onHexesChange) {
        onHexesChange({ ...(colorHexes || {}), [colorName]: hex });
      }
    }
    onChange(updated);
  };

  const handleRemoveColor = (colorName: string) => {
    const updated = selectedColors.filter((c) => c.toLowerCase() !== colorName.toLowerCase());
    onChange(updated);
  };

  const filteredOptions = availableDbColors.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-[#0d1424] border border-white/10 rounded-2xl space-y-3" ref={containerRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#c5a880]" />
          <label className="text-xs font-bold text-gray-200">
            Color (Multi-Select)
          </label>
        </div>
        <span className="text-[11px] text-gray-400 font-mono">
          {selectedColors.length} Color{selectedColors.length === 1 ? "" : "s"} Selected
        </span>
      </div>
      <p className="text-[11px] text-gray-400">
        Assign one or more colors to this product. Products will appear on all corresponding BY COLOR pages on the frontend.
      </p>

      {/* Selected Color Badges / Removable Tags */}
      <div className="flex flex-wrap gap-2 min-h-[38px] p-2 bg-[#111827] border border-white/10 rounded-xl items-center">
        {selectedColors.length === 0 ? (
          <span className="text-xs text-gray-500 italic px-1">
            No colors assigned yet. Use the searchable selector below to assign colors.
          </span>
        ) : (
          selectedColors.map((col) => {
            const dbColor = availableDbColors.find(
              (c) => c.name.toLowerCase() === col.toLowerCase()
            );
            const hex = colorHexes?.[col] || dbColor?.hex || getColorPreview(col);
            return (
              <span
                key={col}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#1e293b] border border-white/15 text-white shadow-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full border border-white/30 shrink-0"
                  style={{ backgroundColor: hex }}
                />
                <span>{col}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveColor(col)}
                  className="text-gray-400 hover:text-red-400 transition-colors p-0.5 rounded cursor-pointer"
                  title={`Remove ${col}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })
        )}
      </div>

      {/* Searchable Multi-Select Input & Dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search and select colors (e.g. Beige, Ivory, Terracotta)..."
            className="w-full bg-[#111827] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
          />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 cursor-pointer"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-[#0d1424] border border-white/15 rounded-xl shadow-2xl z-30 p-1.5 space-y-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-xs text-gray-400 text-center">
                No matching colors found.
              </div>
            ) : (
              filteredOptions.map((c) => {
                const isSelected = selectedColors.some(
                  (sc) => sc.toLowerCase() === c.name.toLowerCase()
                );
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleToggleColor(c.name, c.hex)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? "bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30 font-bold"
                        : "hover:bg-white/5 text-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono uppercase">{c.hex}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#c5a880]" />}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProductVideoSection({
  form,
  setForm,
}: {
  form: Partial<ProductItem>;
  setForm: React.Dispatch<React.SetStateAction<Partial<ProductItem>>>;
}) {
  const isEnabled = Boolean(form.videoEnabled || form.video_enabled);
  const videoUrl = form.videoUrl || form.video_url || "";
  const videoId = extractYouTubeVideoId(videoUrl);
  const rawPos = form.videoPosition !== undefined ? form.videoPosition : form.video_position;
  const position = Math.max(1, parseInt(String(rawPos), 10) || 1);
  const hasInput = Boolean(videoUrl.trim());
  const isValid = Boolean(videoId);

  return (
    <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-[#c5a880]" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Product Video
            </h4>
          </div>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Embed a YouTube video in the product gallery alongside high-resolution images.
          </p>
        </div>

        {/* Enable Product Video: ON / OFF toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-gray-300">Enable Product Video:</span>
          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  videoEnabled: true,
                  video_enabled: true,
                }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                isEnabled
                  ? "bg-[#c5a880] text-black shadow-md font-extrabold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              ON
            </button>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  videoEnabled: false,
                  video_enabled: false,
                }))
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                !isEnabled
                  ? "bg-white/15 text-gray-200 border border-white/20 font-extrabold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              OFF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-1">
        {/* YouTube Video URL */}
        <div className="md:col-span-8 space-y-1.5">
          <label className="block text-xs font-bold text-gray-200">
            YouTube Video URL
          </label>
          <input
            type="text"
            value={videoUrl}
            onChange={(e) => {
              const val = e.target.value;
              setForm((prev) => ({
                ...prev,
                videoUrl: val,
                video_url: val,
              }));
            }}
            placeholder="e.g. https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
            className="w-full bg-[#0d131f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
          />

          {/* Validation Feedback */}
          {hasInput ? (
            isValid ? (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Valid YouTube Video (ID: <code className="font-mono bg-emerald-950/40 px-1 py-0.5 rounded">{videoId}</code>)</span>
              </p>
            ) : (
              <p className="text-[11px] text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Invalid YouTube URL. Please enter a valid YouTube video link (watch?v=, youtu.be, shorts, embed).</span>
              </p>
            )
          ) : (
            <p className="text-[11px] text-gray-400">
              Paste standard YouTube links, Shorts, or youtu.be shortlinks. Saving will not fail if disabled or empty.
            </p>
          )}
        </div>

        {/* Gallery Position */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="block text-xs font-bold text-gray-200">
            Gallery Position
          </label>
          <input
            type="number"
            min={1}
            step={1}
            value={position}
            onChange={(e) => {
              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
              setForm((prev) => ({
                ...prev,
                videoPosition: val,
                video_position: val,
              }));
            }}
            className="w-full bg-[#0d131f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
          />
          <p className="text-[11px] text-gray-400">
            1 = first, 3 = third. If position exceeds gallery length, video is placed at the end.
          </p>
        </div>
      </div>

      {/* Live Video Preview Box */}
      {isValid && videoId && (
        <div className="p-3 bg-[#0d131f] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0">
              <img
                src={getYouTubeThumbnailUrl(videoId)}
                alt="YouTube thumbnail preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center shadow-md">
                  <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                </div>
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white">YouTube Preview Ready</span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    isEnabled
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                  }`}
                >
                  {isEnabled ? "Enabled (Live)" : "Disabled (Off)"}
                </span>
                <span className="text-[10px] text-[#c5a880] font-mono bg-[#c5a880]/10 px-2 py-0.5 rounded-md border border-[#c5a880]/20">
                  Position {position}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-1">
                {videoUrl}
              </p>
            </div>
          </div>

          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#c5a880] hover:underline flex items-center gap-1 shrink-0 self-end sm:self-center"
          >
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

function toBoolean(val: any, fallback = false): boolean {
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

interface ProductEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct: ProductItem | null;
  onSave: (product: Partial<ProductItem>) => Promise<any>;
  saving: boolean;
}

type TabType = "general" | "specs" | "sizes-colors" | "description" | "images" | "seo";

export function ProductEditorModal({
  isOpen,
  onClose,
  editingProduct,
  onSave,
  saving: externalSaving,
}: ProductEditorModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [newSizeInput, setNewSizeInput] = useState("");
  const [newColorInput, setNewColorInput] = useState("");
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<{
    type: "gallery" | "catalogue" | "size" | "color" | "space";
    key?: string;
  } | null>(null);
  const [galleryPickerTarget, setGalleryPickerTarget] = useState<{
    type: "size" | "color" | "space";
    key: string;
  } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Drag & drop reordering states
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Batch image upload states
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Save states
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveErrorMessage, setSaveErrorMessage] = useState("");

  // Catalogues state
  const [catalogues, setCatalogues] = useState<Array<{ id: string; name: string; url: string; filename: string; sizeFormatted?: string }>>([]);
  const [isUploadingCatalogue, setIsUploadingCatalogue] = useState(false);

  // Unsaved changes confirmation modal
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Form State
  const [form, setForm] = useState<Partial<ProductItem>>({
    name: "",
    slug: "",
    categoryId: "brick",
    category: "Brick Look",
    collectionId: "brick",
    collection: "Brick Look",
    description: "",
    size: "",
    availableSizes: [],
    sizeImages: {},
    thickness: "9 mm",
    finish: "Shiny",
    material: "Vitrified Porcelain",
    origin: "Imported",
    color: "",
    availableColors: [],
    colorImages: {},
    spaceImages: {},
    combinationImages: {},
    usage: "Wall & Floor",
    application: "Wall & Floor",
    tilePattern: "Straight",
    pattern: "Straight",
    edgeType: "Rectified / Seamless",
    shape: "",
    shapes: [],
    tilesByShape: "",
    tiles_by_shape: "",
    customShape: "",
    custom_shape: "",
    tilesBySize: "",
    tiles_by_size: "",
    tilesBySizeList: [],
    customTilesBySize: "",
    custom_tiles_by_size: "",
    tilesBySpace: "",
    catalogueUrl: "",
    catalogueName: "",
    catalogueMediaId: "",
    videoUrl: "",
    video_url: "",
    videoPosition: 1,
    video_position: 1,
    videoEnabled: false,
    video_enabled: false,
    kgPerBox: "21",
    pcsPerBox: "16",
    images: [],
    isActive: true,
    isNewArrival: true,
    is_new_arrival: true,
    showTileOfSpainBadge: false,
    show_tile_of_spain_badge: false,
    status: "Active",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
  });

  const initialFormJsonRef = useRef<string>("");

  // Dynamic Taxonomies States (Categories, Collections, Spaces)
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string; slug: string; url?: string }>>(CATEGORIES);
  const [collectionsList, setCollectionsList] = useState(DEFAULT_COLLECTIONS);
  const [spacesList, setSpacesList] = useState(TILES_BY_SPACE_OPTIONS);

  const [selectedSecondaryCategories, setSelectedSecondaryCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState<Record<string, string[]>>(DEFAULT_SUBCATEGORIES_BY_CATEGORY);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [subcategorySearchTerm, setSubcategorySearchTerm] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [selectedSpaces, setSelectedSpaces] = useState<string[]>([]);

  // Subcategory creation state
  const [showAddSubcategory, setShowAddSubcategory] = useState(false);
  const [newSubcategoryInput, setNewSubcategoryInput] = useState("");
  const [newSubcategoryTargetCategory, setNewSubcategoryTargetCategory] = useState("");
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);

  // Inline taxonomy creation states
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newCollectionInput, setNewCollectionInput] = useState("");
  const [isAddingCollection, setIsAddingCollection] = useState(false);

  const [showAddSpace, setShowAddSpace] = useState(false);
  const [newSpaceInput, setNewSpaceInput] = useState("");
  const [isAddingSpace, setIsAddingSpace] = useState(false);

  const fetchTaxonomies = async () => {
    try {
      const res = await fetch("/api/v1/taxonomies");
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setCategoriesList(data.categories);
        }
        if (Array.isArray(data.collections) && data.collections.length > 0) {
          setCollectionsList(data.collections);
        }
        if (Array.isArray(data.spaces) && data.spaces.length > 0) {
          setSpacesList(data.spaces);
        }
        if (data.subcategoriesByCategory && typeof data.subcategoriesByCategory === "object") {
          setSubcategoriesByCategory((prev) => ({
            ...prev,
            ...data.subcategoriesByCategory,
          }));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch taxonomies:", e);
    }
  };

  const fetchCatalogues = async () => {
    try {
      const res = await fetch("/api/v1/catalogues");
      const data = await res.json();
      if (data.success && Array.isArray(data.catalogues)) {
        setCatalogues(data.catalogues);
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isOpen) {
      fetchCatalogues();
      fetchTaxonomies();
    }
  }, [isOpen]);

  const handleAddNewCategory = async () => {
    if (!newCategoryInput.trim()) return;
    setIsAddingCategory(true);
    try {
      const res = await fetch("/api/v1/taxonomies/category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategoriesList((prev) => {
          const exists = prev.find((c) => c.id === data.category.id || c.name.toLowerCase() === data.category.name.toLowerCase());
          return exists ? prev : [...prev, data.category];
        });
        setForm((prev) => ({
          ...prev,
          categoryId: data.category.id,
          category: data.category.name,
        }));
        setNewCategoryInput("");
        setShowAddCategory(false);
      } else {
        alert(data.error || "Failed to create category");
      }
    } catch (err: any) {
      alert("Error creating category: " + err.message);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleAddNewCollection = async () => {
    if (!newCollectionInput.trim()) return;
    setIsAddingCollection(true);
    try {
      const res = await fetch("/api/v1/taxonomies/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.collection) {
        setCollectionsList((prev) => {
          const exists = prev.find((c) => c.id === data.collection.id || c.name.toLowerCase() === data.collection.name.toLowerCase());
          return exists ? prev : [...prev, data.collection];
        });
        setForm((prev) => ({
          ...prev,
          collectionId: data.collection.id,
          collection: data.collection.name,
        }));
        setNewCollectionInput("");
        setShowAddCollection(false);
      } else {
        alert(data.error || "Failed to create collection");
      }
    } catch (err: any) {
      alert("Error creating collection: " + err.message);
    } finally {
      setIsAddingCollection(false);
    }
  };

  const handleAddNewSpace = async () => {
    if (!newSpaceInput.trim()) return;
    setIsAddingSpace(true);
    try {
      const res = await fetch("/api/v1/taxonomies/space", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newSpaceInput.trim() }),
      });
      const data = await res.json();
      if (data.success && data.space) {
        const spaceName = data.space;
        setSpacesList((prev) => (prev.includes(spaceName) ? prev : [...prev, spaceName]));
        setSelectedSpaces((prev) => {
          if (prev.includes(spaceName)) return prev;
          const updated = [...prev, spaceName];
          const joined = updated.join(", ");
          setForm((f) => ({
            ...f,
            tilesBySpace: joined,
            tiles_by_space: joined,
            spaceArea: joined,
            spaces: updated,
          }));
          return updated;
        });
        setNewSpaceInput("");
        setShowAddSpace(false);
      } else {
        alert(data.error || "Failed to create space");
      }
    } catch (err: any) {
      alert("Error creating space: " + err.message);
    } finally {
      setIsAddingSpace(false);
    }
  };

  const handleToggleSpace = (spaceName: string) => {
    setSelectedSpaces((prev) => {
      const exists = prev.includes(spaceName);
      const updated = exists ? prev.filter((s) => s !== spaceName) : [...prev, spaceName];
      const joined = updated.join(", ");
      setForm((f) => ({
        ...f,
        tilesBySpace: joined,
        tiles_by_space: joined,
        spaceArea: joined,
        spaces: updated,
      }));
      return updated;
    });
  };

  const handleToggleSecondaryCategory = (catId: string) => {
    setSelectedSecondaryCategories((prev) => {
      const exists = prev.some((id) => {
        const a = String(id).toLowerCase().trim().replace(/^cat-/, "");
        const b = String(catId).toLowerCase().trim().replace(/^cat-/, "");
        return a === b;
      });
      const updated = exists
        ? prev.filter((id) => String(id).toLowerCase().trim().replace(/^cat-/, "") !== String(catId).toLowerCase().trim().replace(/^cat-/, ""))
        : [...prev, catId];
      setForm((f) => ({
        ...f,
        secondaryCategories: updated,
        secondary_categories: updated,
        secondary_categories_json: JSON.stringify(updated),
      }));
      return updated;
    });
  };

  const handleToggleSubcategory = (subName: string) => {
    setSelectedSubcategories((prev) => {
      const exists = prev.includes(subName);
      const updated = exists ? prev.filter((s) => s !== subName) : [...prev, subName];
      setForm((f) => ({
        ...f,
        subcategories: updated,
      }));
      return updated;
    });
  };

  const handleAddNewSubcategory = async (targetCatId: string) => {
    if (!newSubcategoryInput.trim() || !targetCatId) return;
    setIsAddingSubcategory(true);
    try {
      const res = await fetch("/api/v1/taxonomies/subcategory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: targetCatId, name: newSubcategoryInput.trim() }),
      });
      const data = await res.json();
      const subName = data.subcategory?.name || newSubcategoryInput.trim();
      const cleanCat = String(targetCatId).toLowerCase().trim().replace(/^cat-/, "");
      setSubcategoriesByCategory((prev) => {
        const existingList = prev[cleanCat] || [];
        if (existingList.includes(subName)) return prev;
        return {
          ...prev,
          [cleanCat]: [...existingList, subName],
        };
      });
      setSelectedSubcategories((prev) => (prev.includes(subName) ? prev : [...prev, subName]));
      setNewSubcategoryInput("");
      setShowAddSubcategory(false);
    } catch (err: any) {
      alert("Error creating subcategory: " + err.message);
    } finally {
      setIsAddingSubcategory(false);
    }
  };

  const handleCatalogueUpload = async (file: File) => {
    if (!file) return;
    setIsUploadingCatalogue(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/v1/catalogues/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.catalogue) {
        setCatalogues((prev) => [data.catalogue, ...prev.filter((c) => c.url !== data.catalogue.url)]);
        setForm((prev) => ({
          ...prev,
          catalogueUrl: data.catalogue.url,
          catalogue_url: data.catalogue.url,
          catalogue: data.catalogue.url,
          productPdf: data.catalogue.url,
          catalogueName: data.catalogue.name,
        }));
      }
    } catch (e) {
      alert("Failed to upload catalogue: " + e);
    } finally {
      setIsUploadingCatalogue(false);
    }
  };

  useEffect(() => {
    if (editingProduct) {
      const categoryObj = categoriesList.find(
        (c) => c.id === editingProduct.categoryId || c.slug === editingProduct.category_id || c.id === editingProduct.category_id
      ) || CATEGORIES.find(
        (c) => c.id === editingProduct.categoryId || c.slug === editingProduct.category_id || c.id === editingProduct.category_id
      );
      const categoryName = categoryObj ? categoryObj.name : (editingProduct.category || editingProduct.category_name || "Stone Look");
      const categoryId = categoryObj ? categoryObj.id : (editingProduct.categoryId || editingProduct.category_id || "stone");
      
      const rawColl = editingProduct.collection || editingProduct.collection_name || "";
      const rawCollId = editingProduct.collectionId || editingProduct.collection_id || "";
      const collObj = collectionsList.find(
        (c) => c.id === rawCollId || c.slug === rawCollId || c.name.toLowerCase() === rawColl.toLowerCase()
      );
      const collectionName = collObj ? collObj.name : (rawColl || `${categoryName.replace(/\s+(look|series|collection)$/i, "")} Collection`);
      const collectionId = collObj ? collObj.id : (rawCollId || `coll-${categoryId}`);

      const rawSecCats: string[] = Array.isArray(editingProduct.secondaryCategories)
        ? editingProduct.secondaryCategories
        : (Array.isArray(editingProduct.secondary_categories)
          ? editingProduct.secondary_categories
          : (editingProduct.secondary_categories_json
            ? (() => { try { return JSON.parse(editingProduct.secondary_categories_json); } catch(_) { return []; } })()
            : []));
      const cleanSecCats = rawSecCats.filter((id) => {
        const norm = String(id).toLowerCase().trim().replace(/^cat-/, "");
        const curPrimId = String(categoryId).toLowerCase().trim().replace(/^cat-/, "");
        const curPrimName = String(categoryName).toLowerCase().trim();
        return norm !== curPrimId && norm !== curPrimName;
      });
      setSelectedSecondaryCategories(cleanSecCats);

      const rawSubCats: string[] = Array.isArray(editingProduct.subcategories)
        ? editingProduct.subcategories.map((s: any) => (typeof s === "string" ? s : (s?.name || s?.slug || ""))).filter(Boolean)
        : [];
      setSelectedSubcategories(rawSubCats);

      const rawSpaces: string[] = Array.isArray(editingProduct.spaces)
        ? editingProduct.spaces.map((s: any) => String(s).trim()).filter((s) => Boolean(s) && !isSpecUnspecified(s))
        : (editingProduct.tilesBySpace || editingProduct.tiles_by_space || editingProduct.spaceArea
            ? String(editingProduct.tilesBySpace || editingProduct.tiles_by_space || editingProduct.spaceArea)
                .split(",")
                .map((s) => s.trim())
                .filter((s) => Boolean(s) && !isSpecUnspecified(s))
            : []);
      setSelectedSpaces(rawSpaces);

      const isAct = editingProduct.is_active !== false && editingProduct.isActive !== false && editingProduct.status !== "Inactive";

      const rawSizes = Array.isArray(editingProduct.availableSizes)
        ? editingProduct.availableSizes
        : (editingProduct.size && !isSpecUnspecified(editingProduct.size) ? [editingProduct.size] : []);

      const rawColors = Array.isArray(editingProduct.availableColors)
        ? editingProduct.availableColors
        : (editingProduct.color && !isSpecUnspecified(editingProduct.color) ? [editingProduct.color] : []);

      // Pick the FIRST source that actually has entries. An empty object
      // (e.g. spaceImages: {}) must not shadow a populated space_images_json string.
      let initialSpaceImages: Record<string, string> = {};
      const rawSpCandidates = [
        (editingProduct as any).spaceImages,
        (editingProduct as any).space_images,
        (editingProduct as any).space_images_json,
      ];
      for (const candidate of rawSpCandidates) {
        if (candidate === undefined || candidate === null) continue;
        let parsed: any = candidate;
        if (typeof parsed === "string") {
          try {
            parsed = JSON.parse(parsed);
          } catch (_) {
            continue;
          }
        }
        if (parsed && typeof parsed === "object" && Object.keys(parsed).length > 0) {
          initialSpaceImages = { ...parsed };
          break;
        }
      }

      const initialData: Partial<ProductItem> = {
        id: editingProduct.id,
        name: editingProduct.name || "",
        slug: editingProduct.slug || "",
        categoryId,
        category: categoryName,
        collectionId,
        collection: collectionName,
        secondaryCategories: cleanSecCats,
        secondary_categories: cleanSecCats,
        subcategories: rawSubCats,
        spaces: rawSpaces,
        description: editingProduct.description || "",
        size: isSpecUnspecified(editingProduct.size) ? (rawSizes[0] || "") : (editingProduct.size || ""),
        availableSizes: rawSizes,
        sizeImages: (editingProduct as any).sizeImages || {},
        thickness: isSpecUnspecified(editingProduct.thickness) ? "" : (editingProduct.thickness || ""),
        finish: isSpecUnspecified(editingProduct.finish)
          ? ""
          : (editingProduct.finish?.trim().toLowerCase() === "matte" ? "Matt" : (editingProduct.finish || "")),
        material: isSpecUnspecified(editingProduct.material) ? "" : (editingProduct.material || ""),
        origin: isSpecUnspecified(editingProduct.origin) ? "" : (editingProduct.origin || ""),
        color: isSpecUnspecified(editingProduct.color) ? (rawColors[0] || "") : (editingProduct.color || ""),
        availableColors: rawColors,
        colorImages: (editingProduct as any).colorImages || {},
        spaceImages: initialSpaceImages,
        space_images: initialSpaceImages,
        space_images_json: JSON.stringify(initialSpaceImages),
        colorHexes: (editingProduct as any).colorHexes || (editingProduct as any).color_hexes || {},
        color_hexes: (editingProduct as any).colorHexes || (editingProduct as any).color_hexes || {},
        combinationImages: (editingProduct as any).combinationImages || {},
        combinationProductMappings: Array.isArray((editingProduct as any).combinationProductMappings)
          ? (editingProduct as any).combinationProductMappings
          : (Array.isArray((editingProduct as any).combination_product_mappings)
              ? (editingProduct as any).combination_product_mappings
              : []),
        combination_product_mappings: Array.isArray((editingProduct as any).combinationProductMappings)
          ? (editingProduct as any).combinationProductMappings
          : (Array.isArray((editingProduct as any).combination_product_mappings)
              ? (editingProduct as any).combination_product_mappings
              : []),
        usage: isSpecUnspecified(editingProduct.usage || editingProduct.application) ? "" : (editingProduct.usage || editingProduct.application || ""),
        application: isSpecUnspecified(editingProduct.application || editingProduct.usage) ? "" : (editingProduct.application || editingProduct.usage || ""),
        tilePattern: isSpecUnspecified(editingProduct.tilePattern || editingProduct.pattern) ? "" : (editingProduct.tilePattern || editingProduct.pattern || ""),
        pattern: isSpecUnspecified(editingProduct.tilePattern || editingProduct.pattern) ? "" : (editingProduct.tilePattern || editingProduct.pattern || ""),
        edgeType: isSpecUnspecified(editingProduct.edgeType || editingProduct.edge_type) ? "" : (editingProduct.edgeType || editingProduct.edge_type || ""),
        shape: editingProduct.tilesByShape || editingProduct.shape || (Array.isArray(editingProduct.shapes) ? editingProduct.shapes.join(", ") : ""),
        shapes: Array.isArray(editingProduct.shapes)
          ? editingProduct.shapes
          : (editingProduct.shape || editingProduct.tilesByShape
              ? String(editingProduct.shape || editingProduct.tilesByShape).split(",").map((s) => s.trim()).filter(Boolean)
              : []),
        tilesByShape: editingProduct.tilesByShape || editingProduct.shape || "",
        tiles_by_shape: editingProduct.tiles_by_shape || editingProduct.shape || "",
        customShape: editingProduct.customShape || editingProduct.custom_shape || "",
        custom_shape: editingProduct.customShape || editingProduct.custom_shape || "",
        tilesBySize: editingProduct.tilesBySize || editingProduct.tiles_by_size || (Array.isArray(editingProduct.tilesBySizeList) ? editingProduct.tilesBySizeList.join(", ") : ""),
        tiles_by_size: editingProduct.tiles_by_size || editingProduct.tilesBySize || "",
        tilesBySizeList: Array.isArray(editingProduct.tilesBySizeList)
          ? editingProduct.tilesBySizeList
          : (editingProduct.tilesBySize || editingProduct.tiles_by_size
              ? String(editingProduct.tilesBySize || editingProduct.tiles_by_size).split(",").map((s) => s.trim()).filter(Boolean)
              : []),
        customTilesBySize: editingProduct.customTilesBySize || editingProduct.custom_tiles_by_size || "",
        custom_tiles_by_size: editingProduct.customTilesBySize || editingProduct.custom_tiles_by_size || "",
        tilesBySpace: rawSpaces.join(", "),
        tiles_by_space: rawSpaces.join(", "),
        spaceArea: rawSpaces.join(", "),
        catalogueUrl: editingProduct.catalogueUrl || editingProduct.catalogue_url || editingProduct.catalogue || editingProduct.productPdf || "",
        catalogueName: editingProduct.catalogueName || editingProduct.catalogue_name || "",
        catalogueMediaId: (editingProduct as any).catalogueMediaId || "",
        videoUrl: editingProduct.videoUrl || editingProduct.video_url || "",
        video_url: editingProduct.videoUrl || editingProduct.video_url || "",
        videoPosition: editingProduct.videoPosition !== undefined ? Number(editingProduct.videoPosition) : (editingProduct.video_position !== undefined ? Number(editingProduct.video_position) : 1),
        video_position: editingProduct.videoPosition !== undefined ? Number(editingProduct.videoPosition) : (editingProduct.video_position !== undefined ? Number(editingProduct.video_position) : 1),
        videoEnabled: Boolean(editingProduct.videoEnabled !== undefined ? editingProduct.videoEnabled : editingProduct.video_enabled),
        video_enabled: Boolean(editingProduct.videoEnabled !== undefined ? editingProduct.videoEnabled : editingProduct.video_enabled),
        kgPerBox: isSpecUnspecified(editingProduct.kgPerBox || editingProduct.weight) ? "" : String(editingProduct.kgPerBox || editingProduct.weight || ""),
        pcsPerBox: isSpecUnspecified(editingProduct.pcsPerBox || editingProduct.packingDetails) ? "" : String(editingProduct.pcsPerBox || editingProduct.packingDetails || ""),
        sftPerBox: isSpecUnspecified(editingProduct.sftPerBox || editingProduct.sft_per_box || (editingProduct as any).sqftPerBox) ? "" : String(editingProduct.sftPerBox || editingProduct.sft_per_box || (editingProduct as any).sqftPerBox || ""),
        sft_per_box: isSpecUnspecified(editingProduct.sftPerBox || editingProduct.sft_per_box || (editingProduct as any).sqftPerBox) ? "" : String(editingProduct.sftPerBox || editingProduct.sft_per_box || (editingProduct as any).sqftPerBox || ""),
        images: Array.isArray(editingProduct.images) ? [...editingProduct.images] : [],
        isActive: isAct,
        status: isAct ? "Active" : "Inactive",
        isNewArrival: toBoolean(editingProduct.isNewArrival ?? editingProduct.is_new_arrival, false),
        is_new_arrival: toBoolean(editingProduct.isNewArrival ?? editingProduct.is_new_arrival, false),
        showTileOfSpainBadge: toBoolean(editingProduct.showTileOfSpainBadge ?? editingProduct.show_tile_of_spain_badge, false),
        show_tile_of_spain_badge: toBoolean(editingProduct.showTileOfSpainBadge ?? editingProduct.show_tile_of_spain_badge, false),
        metaTitle: editingProduct.metaTitle || editingProduct.meta_title || "",
        metaDescription: editingProduct.metaDescription || editingProduct.meta_description || "",
        keywords: editingProduct.keywords || "",
      };

      setForm(initialData);
      initialFormJsonRef.current = JSON.stringify(initialData);
    } else {
      setSelectedSecondaryCategories([]);
      setSelectedSpaces(["Living Room Tiles", "Kitchen Tiles"]);
      const initialData: Partial<ProductItem> = {
        name: "",
        slug: "",
        categoryId: "brick",
        category: "Brick Look",
        collectionId: "coll-brick",
        collection: "Brick Collection",
        secondaryCategories: [],
        secondary_categories: [],
        spaces: ["Living Room Tiles", "Kitchen Tiles"],
        tilesBySpace: "Living Room Tiles, Kitchen Tiles",
        tiles_by_space: "Living Room Tiles, Kitchen Tiles",
        spaceArea: "Living Room Tiles, Kitchen Tiles",
        description: "",
        size: "",
        availableSizes: [],
        thickness: "9 mm",
        finish: "Shiny",
        material: "Vitrified Porcelain",
        origin: "Imported",
        color: "",
        availableColors: [],
        colorImages: {},
        spaceImages: {},
        combinationImages: {},
        combinationProductMappings: [],
        combination_product_mappings: [],
        usage: "Wall & Floor",
        application: "Wall & Floor",
        tilePattern: "Straight Grid",
        pattern: "Straight Grid",
        edgeType: "Rectified / Seamless",
        shape: "",
        shapes: [],
        tilesByShape: "",
        tiles_by_shape: "",
        customShape: "",
        custom_shape: "",
        tilesBySize: "",
        tiles_by_size: "",
        tilesBySizeList: [],
        customTilesBySize: "",
        custom_tiles_by_size: "",
        catalogueUrl: "",
        catalogueName: "",
        videoUrl: "",
        video_url: "",
        videoPosition: 1,
        video_position: 1,
        videoEnabled: false,
        video_enabled: false,
        kgPerBox: "21",
        pcsPerBox: "16",
        sftPerBox: "12.50",
        sft_per_box: "12.50",
        images: [
          "https://www.timexceramic.com/wp-content/uploads/2025/08/timex-ceramic-harlem-series-blue-wall-and-floor-tiles-shiny-finish-tiles-ambience.jpg",
        ],
        isActive: true,
        status: "Active",
        isNewArrival: true,
        is_new_arrival: true,
        showTileOfSpainBadge: false,
        show_tile_of_spain_badge: false,
        metaTitle: "",
        metaDescription: "",
        keywords: "",
      };

      setForm(initialData);
      initialFormJsonRef.current = JSON.stringify(initialData);
    }

    setActiveTab("general");
    setCustomImageUrl("");
    setNewSizeInput("");
    setNewColorInput("");
    setSaveStatus("idle");
    setSaveErrorMessage("");
    setShowDiscardConfirm(false);
  }, [editingProduct, isOpen]);

  if (!isOpen) return null;

  const handleRequestClose = () => {
    const isDirty = initialFormJsonRef.current ? JSON.stringify(form) !== initialFormJsonRef.current : false;
    if (isDirty && saveStatus !== "saved") {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => {
      const shouldUpdateSlug = !editingProduct || !prev.slug || prev.slug === slugify(prev.name || "");
      const newSlug = shouldUpdateSlug ? slugify(name) : prev.slug;
      const autoMetaTitle = prev.metaTitle === `${prev.name || ""} | Timex Ceramic` || !prev.metaTitle
        ? `${name} | Timex Ceramic`
        : prev.metaTitle;
      return {
        ...prev,
        name,
        slug: newSlug,
        metaTitle: autoMetaTitle,
      };
    });
  };

  const handleGenerateSlug = () => {
    if (form.name) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.name || "") }));
    }
  };

  // Image actions
  const handleAddImageUrl = (url: string) => {
    const clean = url.trim();
    if (!clean) return;
    if ((form.images || []).includes(clean)) return;
    setForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), clean],
    }));
    setCustomImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index),
    }));
  };

  const handleSetPrimaryImage = (index: number) => {
    setForm((prev) => {
      const arr = [...(prev.images || [])];
      const [chosen] = arr.splice(index, 1);
      return {
        ...prev,
        images: [chosen, ...arr],
      };
    });
  };

  const handleMoveImage = (fromIdx: number, toIdx: number) => {
    setForm((prev) => {
      const arr = [...(prev.images || [])];
      if (toIdx < 0 || toIdx >= arr.length) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return { ...prev, images: arr };
    });
  };

  const handleImageDrop = (targetIdx: number) => {
    if (draggedImageIndex === null || draggedImageIndex === targetIdx) {
      setDraggedImageIndex(null);
      setDragOverIndex(null);
      return;
    }
    handleMoveImage(draggedImageIndex, targetIdx);
    setDraggedImageIndex(null);
    setDragOverIndex(null);
  };

  // Batch Image Upload from Computer with Controlled Concurrency Queue (2 parallel workers)
  const handleBatchUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;

    setIsUploadingImages(true);
    setUploadProgressText(`Uploading 1 of ${totalFiles}...`);

    let completedCount = 0;
    const successfulUrls: string[] = [];
    const failedFiles: string[] = [];

    // Helper to upload a single file with automatic retry
    const uploadSingleFile = async (file: File): Promise<string | null> => {
      const doUpload = async () => {
        const formData = new FormData();
        formData.append("files", file);
        formData.append("uploadedBy", "admin");
        const res = await fetch("/api/v1/media/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.urls) && data.urls.length > 0) {
          return data.urls[0];
        } else if (data.success && data.media?.url) {
          return data.media.url;
        }
        return null;
      };

      try {
        const url = await doUpload();
        if (url) return url;
      } catch (_) {}

      // 1 retry attempt for transient network hiccup
      try {
        await new Promise((r) => setTimeout(r, 400));
        return await doUpload();
      } catch (_) {
        return null;
      }
    };

    // Concurrency pool with maximum 2 parallel uploads
    const CONCURRENCY = 2;
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < totalFiles) {
        const currentIndex = nextIndex++;
        const file = fileArray[currentIndex];
        
        setUploadProgressText(`Uploading ${completedCount + 1} of ${totalFiles}...`);
        const url = await uploadSingleFile(file);

        completedCount++;
        if (url) {
          successfulUrls.push(url);
          // Progressively append to form.images so the admin sees images populate immediately
          setForm((prev) => ({
            ...prev,
            images: [...(prev.images || []), url],
          }));
        } else {
          failedFiles.push(file.name);
        }

        setUploadProgressText(
          `Uploading ${Math.min(completedCount + 1, totalFiles)} of ${totalFiles}...`
        );
      }
    };

    // Run CONCURRENCY workers in parallel
    const workers = [];
    const actualConcurrency = Math.min(CONCURRENCY, totalFiles);
    for (let w = 0; w < actualConcurrency; w++) {
      workers.push(worker());
    }

    try {
      await Promise.all(workers);

      if (failedFiles.length === 0) {
        setUploadProgressText(`Successfully uploaded all ${successfulUrls.length} images!`);
      } else if (successfulUrls.length > 0) {
        setUploadProgressText(
          `Uploaded ${successfulUrls.length} of ${totalFiles} images (${failedFiles.length} failed).`
        );
      } else {
        setUploadProgressText("Failed to upload images. Please check your files.");
      }
      setTimeout(() => setUploadProgressText(""), 4000);
    } catch (err: any) {
      setUploadProgressText(`Error: ${err.message}`);
      setTimeout(() => setUploadProgressText(""), 4000);
    } finally {
      setIsUploadingImages(false);
    }
  };

  // Sizes management
  const handleRemoveSize = (index: number) => {
    setForm((prev) => {
      const removedSize = prev.availableSizes?.[index];
      const updated = (prev.availableSizes || []).filter((_, i) => i !== index);
      const copySizeImages = { ...(prev.sizeImages || {}) };
      if (removedSize) {
        delete copySizeImages[removedSize];
      }
      return {
        ...prev,
        availableSizes: updated,
        size: updated.length > 0 ? (prev.size === removedSize ? updated[0] : prev.size) : "",
        sizeImages: copySizeImages,
      };
    });
  };

  const handleAddSize = () => {
    const s = newSizeInput.trim();
    if (!s) return;
    if (!(form.availableSizes || []).includes(s)) {
      setForm((prev) => ({
        ...prev,
        availableSizes: [...(prev.availableSizes || []), s],
        size: prev.size || s,
      }));
    }
    setNewSizeInput("");
  };

  // Colours management
  const handleRemoveColor = (index: number) => {
    setForm((prev) => {
      const removedColor = prev.availableColors?.[index];
      const updated = (prev.availableColors || []).filter((_, i) => i !== index);
      const copyColorImages = { ...(prev.colorImages || {}) };
      const copyColorHexes = { ...(prev.colorHexes || {}) };
      const copyColor_Hexes = { ...(prev.color_hexes || {}) };
      if (removedColor) {
        delete copyColorImages[removedColor];
        delete copyColorHexes[removedColor];
        delete copyColor_Hexes[removedColor];
      }
      return {
        ...prev,
        availableColors: updated,
        color: updated.length > 0 ? (prev.color === removedColor ? updated[0] : prev.color) : "",
        colorImages: copyColorImages,
        colorHexes: copyColorHexes,
        color_hexes: copyColor_Hexes,
      };
    });
  };

  const handleAddColor = () => {
    const c = newColorInput.trim();
    if (!c) return;
    if (!(form.availableColors || []).includes(c)) {
      setForm((prev) => ({
        ...prev,
        availableColors: [...(prev.availableColors || []), c],
        color: prev.color || c,
      }));
    }
    setNewColorInput("");
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.name.trim()) {
      setActiveTab("general");
      alert("Product Name is required.");
      return;
    }

    const currentColors = (form.availableColors || []).map((c) => String(c).trim()).filter(Boolean);
    const currentSizes = (form.availableSizes || []).map((s) => String(s).trim()).filter(Boolean);

    const cleanColorImages: Record<string, string | string[]> = {};
    if (form.colorImages && typeof form.colorImages === "object") {
      currentColors.forEach((c) => {
        const val = form.colorImages![c];
        if (Array.isArray(val)) {
          const arr = val.filter((x): x is string => typeof x === "string" && Boolean(x.trim()));
          if (arr.length > 0) cleanColorImages[c] = arr;
        } else if (typeof val === "string" && val.trim()) {
          cleanColorImages[c] = val.trim();
        }
      });
    }

    const cleanColorHexes: Record<string, string> = {};
    const srcHexes = form.colorHexes || form.color_hexes;
    if (srcHexes && typeof srcHexes === "object") {
      currentColors.forEach((c) => {
        if (srcHexes[c]) cleanColorHexes[c] = srcHexes[c];
      });
    }

    const cleanSizeImages: Record<string, string> = {};
    if (form.sizeImages && typeof form.sizeImages === "object") {
      currentSizes.forEach((s) => {
        if (form.sizeImages![s]) cleanSizeImages[s] = form.sizeImages![s];
      });
    }

    const cleanSpaceImages: Record<string, string> = {};
    const srcSpaceImages = form.spaceImages || (form as any).space_images || {};
    if (srcSpaceImages && typeof srcSpaceImages === "object") {
      Object.entries(srcSpaceImages).forEach(([k, v]) => {
        if (typeof k === "string" && k.trim() && typeof v === "string" && v.trim()) {
          const trimmedKey = k.trim();
          const trimmedVal = v.trim();
          cleanSpaceImages[trimmedKey] = trimmedVal;
          const slugKey = slugify(trimmedKey);
          if (slugKey && !cleanSpaceImages[slugKey]) {
            cleanSpaceImages[slugKey] = trimmedVal;
          }
        }
      });
    }

    const finalForm: Partial<ProductItem> = {
      ...form,
      availableColors: currentColors,
      availableSizes: currentSizes,
      colorImages: cleanColorImages,
      colorHexes: cleanColorHexes,
      color_hexes: cleanColorHexes,
      sizeImages: cleanSizeImages,
      spaceImages: cleanSpaceImages,
      space_images: cleanSpaceImages,
      space_images_json: JSON.stringify(cleanSpaceImages),
      combinationImages: form.combinationImages || {},
      combinationProductMappings: form.combinationProductMappings || [],
      combination_product_mappings: form.combinationProductMappings || [],
      secondaryCategories: selectedSecondaryCategories,
      secondary_categories: selectedSecondaryCategories,
      secondary_categories_json: JSON.stringify(selectedSecondaryCategories),
      subcategories: selectedSubcategories,
      subcategories_json: JSON.stringify(selectedSubcategories),
      spaces: selectedSpaces,
      tilesBySpace: selectedSpaces.join(", "),
      tiles_by_space: selectedSpaces.join(", "),
      spaceArea: selectedSpaces.join(", "),
      tilesBySize: form.tilesBySize || form.tiles_by_size || "",
      tiles_by_size: form.tiles_by_size || form.tilesBySize || "",
      tilesBySizeList: form.tilesBySizeList || [],
      customTilesBySize: form.customTilesBySize || form.custom_tiles_by_size || "",
      custom_tiles_by_size: form.custom_tiles_by_size || form.customTilesBySize || "",
      isNewArrival: toBoolean(form.isNewArrival ?? form.is_new_arrival, false),
      is_new_arrival: toBoolean(form.isNewArrival ?? form.is_new_arrival, false),
      showTileOfSpainBadge: toBoolean(form.showTileOfSpainBadge ?? form.show_tile_of_spain_badge, false),
      show_tile_of_spain_badge: toBoolean(form.showTileOfSpainBadge ?? form.show_tile_of_spain_badge, false),
    };

    setSaveStatus("saving");
    setSaveErrorMessage("");

    try {
      await onSave(finalForm);
      setSaveStatus("saved");
      initialFormJsonRef.current = JSON.stringify(finalForm);
      setTimeout(() => {
        onClose();
        setSaveStatus("idle");
      }, 1200);
    } catch (err: any) {
      setSaveStatus("error");
      setSaveErrorMessage(err.message || "Failed to save product.");
    }
  };

  return createPortal(
    <div className="dark-scrollbars fixed inset-0 z-[9999] backdrop-blur-lg flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-[#0b101d] border border-white/10 rounded-2xl sm:rounded-3xl max-w-4xl w-full h-full max-h-full flex flex-col shadow-2xl overflow-hidden relative">
        {/* Modal Top Bar */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#0e1628]/95 z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest text-[#c5a880] font-extrabold uppercase">
                {editingProduct ? "Content Management System" : "Product Catalog"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  form.isActive ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-gray-500/20 text-gray-400"
                }`}
              >
                {form.isActive ? "Live Public" : "Draft / Hidden"}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5 truncate max-w-lg">
              {editingProduct ? `Edit: ${form.name || "Untitled Surface"}` : "Create New Tile Surface"}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Ribbons */}
        <div className="shrink-0 flex items-center gap-1 px-4 py-2 bg-[#090d16] border-b border-white/5 overflow-x-auto scrollbar-none z-10">
          {[
            { id: "general", label: "General & Classification" },
            { id: "specs", label: "Technical Specifications" },
            { id: "sizes-colors", label: `Sizes & Colours (${(form.availableSizes?.length || 0) + (form.availableColors?.length || 0)})` },
            { id: "description", label: "Description & Uses" },
            { id: "images", label: `Image Gallery & Video (${(form.images?.length || 0) + (form.videoEnabled && form.videoUrl ? 1 : 0)})` },
            { id: "seo", label: "SEO & Search" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#c5a880] text-black font-extrabold shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body + Pinned Footer Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Save Error Banner if save failed */}
          {saveStatus === "error" && saveErrorMessage && (
            <div className="shrink-0 mx-6 mt-3 p-3 bg-red-950/60 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="flex-1">{saveErrorMessage}</span>
              <button type="button" onClick={() => setSaveStatus("idle")} className="text-red-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Form Body Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* TAB 1: GENERAL & CLASSIFICATION */}
            {activeTab === "general" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Harlem Brick Series"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-200">URL Slug *</label>
                    <button
                      type="button"
                      onClick={handleGenerateSlug}
                      className="text-[10px] text-[#c5a880] hover:underline cursor-pointer"
                    >
                      Generate from Name
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-mono select-none">
                      /product/
                    </span>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                      placeholder="harlem-series"
                      className="w-full bg-[#111827] border border-white/10 rounded-xl pl-20 pr-4 py-2.5 text-xs text-[#c5a880] font-mono focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>
              </div>

              {/* Categories & Collection Classification */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#c5a880]" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Categories & Collection Classification
                    </h4>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    Primary + Secondary Categories & Collection
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 1. Primary Category */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-200">
                        Primary Category *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        className="text-[11px] font-semibold text-[#c5a880] hover:text-[#d4be9c] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{showAddCategory ? "Close" : "+ Add New Category"}</span>
                      </button>
                    </div>

                    {showAddCategory && (
                      <div className="mb-2 p-2.5 bg-[#0b101b] border border-[#c5a880]/30 rounded-xl space-y-2">
                        <div className="text-[11px] text-gray-300 font-medium">Create New Category:</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCategoryInput}
                            onChange={(e) => setNewCategoryInput(e.target.value)}
                            placeholder="e.g. Terrazzo / Microstone"
                            className="flex-1 bg-[#111827] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                          />
                          <button
                            type="button"
                            disabled={isAddingCategory || !newCategoryInput.trim()}
                            onClick={handleAddNewCategory}
                            className="px-3 py-1.5 bg-[#c5a880] text-black font-bold text-xs rounded-lg hover:bg-[#d4be9c] disabled:opacity-50 cursor-pointer"
                          >
                            {isAddingCategory ? "Adding..." : "Add"}
                          </button>
                        </div>
                        {newCategoryInput.trim() && (
                          <div className="text-[10px] text-gray-400 font-mono">
                            Auto-generated URL: <span className="text-[#c5a880]">/product-category/{newCategoryInput.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}/</span>
                          </div>
                        )}
                      </div>
                    )}

                    <select
                      value={form.categoryId}
                      onChange={(e) => {
                        const selectedCat = categoriesList.find((c) => c.id === e.target.value);
                        const catName = selectedCat ? selectedCat.name : "Stone Look";
                        setForm({
                          ...form,
                          categoryId: e.target.value,
                          category: catName,
                        });
                        // Automatically ensure primary category is never in additional categories
                        setSelectedSecondaryCategories((prev) => prev.filter((id) => id !== e.target.value));
                      }}
                      className="w-full bg-[#0d131f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    >
                      <optgroup label="Main Categories">
                        {categoriesList
                          .filter((c: any) => !c.parentId)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.url || `/product-category/${c.slug}`})
                            </option>
                          ))}
                      </optgroup>
                      {categoriesList.some((c: any) => Boolean(c.parentId)) && (
                        <optgroup label="Subcategories">
                          {categoriesList
                            .filter((c: any) => Boolean(c.parentId))
                            .map((c: any) => (
                              <option key={c.id} value={c.id}>
                                ↳ {c.name} (under {c.parentName || c.parentId})
                              </option>
                            ))}
                        </optgroup>
                      )}
                    </select>

                    {form.categoryId && (
                      <div className="text-[10px] text-gray-400 mt-1 font-mono flex items-center justify-between">
                        <span>Canonical URL: <span className="text-[#c5a880]">/product-category/{categoriesList.find((c) => c.id === form.categoryId)?.slug || form.categoryId.replace(/^cat-/, "")}/</span></span>
                        <span className="text-[9px] text-emerald-400 font-sans font-semibold">Determines Breadcrumbs</span>
                      </div>
                    )}
                  </div>

                  {/* 2. Collection Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-gray-200">
                        Collection Name *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddCollection(!showAddCollection)}
                        className="text-[11px] font-semibold text-[#c5a880] hover:text-[#d4be9c] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{showAddCollection ? "Close" : "+ Add New Collection"}</span>
                      </button>
                    </div>

                    {showAddCollection && (
                      <div className="mb-2 p-2.5 bg-[#0b101b] border border-[#c5a880]/30 rounded-xl space-y-2">
                        <div className="text-[11px] text-gray-300 font-medium">Create New Collection:</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCollectionInput}
                            onChange={(e) => setNewCollectionInput(e.target.value)}
                            placeholder="e.g. Minimalist Stone"
                            className="flex-1 bg-[#111827] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                          />
                          <button
                            type="button"
                            disabled={isAddingCollection || !newCollectionInput.trim()}
                            onClick={handleAddNewCollection}
                            className="px-3 py-1.5 bg-[#c5a880] text-black font-bold text-xs rounded-lg hover:bg-[#d4be9c] disabled:opacity-50 cursor-pointer"
                          >
                            {isAddingCollection ? "Adding..." : "Add"}
                          </button>
                        </div>
                      </div>
                    )}

                    <select
                      value={form.collectionId || ""}
                      onChange={(e) => {
                        const selectedColl = collectionsList.find((c) => c.id === e.target.value);
                        const collName = selectedColl ? selectedColl.name : e.target.value;
                        setForm({
                          ...form,
                          collectionId: e.target.value,
                          collection: collName,
                        });
                      }}
                      className="w-full bg-[#0d131f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    >
                      {collectionsList.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Additional Categories (Searchable Multi-select with Checkboxes & Removable Chips) */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-200">
                          Additional Categories (Multi-Select)
                        </label>
                        {selectedSecondaryCategories.length > 0 && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#c5a880]/20 text-[#c5a880] border border-[#c5a880]/30">
                            {selectedSecondaryCategories.length} Additional Categories
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Product will appear on each assigned category page and filter. Primary category is automatically excluded.
                      </p>
                    </div>

                    {selectedSecondaryCategories.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedSecondaryCategories([])}
                        className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer self-start sm:self-auto"
                      >
                        Clear Additional Categories
                      </button>
                    )}
                  </div>

                  {/* Selected Categories Removable Chips/Tags */}
                  {selectedSecondaryCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[#090d16] border border-white/5 rounded-xl">
                      {selectedSecondaryCategories.map((catId) => {
                        const catObj = categoriesList.find((c) => {
                          const norm = String(catId).toLowerCase().trim().replace(/^cat-/, "");
                          return (
                            c.id.toLowerCase() === norm ||
                            c.slug.toLowerCase() === norm ||
                            c.name.toLowerCase() === norm ||
                            c.id.toLowerCase() === String(catId).toLowerCase()
                          );
                        });
                        const catName = catObj ? catObj.name : catId;
                        return (
                          <span
                            key={catId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/30 transition-all hover:bg-[#c5a880]/25"
                          >
                            <span>{catName}</span>
                            <button
                              type="button"
                              onClick={() => handleToggleSecondaryCategory(catId)}
                              className="text-gray-400 hover:text-white rounded-full p-0.5 hover:bg-black/30 transition-colors cursor-pointer"
                              title={`Remove ${catName}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Searchable Multi-Select Dropdown Container */}
                  <div className="space-y-2 bg-[#0d131f] border border-white/10 rounded-xl p-3">
                    {/* Search Input Filter */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={categorySearchTerm}
                        onChange={(e) => setCategorySearchTerm(e.target.value)}
                        placeholder="Search additional categories by name or keyword..."
                        className="w-full bg-[#111827] border border-white/10 rounded-lg pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
                      />
                      {categorySearchTerm && (
                        <button
                          type="button"
                          onClick={() => setCategorySearchTerm("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Scrollable Checkbox List */}
                    <div className="max-h-48 overflow-y-auto divide-y divide-white/5 rounded-lg border border-white/5 bg-[#090d16] p-1">
                      {categoriesList
                        .filter((c) => c.id !== form.categoryId && c.slug !== form.categoryId)
                        .filter((c) => !categorySearchTerm.trim() || c.name.toLowerCase().includes(categorySearchTerm.toLowerCase()) || c.slug.toLowerCase().includes(categorySearchTerm.toLowerCase()))
                        .map((cat) => {
                          const isSelected = selectedSecondaryCategories.some((sc) => {
                            const norm = String(sc).toLowerCase().trim().replace(/^cat-/, "");
                            const targetId = String(cat.id).toLowerCase().trim().replace(/^cat-/, "");
                            const targetSlug = String(cat.slug).toLowerCase().trim();
                            const targetName = String(cat.name).toLowerCase().trim();
                            return norm === targetId || norm === targetSlug || norm === targetName;
                          });
                          return (
                            <label
                              key={cat.id}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none ${
                                isSelected ? "bg-[#c5a880]/10 text-white" : "hover:bg-white/5 text-gray-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSecondaryCategory(cat.id)}
                                className="w-4 h-4 rounded border-gray-600 text-[#c5a880] focus:ring-[#c5a880] bg-[#111827] cursor-pointer"
                              />
                              <div className="flex-1 flex items-center justify-between min-w-0">
                                <span className={`text-xs ${isSelected ? "text-[#c5a880] font-bold" : "text-gray-200"}`}>
                                  {cat.name}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono hidden sm:inline truncate ml-2">
                                  /product-category/{cat.slug}/
                                </span>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* 4. Subcategories Assignment Section (Structured by Category) */}
                <div className="pt-3 border-t border-white/5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-200">
                          Subcategories Assignment
                        </label>
                        {selectedSubcategories.length > 0 && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {selectedSubcategories.length} Subcategories Assigned
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Assign structured subcategories under the relevant primary and additional categories.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddSubcategory(!showAddSubcategory);
                          if (!newSubcategoryTargetCategory && form.categoryId) {
                            setNewSubcategoryTargetCategory(form.categoryId);
                          }
                        }}
                        className="text-[11px] font-semibold text-[#c5a880] hover:text-[#d4be9c] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{showAddSubcategory ? "Close" : "+ Add Custom Subcategory"}</span>
                      </button>

                      {selectedSubcategories.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedSubcategories([])}
                          className="text-[10px] text-red-400 hover:text-red-300 font-semibold transition-colors cursor-pointer ml-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline New Subcategory Creator */}
                  {showAddSubcategory && (
                    <div className="p-3 bg-[#0b101b] border border-[#c5a880]/30 rounded-xl space-y-2">
                      <div className="text-[11px] text-gray-300 font-medium">Add New Subcategory:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Parent Category:</label>
                          <select
                            value={newSubcategoryTargetCategory || form.categoryId || "brick"}
                            onChange={(e) => setNewSubcategoryTargetCategory(e.target.value)}
                            className="w-full bg-[#111827] border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                          >
                            <option value={form.categoryId}>
                              Primary: {categoriesList.find((c) => c.id === form.categoryId)?.name || form.categoryId}
                            </option>
                            {selectedSecondaryCategories.map((scId) => {
                              const scObj = categoriesList.find((c) => c.id === scId);
                              return (
                                <option key={scId} value={scId}>
                                  Additional: {scObj?.name || scId}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div className="sm:col-span-2 flex items-end gap-2">
                          <div className="flex-1">
                            <label className="text-[10px] text-gray-400 block mb-1">Subcategory Name:</label>
                            <input
                              type="text"
                              value={newSubcategoryInput}
                              onChange={(e) => setNewSubcategoryInput(e.target.value)}
                              placeholder="e.g. Handmade Reclaimed Brick"
                              className="w-full bg-[#111827] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                            />
                          </div>
                          <button
                            type="button"
                            disabled={isAddingSubcategory || !newSubcategoryInput.trim()}
                            onClick={() => handleAddNewSubcategory(newSubcategoryTargetCategory || form.categoryId || "brick")}
                            className="px-4 py-1.5 bg-[#c5a880] text-black font-bold text-xs rounded-lg hover:bg-[#d4be9c] disabled:opacity-50 cursor-pointer h-[32px]"
                          >
                            {isAddingSubcategory ? "Adding..." : "Add"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selected Subcategories Chips */}
                  {selectedSubcategories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-[#090d16] border border-white/5 rounded-xl">
                      {selectedSubcategories.map((subName) => (
                        <span
                          key={subName}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span>{subName}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSubcategory(subName)}
                            className="text-gray-400 hover:text-white rounded-full p-0.5 hover:bg-black/30 transition-colors cursor-pointer"
                            title={`Remove ${subName}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Subcategories Grouped by Active Categories */}
                  <div className="space-y-2.5">
                    {/* Render Group for Primary Category */}
                    {(() => {
                      const primId = (form.categoryId || "brick").toLowerCase().replace(/^cat-/, "");
                      const primObj = categoriesList.find((c) => c.id === form.categoryId || c.slug === primId);
                      const primName = primObj ? primObj.name : "Primary Category";
                      const availableSubcats = subcategoriesByCategory[primId] || DEFAULT_SUBCATEGORIES_BY_CATEGORY[primId] || [];

                      return (
                        <div key={`prim-${primId}`} className="p-3 bg-[#0d131f] border border-white/10 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#c5a880] text-black uppercase tracking-wider">
                                Primary Category
                              </span>
                              <span className="text-xs font-bold text-white">{primName}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {availableSubcats.filter((s) => selectedSubcategories.includes(s)).length} of {availableSubcats.length} selected
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {availableSubcats.map((sub) => {
                              const isSelected = selectedSubcategories.includes(sub);
                              return (
                                <button
                                  type="button"
                                  key={sub}
                                  onClick={() => handleToggleSubcategory(sub)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isSelected
                                      ? "bg-emerald-500 text-black font-extrabold shadow-xs"
                                      : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5"
                                  }`}
                                >
                                  {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-gray-500" />}
                                  <span>{sub}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Render Group for Each Additional Category */}
                    {selectedSecondaryCategories.map((secId) => {
                      const cleanSecId = secId.toLowerCase().replace(/^cat-/, "");
                      const secObj = categoriesList.find((c) => c.id === secId || c.slug === cleanSecId);
                      const secName = secObj ? secObj.name : secId;
                      const availableSubcats = subcategoriesByCategory[cleanSecId] || DEFAULT_SUBCATEGORIES_BY_CATEGORY[cleanSecId] || [];

                      return (
                        <div key={`sec-${cleanSecId}`} className="p-3 bg-[#0d131f] border border-white/10 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                                Additional Category
                              </span>
                              <span className="text-xs font-bold text-white">{secName}</span>
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {availableSubcats.filter((s) => selectedSubcategories.includes(s)).length} of {availableSubcats.length} selected
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {availableSubcats.map((sub) => {
                              const isSelected = selectedSubcategories.includes(sub);
                              return (
                                <button
                                  type="button"
                                  key={sub}
                                  onClick={() => handleToggleSubcategory(sub)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                                    isSelected
                                      ? "bg-emerald-500 text-black font-extrabold shadow-xs"
                                      : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5"
                                  }`}
                                >
                                  {isSelected ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-gray-500" />}
                                  <span>{sub}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tiles by Space / Area (Multi-Select) */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-200">
                        Tiles by Space / Area (Select 2 or more)
                      </label>
                      {selectedSpaces.length > 0 && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {selectedSpaces.length} Spaces Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Assign spaces where this tile can be applied. Selected spaces link automatically to space filter pages and highlight on the product page.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedSpaces.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSpaces([]);
                          setForm((f) => ({
                            ...f,
                            tilesBySpace: "",
                            tiles_by_space: "",
                            spaceArea: "",
                            spaces: [],
                          }));
                        }}
                        className="text-[11px] text-gray-400 hover:text-red-400 cursor-pointer transition-colors"
                      >
                        Clear All
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddSpace(!showAddSpace)}
                      className="text-[11px] font-semibold text-[#c5a880] hover:text-[#d4be9c] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showAddSpace ? "Close" : "+ Add New Space"}</span>
                    </button>
                  </div>
                </div>

                {showAddSpace && (
                  <div className="p-3 bg-[#0b101b] border border-[#c5a880]/30 rounded-xl space-y-2">
                    <div className="text-[11px] text-gray-300 font-medium">Create New Space / Area:</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSpaceInput}
                        onChange={(e) => setNewSpaceInput(e.target.value)}
                        placeholder="e.g. Master Balcony Tiles"
                        className="flex-1 bg-[#111827] border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                      />
                      <button
                        type="button"
                        disabled={isAddingSpace || !newSpaceInput.trim()}
                        onClick={handleAddNewSpace}
                        className="px-3 py-1.5 bg-[#c5a880] text-black font-bold text-xs rounded-lg hover:bg-[#d4be9c] disabled:opacity-50 cursor-pointer"
                      >
                        {isAddingSpace ? "Adding..." : "Add Space"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Space Badges */}
                {selectedSpaces.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSpaces.map((space) => (
                      <span
                        key={space}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                      >
                        <Check className="w-3 h-3 stroke-[2.5]" />
                        <span>{space}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSpace(space)}
                          className="text-emerald-400/70 hover:text-red-400 cursor-pointer ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-gray-500 italic">
                    No space assigned. The space specification will be hidden from the public product page.
                  </div>
                )}

                {/* Spaces Quick-Toggle Grid */}
                <div className="pt-2">
                  <div className="text-[11px] font-semibold text-gray-400 mb-2">
                    Click to add or remove spaces:
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2.5 rounded-xl bg-[#0d131f] border border-white/5">
                    {spacesList.map((space) => {
                      const isSelected = selectedSpaces.includes(space);
                      return (
                        <button
                          type="button"
                          key={space}
                          onClick={() => handleToggleSpace(space)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-emerald-600 text-white font-bold shadow-xs border border-emerald-500"
                              : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/5"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[2.5]" />}
                          <span>{space}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* PDF Catalogue */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-200">Catalogue / Brochure (PDF)</label>
                    <p className="text-[11px] text-gray-400">
                      Select or upload a PDF catalogue. If &quot;No Catalogue&quot; is selected, the Download button is hidden on the website.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaPickerTarget({ type: "catalogue" })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a880]/15 hover:bg-[#c5a880]/25 text-[#c5a880] border border-[#c5a880]/30 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Select from Media</span>
                    </button>
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0">
                      {isUploadingCatalogue ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingCatalogue ? "Uploading..." : "+ Upload PDF"}</span>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        disabled={isUploadingCatalogue}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCatalogueUpload(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <select
                      value={form.catalogueUrl || ""}
                      onChange={(e) => {
                        const selectedUrl = e.target.value;
                        const matchCat = catalogues.find((c) => c.url === selectedUrl);
                        setForm((prev) => ({
                          ...prev,
                          catalogueUrl: selectedUrl,
                          catalogue_url: selectedUrl,
                          catalogue: selectedUrl,
                          productPdf: selectedUrl,
                          catalogueMediaId: matchCat ? matchCat.id : "",
                          catalogueName: matchCat ? matchCat.name : "",
                        }));
                      }}
                      className="w-full bg-[#0d131f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                    >
                      <option value="">No Catalogue (Hidden on public page)</option>
                      {catalogues.map((cat) => (
                        <option key={cat.id || cat.url} value={cat.url}>
                          {cat.name} {cat.sizeFormatted ? `(${cat.sizeFormatted})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.catalogueUrl ? (
                    <div className="flex items-center justify-between px-3 py-2 bg-[#0d131f] border border-[#c5a880]/30 rounded-xl text-xs">
                      <div className="flex items-center gap-2 truncate text-gray-300">
                        <FileText className="w-4 h-4 text-[#c5a880] shrink-0" />
                        <span className="truncate">{form.catalogueName || form.catalogueUrl.split("/").pop()}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <a
                          href={form.catalogueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#c5a880] hover:underline text-[11px]"
                        >
                          Preview
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              catalogueUrl: "",
                              catalogue_url: "",
                              catalogue: "",
                              productPdf: "",
                              catalogueName: "",
                              catalogueMediaId: "",
                            }))
                          }
                          className="text-gray-400 hover:text-red-400 text-[11px] cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-gray-500 italic flex items-center px-1">
                      No PDF attached. The public page will not show any catalogue download button.
                    </div>
                  )}
                </div>
              </div>

              {/* Product Video Section */}
              <ProductVideoSection form={form} setForm={setForm} />

              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">Publishing Status *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: true, status: "Active" })}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      form.isActive
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                        : "bg-[#111827] border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      {form.isActive && <Check className="w-3.5 h-3.5" />}
                      <span>Active (Live on Website)</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">Visible across catalogue, search, and collection pages.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: false, status: "Inactive" })}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      !form.isActive
                        ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                        : "bg-[#111827] border-white/10 text-gray-400 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      {!form.isActive && <Check className="w-3.5 h-3.5" />}
                      <span>Inactive (Draft / Hidden)</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">Hidden from public website; preserved safely in database.</div>
                  </button>
                </div>
              </div>

              {/* Product Badges & Marketing Tags */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-200">
                      Product Showcase Tag
                    </label>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Configure automated showcase tag. Products marked New Arrival automatically appear in the homepage Latest Collections section.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {Boolean(form.isNewArrival || form.is_new_arrival) && (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-[#C95745]/20 text-[#C95745] border border-[#C95745]/30 shadow-xs">
                        ✨ NEW ACTIVE
                      </span>
                    )}
                    {Boolean(form.showTileOfSpainBadge || form.show_tile_of_spain_badge) && (
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md bg-red-600/20 text-red-400 border border-red-500/30 shadow-xs flex items-center gap-1">
                        TILE OF SPAIN
                      </span>
                    )}
                    {!Boolean(form.isNewArrival || form.is_new_arrival) && !Boolean(form.showTileOfSpainBadge || form.show_tile_of_spain_badge) && (
                      <span className="text-[10px] text-gray-400 italic bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
                        No active tag (Regular Product)
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  {/* NEW ARRIVAL TOGGLE */}
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      Boolean(form.isNewArrival || form.is_new_arrival)
                        ? "bg-[#C95745]/10 border-[#C95745]/40 text-white shadow-xs"
                        : "bg-[#0c1220] border-white/10 text-gray-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              Boolean(form.isNewArrival || form.is_new_arrival)
                                ? "text-[#C95745]"
                                : "text-gray-300"
                            }`}
                          >
                            New Arrival
                          </span>
                          {Boolean(form.isNewArrival || form.is_new_arrival) ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#C95745] text-white">
                              NEW ACTIVE
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-500 font-medium">
                              OFF
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">
                          When ON, displays the NEW badge on product cards across the website and automatically includes this product in the homepage Latest Collections section.
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0 mt-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              isNewArrival: true,
                              is_new_arrival: true,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            Boolean(form.isNewArrival || form.is_new_arrival)
                              ? "bg-[#C95745] text-white shadow-md font-extrabold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          ON
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              isNewArrival: false,
                              is_new_arrival: false,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            !Boolean(form.isNewArrival || form.is_new_arrival)
                              ? "bg-white/15 text-gray-200 border border-white/20 font-extrabold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          OFF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TILE OF SPAIN BADGE TOGGLE */}
                  <div
                    className={`p-4 rounded-xl border transition-all mt-3 ${
                      Boolean(form.showTileOfSpainBadge || form.show_tile_of_spain_badge)
                        ? "bg-red-950/20 border-red-500/40 text-white shadow-xs"
                        : "bg-[#0c1220] border-white/10 text-gray-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold ${
                              Boolean(form.showTileOfSpainBadge || form.show_tile_of_spain_badge)
                                ? "text-red-400"
                                : "text-gray-300"
                            }`}
                          >
                            Show Tile of Spain Badge
                          </span>
                          {Boolean(form.showTileOfSpainBadge || form.show_tile_of_spain_badge) ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-600 text-white">
                              ENABLED
                            </span>
                          ) : (
                            <span className="text-[9px] text-gray-500 font-medium">
                              DISABLED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">
                          When enabled, displays the official Tile of Spain logo at the bottom-left corner of this product&apos;s images on cards and detail page.
                        </p>
                        {Boolean(form.showTileOfSpainBadge || form.show_tile_of_spain_badge) && (
                          <div className="pt-2 flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">Badge Preview:</span>
                            <div className="p-1.5 bg-black/50 rounded-md border border-white/10 inline-flex items-center">
                              <img
                                src="/images/tile-of-spain.png"
                                alt="Tile of Spain Preview"
                                className="w-16 h-auto aspect-[2/1] object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 shrink-0 mt-0.5">
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              showTileOfSpainBadge: true,
                              show_tile_of_spain_badge: true,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            Boolean(form.showTileOfSpainBadge || form.show_tile_of_spain_badge)
                              ? "bg-red-600 text-white shadow-md font-extrabold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Enable
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              showTileOfSpainBadge: false,
                              show_tile_of_spain_badge: false,
                            }))
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            !Boolean(form.showTileOfSpainBadge || form.show_tile_of_spain_badge)
                              ? "bg-white/15 text-gray-200 border border-white/20 font-extrabold"
                              : "text-gray-400 hover:text-white"
                          }`}
                        >
                          Disable
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL SPECIFICATIONS */}
          {activeTab === "specs" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">Primary Dimension / Size</label>
                  <input
                    type="text"
                    value={form.size || ""}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                    placeholder="e.g. 150mm X 450mm or 400mm X 600mm"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">Thickness</label>
                  <input
                    type="text"
                    value={form.thickness || ""}
                    onChange={(e) => setForm({ ...form, thickness: e.target.value })}
                    placeholder="e.g. 9 mm or 15 mm"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              {/* Tiles By Size Section */}
              <TilesBySizeField
                value={form.tilesBySize || form.tiles_by_size || ""}
                sizes={form.tilesBySizeList || []}
                customSize={form.customTilesBySize || form.custom_tiles_by_size || ""}
                onChange={(sizeData) => setForm((prev) => ({ ...prev, ...sizeData }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SpecDropdownField
                  label="Surface Finish"
                  value={form.finish || ""}
                  onChange={(val) => setForm({ ...form, finish: val })}
                  options={FINISHES}
                  helpText="Select standard finish or choose Custom."
                />

                <SpecDropdownField
                  label="Body Material"
                  value={form.material || ""}
                  onChange={(val) => setForm({ ...form, material: val })}
                  options={MATERIALS}
                  helpText="Select porcelain/vitrified type or choose Custom."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SpecDropdownField
                  label="Origin / Provenance"
                  value={form.origin || ""}
                  onChange={(val) => setForm({ ...form, origin: val })}
                  options={ORIGINS}
                  helpText="Select origin standard or choose Custom."
                />

                <SpecDropdownField
                  label="Sft/Box"
                  value={form.sftPerBox || form.sft_per_box || ""}
                  onChange={(val) => setForm({ ...form, sftPerBox: val, sft_per_box: val })}
                  options={COMMON_SFT_PER_BOX}
                  placeholder="Select or enter sq. ft. per box..."
                  helpText="Square feet covered per box (e.g. 12.50). Positive numeric value only."
                  isNumeric={true}
                />
              </div>

              {/* Tiles by Shape Section */}
              <TilesByShapeField
                value={form.shape || form.tilesByShape || ""}
                shapes={form.shapes || []}
                customShape={form.customShape || form.custom_shape || ""}
                onChange={(shapeData) => setForm((prev) => ({ ...prev, ...shapeData }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">Kg. per Box</label>
                  <input
                    type="text"
                    value={form.kgPerBox || ""}
                    onChange={(e) => setForm({ ...form, kgPerBox: e.target.value, weight: e.target.value })}
                    placeholder="e.g. 21 or 28"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">Pcs per Box</label>
                  <input
                    type="text"
                    value={form.pcsPerBox || ""}
                    onChange={(e) => setForm({ ...form, pcsPerBox: e.target.value, packingDetails: e.target.value })}
                    placeholder="e.g. 16 or 5"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              {/* Product Color (Multi-Select) in Technical Specifications */}
              <TechnicalSpecsColorField
                selectedColors={form.availableColors || []}
                colorHexes={form.colorHexes || form.color_hexes || {}}
                onChange={(colors) => {
                  setForm((prev) => ({
                    ...prev,
                    availableColors: colors,
                    color: colors[0] || "",
                  }));
                }}
                onHexesChange={(hexes) => {
                  setForm((prev) => ({
                    ...prev,
                    colorHexes: hexes,
                    color_hexes: hexes,
                  }));
                }}
              />
            </div>
          )}

          {/* TAB 3: SIZES & COLOURS */}
          {activeTab === "sizes-colors" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Available Sizes Section */}
              <div className="space-y-3 p-4 bg-[#0d1424] border border-white/10 rounded-2xl">
                <div>
                  <label className="text-xs font-bold text-gray-200 block">
                    Available Sizes ({form.availableSizes?.length || 0})
                  </label>
                  <p className="text-[11px] text-gray-400">
                    Each size can optionally have its own specific image visual assigned. If unassigned, it smoothly defaults to the product gallery cover.
                  </p>
                </div>

                {/* Sizes List with Image Mapping */}
                <div className="space-y-2 pt-1">
                  {(form.availableSizes || []).length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-2">No sizes configured yet. Add a size below.</p>
                  ) : (
                    (form.availableSizes || []).map((size, idx) => {
                      const assignedImg = form.sizeImages?.[size];
                      return (
                        <div
                          key={`${size}-${idx}`}
                          className="flex items-center justify-between p-2.5 bg-[#111827] border border-white/10 rounded-xl hover:border-white/20 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0">
                              {assignedImg ? (
                                <img
                                  src={getAdminThumbnailUrl(assignedImg, 120)}
                                  alt={size}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    if (e.currentTarget.src !== assignedImg) {
                                      e.currentTarget.src = assignedImg;
                                    }
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-mono font-bold text-white block">{size}</span>
                              <span className="text-[10px] text-gray-400">
                                {assignedImg ? (
                                  <span className="text-emerald-400">Custom Image Assigned</span>
                                ) : (
                                  "Default gallery cover"
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setGalleryPickerTarget({ type: "size", key: size })}
                              className="px-2.5 py-1 bg-white/5 hover:bg-[#c5a880] hover:text-black text-gray-300 text-xs font-medium rounded-lg border border-white/10 transition-colors cursor-pointer"
                            >
                              {assignedImg ? "Change Image" : "Assign Image"}
                            </button>
                            {assignedImg && (
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((prev) => {
                                    const copy = { ...(prev.sizeImages || {}) };
                                    delete copy[size];
                                    return { ...prev, sizeImages: copy };
                                  });
                                }}
                                className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                                title="Reset to default gallery image"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveSize(idx)}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                              title={`Remove size ${size}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Size Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={newSizeInput}
                    onChange={(e) => setNewSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSize();
                      }
                    }}
                    placeholder="Enter size (e.g. 800x1600 mm or 400mm X 600mm)..."
                    className="flex-1 bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#c5a880]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSize}
                    className="px-4 py-2 bg-[#c5a880] hover:bg-[#b09166] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#c5a880]/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Size</span>
                  </button>
                </div>

                {/* Quick Add Common Sizes */}
                <div className="pt-2">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Quick Add Presets:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_SIZES.filter((s) => !(form.availableSizes || []).includes(s)).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            availableSizes: [...(prev.availableSizes || []), s],
                            size: prev.size || s,
                          }));
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-mono border border-white/5 transition-colors cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Available Colours Section */}
              <div className="space-y-3 p-4 bg-[#0d1424] border border-white/10 rounded-2xl">
                <div>
                  <label className="text-xs font-bold text-gray-200 block">
                    Available Colours ({form.availableColors?.length || 0})
                  </label>
                  <p className="text-[11px] text-gray-400">
                    Each colour can optionally have its own specific image visual assigned. Clicking a colour swatch on the public product page will display this image.
                  </p>
                </div>

                {/* Colours List with Color Picker & Image Mapping */}
                <div className="space-y-3 pt-1">
                  {(form.availableColors || []).length === 0 ? (
                    <p className="text-xs text-gray-500 italic py-2">No colours configured yet. Add a colour below.</p>
                  ) : (
                    (form.availableColors || []).map((color, idx) => {
                      const colorPhotos: string[] = (() => {
                        const raw = form.colorImages?.[color];
                        if (!raw) return [];
                        if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string" && Boolean(x.trim()));
                        if (typeof raw === "string" && raw.trim()) return [raw.trim()];
                        return [];
                      })();
                      const primaryImg = colorPhotos[0] || null;
                      const hexColor = form.colorHexes?.[color] || form.color_hexes?.[color] || getColorPreview(color);

                      return (
                        <div
                          key={`${color}-${idx}`}
                          className="flex flex-col p-4 bg-[#111827] border border-white/10 rounded-2xl gap-3.5 hover:border-white/20 transition-all"
                        >
                          {/* Row Top Header: Swatch, Name, Hex & Action Controls */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            {/* Color Swatch Picker & Color Name */}
                            <div className="flex items-center gap-3">
                              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                                {primaryImg ? (
                                  <img
                                    src={getAdminThumbnailUrl(primaryImg, 120)}
                                    alt={color}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      if (e.currentTarget.src !== primaryImg) {
                                        e.currentTarget.src = primaryImg;
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <ImageIcon className="w-5 h-5" />
                                  </div>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-white">{color}</span>
                                  <div className="flex items-center gap-1.5 bg-black/50 px-2 py-0.5 rounded-lg border border-white/10 shrink-0">
                                    <input
                                      type="color"
                                      value={hexColor.startsWith("#") ? hexColor : "#ffffff"}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setForm((prev) => ({
                                          ...prev,
                                          colorHexes: { ...(prev.colorHexes || {}), [color]: val },
                                          color_hexes: { ...(prev.color_hexes || {}), [color]: val },
                                        }));
                                      }}
                                      className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-0 p-0 shadow-xs shrink-0"
                                      title={`Click to pick hex color for ${color} circle swatch`}
                                    />
                                    <input
                                      type="text"
                                      value={hexColor}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setForm((prev) => ({
                                          ...prev,
                                          colorHexes: { ...(prev.colorHexes || {}), [color]: val },
                                          color_hexes: { ...(prev.color_hexes || {}), [color]: val },
                                        }));
                                      }}
                                      className="w-16 bg-transparent border-0 text-[10px] font-mono text-gray-200 font-bold uppercase focus:outline-none focus:bg-white/10 rounded px-1"
                                      placeholder="#ffffff"
                                      title="Type or edit HEX color code (e.g. #ffffff, #b88e4f)"
                                    />
                                  </div>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                  {colorPhotos.length === 0 ? (
                                    <span className="text-[10px] text-gray-500">No specific photo assigned</span>
                                  ) : colorPhotos.length === 1 ? (
                                    <span className="text-[10px] text-emerald-400 font-medium inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                      1 photo assigned (Primary)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                                      {colorPhotos.length} photos assigned (1st is primary)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons: Add Photo Dropdown, Manage/Media, Clear, Remove Colour */}
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                              <select
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  setForm((prev) => {
                                    const raw = prev.colorImages?.[color];
                                    const current = Array.isArray(raw)
                                      ? [...raw]
                                      : (typeof raw === "string" && raw ? [raw] : []);
                                    if (current.includes(val)) return prev;
                                    return {
                                      ...prev,
                                      colorImages: {
                                        ...(prev.colorImages || {}),
                                        [color]: [...current, val],
                                      },
                                    };
                                  });
                                }}
                                className="bg-[#0c1220] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-[#c5a880] cursor-pointer"
                              >
                                <option value="">+ Add Gallery Photo...</option>
                                {(form.images || []).map((imgUrl, imgIdx) => (
                                  <option key={imgUrl} value={imgUrl} disabled={colorPhotos.includes(imgUrl)}>
                                    Photo {imgIdx + 1} {colorPhotos.includes(imgUrl) ? "(Added)" : ""}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => setGalleryPickerTarget({ type: "color", key: color })}
                                className="px-3 py-1.5 bg-[#c5a880]/15 hover:bg-[#c5a880] hover:text-black text-[#c5a880] text-xs font-semibold rounded-xl border border-[#c5a880]/30 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>{colorPhotos.length > 0 ? "Select Photos" : "Assign Photos"}</span>
                              </button>

                              {colorPhotos.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm((prev) => {
                                      const copy = { ...(prev.colorImages || {}) };
                                      delete copy[color];
                                      return { ...prev, colorImages: copy };
                                    });
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                                  title={`Remove all photos for ${color}`}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveColor(idx)}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                                title={`Remove colour ${color}`}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Multi-Photo Thumbnails Strip */}
                          {colorPhotos.length > 0 && (
                            <div className="pt-2 border-t border-white/5">
                              <div className="flex flex-wrap items-center gap-2">
                                {colorPhotos.map((photoUrl, pIdx) => (
                                  <div
                                    key={`${photoUrl}-${pIdx}`}
                                    className="relative group w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/15 hover:border-[#c5a880] transition-all shrink-0"
                                  >
                                    <img
                                      src={getAdminThumbnailUrl(photoUrl, 120)}
                                      alt={`${color} visual ${pIdx + 1}`}
                                      loading="lazy"
                                      decoding="async"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        if (e.currentTarget.src !== photoUrl) {
                                          e.currentTarget.src = photoUrl;
                                        }
                                      }}
                                    />
                                    {/* Number / Primary Badge */}
                                    <span
                                      className={`absolute top-0.5 left-0.5 px-1 py-0.5 rounded text-[8px] font-mono font-bold leading-tight ${
                                        pIdx === 0
                                          ? "bg-[#c5a880] text-black"
                                          : "bg-black/75 text-white"
                                      }`}
                                    >
                                      {pIdx === 0 ? "★1" : `#${pIdx + 1}`}
                                    </span>
                                    {/* Delete Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setForm((prev) => {
                                          const raw = prev.colorImages?.[color];
                                          const current = Array.isArray(raw)
                                            ? raw
                                            : (typeof raw === "string" && raw ? [raw] : []);
                                          const updated = current.filter((_, i) => i !== pIdx);
                                          const copy = { ...(prev.colorImages || {}) };
                                          if (updated.length > 0) copy[color] = updated;
                                          else delete copy[color];
                                          return { ...prev, colorImages: copy };
                                        });
                                      }}
                                      className="absolute top-0.5 right-0.5 p-0.5 rounded-md bg-black/80 hover:bg-red-600 text-gray-300 hover:text-white transition-colors cursor-pointer"
                                      title={`Remove photo #${pIdx + 1} from ${color}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}

                                {/* Quick inline + Add Photo button */}
                                <button
                                  type="button"
                                  onClick={() => setGalleryPickerTarget({ type: "color", key: color })}
                                  className="w-12 h-12 rounded-xl border border-dashed border-white/20 hover:border-[#c5a880] hover:bg-[#c5a880]/10 flex flex-col items-center justify-center text-gray-400 hover:text-[#c5a880] transition-colors cursor-pointer shrink-0"
                                  title={`Add more photos to ${color}`}
                                >
                                  <Plus className="w-4 h-4" />
                                  <span className="text-[8px] font-bold">Add</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Colour Input */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={newColorInput}
                    onChange={(e) => setNewColorInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddColor();
                      }
                    }}
                    placeholder="Enter colour name (e.g. Charcoal Anthracite, Brown / Beige)..."
                    className="flex-1 bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    className="px-4 py-2 bg-[#c5a880] hover:bg-[#b09166] text-black font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#c5a880]/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Colour</span>
                  </button>
                </div>
              </div>

              {/* Size + Colour Combination Product Mapping */}
              <div className="pt-3 border-t border-white/10">
                <CombinationProductMappingManager
                  availableSizes={form.availableSizes || []}
                  availableColors={form.availableColors || []}
                  mappings={form.combinationProductMappings || []}
                  onChange={(newMappings) => {
                    const newComboImages: Record<string, string> = {};
                    newMappings.forEach((m) => {
                      if (m.size && m.color && m.image) {
                        newComboImages[`${m.size}_${m.color}`] = m.image;
                      }
                    });
                    setForm((prev) => ({
                      ...prev,
                      combinationProductMappings: newMappings,
                      combination_product_mappings: newMappings,
                      combinationImages: newComboImages,
                    }));
                  }}
                  currentProduct={form}
                />
              </div>
            </div>
          )}

          {/* TAB 4: DESCRIPTION & USES */}
          {activeTab === "description" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">Full Product Description</label>
                <p className="text-[11px] text-gray-400 mb-2">Editorial architectural narrative displayed on the public product page.</p>
                <textarea
                  rows={6}
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Enter complete product narrative, surface texture characteristics, and architectural design intent..."
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl p-4 text-xs text-white leading-relaxed focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">Recommended Uses & Applications</label>
                <div className="flex flex-wrap gap-2 pt-1 mb-3">
                  {COMMON_APPLICATIONS.map((app) => {
                    const isSelected = (form.usage || "").toLowerCase().includes(app.toLowerCase());
                    return (
                      <button
                        key={app}
                        type="button"
                        onClick={() => {
                          const current = form.usage ? form.usage.split(",").map((x) => x.trim()).filter(Boolean) : [];
                          const exists = current.includes(app);
                          const next = exists ? current.filter((x) => x !== app) : [...current, app];
                          const combined = next.join(", ");
                          setForm({ ...form, usage: combined, application: combined });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#c5a880] text-black font-bold shadow-md shadow-[#c5a880]/20"
                            : "bg-[#111827] text-gray-300 border border-white/10 hover:border-white/25"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-black" />}
                        <span>{app}</span>
                      </button>
                    );
                  })}
                </div>

                <input
                  type="text"
                  value={form.usage || ""}
                  onChange={(e) => setForm({ ...form, usage: e.target.value, application: e.target.value })}
                  placeholder="e.g. Wall & Floor, Bathroom, Living Room, Luxury Commercial"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* TAB 5: IMAGE GALLERY & REORDER */}
          {activeTab === "images" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Batch Upload Dropzone & Media Library Picker */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-gray-200 block">
                      Product Images Gallery ({form.images?.length || 0})
                    </label>
                    <p className="text-[11px] text-gray-400">
                      Upload multiple images, drag to reorder, set the primary cover, or pick from Media Library.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMediaPickerOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a880]/15 hover:bg-[#c5a880]/25 text-[#c5a880] border border-[#c5a880]/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Media Library</span>
                    </button>
                  </div>
                </div>

                {/* Drag-and-drop batch upload box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFiles(true);
                  }}
                  onDragLeave={() => setIsDraggingFiles(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFiles(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleBatchUploadFiles(e.dataTransfer.files);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                    isDraggingFiles
                      ? "border-[#c5a880] bg-[#c5a880]/10"
                      : "border-white/15 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/30"
                  }`}
                  onClick={() => {
                    const input = document.getElementById("batch-image-upload-input");
                    input?.click();
                  }}
                >
                  <input
                    id="batch-image-upload-input"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleBatchUploadFiles(e.target.files);
                      }
                    }}
                  />

                  {isUploadingImages ? (
                    <div className="space-y-2 py-2">
                      <div className="w-8 h-8 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-xs font-bold text-[#c5a880]">{uploadProgressText || "Uploading images..."}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#c5a880]">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          Drag & drop multiple image files here, or <span className="text-[#c5a880] underline">browse</span>
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Supports WEBP, JPG, PNG. Select multiple files at once.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add Custom Image URL */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="Or paste external image URL (https://...)..."
                    className="flex-1 bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddImageUrl(customImageUrl)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    + Add URL
                  </button>
                </div>
              </div>

              {/* Quick Presets Picker */}
              <div className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-1.5">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Quick Preset Image Samples</span>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {PRESET_IMAGE_SAMPLES.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => handleAddImageUrl(sample.url)}
                      className="px-2.5 py-1 rounded-lg bg-[#111827] text-gray-300 hover:text-white border border-white/10 text-[11px] cursor-pointer"
                    >
                      + {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Video Section */}
              <ProductVideoSection form={form} setForm={setForm} />

              {/* Gallery Grid with Drag & Drop Reorder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-200">
                    Active Images ({form.images?.length || 0}) — <span className="text-[#c5a880] font-normal">First image is the Primary Hero Cover</span>
                  </label>
                  <span className="text-[10px] text-gray-400">Drag cards or use arrows to reorder</span>
                </div>

                {Boolean((form.videoEnabled || form.video_enabled) && extractYouTubeVideoId(form.videoUrl || form.video_url)) && (
                  <div className="mb-3 px-3.5 py-2.5 bg-[#c5a880]/10 border border-[#c5a880]/30 rounded-xl flex items-center justify-between text-xs text-[#c5a880]">
                    <div className="flex items-center gap-2">
                      <Video className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-semibold">
                        YouTube Video Active — Assigned to Gallery Slot #{Math.min(Math.max(1, parseInt(String(form.videoPosition || form.video_position || 1), 10)), (form.images?.length || 0) + 1)}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-400">
                      Total gallery items: {(form.images?.length || 0) + 1}
                    </span>
                  </div>
                )}

                {(form.images || []).length === 0 ? (
                  <div className="p-8 text-center text-gray-500 bg-[#090d16] border border-dashed border-white/10 rounded-2xl">
                    <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                    <p className="text-xs">No images added yet. Upload files above or choose from Media Library.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                    {(form.images || []).map((img, idx) => {
                      const isCover = idx === 0;
                      const isDragged = draggedImageIndex === idx;
                      const isOver = dragOverIndex === idx && draggedImageIndex !== idx;

                      return (
                        <div
                          key={`${img}-${idx}`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", idx.toString());
                            setDraggedImageIndex(idx);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverIndex !== idx) {
                              setDragOverIndex(idx);
                            }
                          }}
                          onDragLeave={() => {
                            if (dragOverIndex === idx) setDragOverIndex(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            handleImageDrop(idx);
                          }}
                          onDragEnd={() => {
                            setDraggedImageIndex(null);
                            setDragOverIndex(null);
                          }}
                          className={`relative rounded-2xl overflow-hidden border group bg-[#090d16] transition-all cursor-grab active:cursor-grabbing ${
                            isCover
                              ? "border-[#c5a880] ring-2 ring-[#c5a880]/30 shadow-lg"
                              : isOver
                              ? "border-[#c5a880] ring-2 ring-white/50 scale-[1.02]"
                              : "border-white/10 hover:border-white/30"
                          } ${isDragged ? "opacity-40" : "opacity-100"}`}
                        >
                          <div className="aspect-square relative overflow-hidden bg-black/40">
                            <img
                              src={getAdminThumbnailUrl(img, 320)}
                              alt={`Product image ${idx + 1}`}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (e.currentTarget.src !== img) {
                                  e.currentTarget.src = img;
                                }
                              }}
                            />
                          </div>

                          {/* Image Index / Cover / Size & Color Badges */}
                          <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-10">
                            {isCover ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#c5a880] text-black text-[9px] font-extrabold uppercase shadow-md flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-black" />
                                <span>Primary Cover</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white text-[9px] font-mono font-bold">
                                Image {idx + 1}
                              </span>
                            )}
                            {(() => {
                              const mappedSize = Object.entries(form.sizeImages || {}).find(([_, mapped]) => mapped === img)?.[0];
                              const mappedColor = Object.entries(form.colorImages || {}).find(([_, mapped]) =>
                                Array.isArray(mapped) ? mapped.includes(img) : mapped === img
                              )?.[0];
                              const mappedSpaces = Object.entries(form.spaceImages || {})
                                .filter(([_, mapped]) => mapped === img)
                                .map(([sp]) => sp);
                              return (
                                <>
                                  {mappedSize && (
                                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 backdrop-blur-xs text-emerald-400 border border-emerald-500/40 text-[9px] font-bold">
                                      📏 {mappedSize}
                                    </span>
                                  )}
                                  {mappedColor && (
                                    <span className="px-2 py-0.5 rounded-md bg-[#c5a880]/20 backdrop-blur-xs text-[#c5a880] border border-[#c5a880]/40 text-[9px] font-bold">
                                      🎨 {mappedColor}
                                    </span>
                                  )}
                                  {mappedSpaces.map((sp) => (
                                    <span key={sp} className="px-2 py-0.5 rounded-md bg-sky-500/20 backdrop-blur-xs text-sky-300 border border-sky-500/40 text-[9px] font-bold truncate max-w-[120px]" title={`Assigned to ${sp}`}>
                                      🏡 {sp.replace(/\s+Tiles$/i, "")}
                                    </span>
                                  ))}
                                </>
                              );
                            })()}
                          </div>

                          {/* Top-Right Remove Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-600 text-white transition-all opacity-0 group-hover:opacity-100 z-10 cursor-pointer shadow-md"
                            title="Remove image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Overlay Action Bar at Bottom of Image Card */}
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {/* Reorder Arrows */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveImage(idx, idx - 1);
                                }}
                                className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors cursor-pointer"
                                title="Move left"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (form.images || []).length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveImage(idx, idx + 1);
                                }}
                                className="p-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none text-white transition-colors cursor-pointer"
                                title="Move right"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Preview Lightbox & Set Cover */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImageUrl(img);
                                }}
                                className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                                title="Preview image full size"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                              </button>

                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetPrimaryImage(idx);
                                  }}
                                  className="px-2 py-1 rounded bg-[#c5a880] text-black text-[9px] font-extrabold uppercase transition-colors cursor-pointer shadow-xs"
                                  title="Set as primary cover"
                                >
                                  Set Cover
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Space-Specific Image Assignment Section */}
              <div className="pt-6 border-t border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-gray-200 block">
                        Space-Specific Product Images
                      </label>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        {selectedSpaces.length} Assigned {selectedSpaces.length === 1 ? "Space" : "Spaces"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                      Assign a distinct image from this product&apos;s gallery to each selected space (e.g. Living Room, Bedroom, Bathroom). When visitors browse that specific space page, the product will showcase this tailored image instead of the general cover.
                    </p>
                  </div>
                </div>

                {selectedSpaces.length === 0 ? (
                  <div className="p-5 rounded-2xl bg-[#090d16] border border-white/10 space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>No spaces are currently selected for this product.</span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Select spaces below to assign space-specific gallery images:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {spacesList.map((space) => (
                        <button
                          key={space}
                          type="button"
                          onClick={() => handleToggleSpace(space)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 cursor-pointer transition-colors"
                        >
                          + {space}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {selectedSpaces.map((space) => {
                      const assignedImg = getProductSpaceImage(form, space) || form.spaceImages?.[space] || (form as any).space_images?.[space];
                      const hasAssigned = Boolean(assignedImg && assignedImg.trim());

                      return (
                        <div
                          key={space}
                          className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                            hasAssigned
                              ? "bg-[#0b1220] border-sky-500/40 shadow-sm"
                              : "bg-[#090d16] border-white/10"
                          }`}
                        >
                          {/* Space Header & Badge */}
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-xs font-bold text-white truncate" title={space}>
                              🏡 {space}
                            </span>
                            {hasAssigned ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
                                Assigned
                              </span>
                            ) : (
                              <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10 shrink-0">
                                Default Cover
                              </span>
                            )}
                          </div>

                          {/* Image Thumbnail Preview */}
                          <div className="relative aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/10 mb-3 group/preview">
                            <img
                              src={getAdminThumbnailUrl(assignedImg || form.images?.[0] || "/images/hero-bg.jpg", 320)}
                              alt={`${space} assigned image`}
                              loading="lazy"
                              className={`w-full h-full object-cover transition-opacity ${
                                hasAssigned ? "opacity-100" : "opacity-40 filter grayscale-[50%]"
                              }`}
                              onError={(e) => {
                                if (e.currentTarget.src !== (assignedImg || form.images?.[0])) {
                                  e.currentTarget.src = assignedImg || form.images?.[0] || "/images/hero-bg.jpg";
                                }
                              }}
                            />
                            {!hasAssigned && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                                <span className="text-[10px] text-gray-300 font-semibold bg-black/70 px-2.5 py-1 rounded-md border border-white/10">
                                  Using Default Product Cover
                                </span>
                              </div>
                            )}

                            {hasAssigned && (
                              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/preview:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(assignedImg || null)}
                                  className="p-1 rounded bg-black/75 hover:bg-black text-white cursor-pointer shadow-md"
                                  title="Preview full size"
                                >
                                  <Maximize2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                            <button
                              type="button"
                              onClick={() => {
                                setGalleryPickerTarget({ type: "space", key: space });
                              }}
                              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                                hasAssigned
                                  ? "bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30"
                                  : "bg-[#c5a880]/15 hover:bg-[#c5a880]/25 text-[#c5a880] border border-[#c5a880]/30"
                              }`}
                            >
                              <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                              <span>{hasAssigned ? "Change Image" : "+ Assign Gallery Image"}</span>
                            </button>

                            {hasAssigned && (
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((prev) => {
                                    const copy = { ...(prev.spaceImages || {}) };
                                    const copy2 = { ...((prev as any).space_images || {}) };
                                    const slugKey = slugify(space);
                                    delete copy[space];
                                    delete copy[slugKey];
                                    delete copy2[space];
                                    delete copy2[slugKey];
                                    return { ...prev, spaceImages: copy, space_images: copy2 };
                                  });
                                }}
                                className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer shrink-0"
                                title="Remove space-specific image (reverts to default cover)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SEO & SEARCH METADATA */}
          {activeTab === "seo" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-[#090d16] border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-[#c5a880] uppercase font-bold tracking-wider">Search Engine Snippet Preview</span>
                <p className="text-sm font-semibold text-blue-400 truncate">
                  {form.metaTitle || `${form.name || "Product"} | Timex Ceramic`}
                </p>
                <p className="text-[11px] text-emerald-400 font-mono truncate">
                  https://www.timexceramic.com/product/{form.slug || "product-slug"}
                </p>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {form.metaDescription || form.description || "Discover luxury architectural ceramic tiles and vitrified surfaces engineered by Timex Ceramic."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">SEO Meta Title</label>
                <input
                  type="text"
                  value={form.metaTitle || ""}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder="e.g. Arenta Series Premium Stone Look Porcelain Tiles | Timex Ceramic"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">SEO Meta Description</label>
                <textarea
                  rows={3}
                  value={form.metaDescription || ""}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  placeholder="Enter compelling meta description for search engine result pages..."
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">Focus Keywords & Search Tags</label>
                <input
                  type="text"
                  value={form.keywords || ""}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  placeholder="e.g. stone tiles, vitrified porcelain, arenta series, matte finish tiles"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
            </div>
          )}
          </div>

          {/* Modal Pinned Footer Actions */}
          <div className="shrink-0 px-6 py-4 bg-[#0e1628]/95 border-t border-white/10 flex items-center justify-between z-20">
            <button
              type="button"
              onClick={handleRequestClose}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saveStatus === "saving" || externalSaving || saveStatus === "saved" || isUploadingImages}
              className={`px-6 py-2.5 font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${
                saveStatus === "saved"
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-gradient-to-r from-[#c5a880] to-[#b09166] text-black hover:opacity-90 shadow-[#c5a880]/20"
              }`}
            >
              {isUploadingImages ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Uploading Images...</span>
                </>
              ) : saveStatus === "saving" || externalSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Saving Product...</span>
                </>
              ) : saveStatus === "saved" ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved successfully ✓</span>
                </>
              ) : (
                <span>SAVE PRODUCT</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* MEDIA LIBRARY PICKER MODAL */}
      {(mediaPickerOpen || mediaPickerTarget !== null) && (
        <div className="fixed inset-0 z-[105] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-white/10 rounded-3xl max-w-5xl w-full max-h-[85vh] overflow-y-auto p-6 relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <h3 className="font-serif text-lg font-bold text-white">
                {mediaPickerTarget?.type === "catalogue"
                  ? "Select Catalogue (PDF) from Media Library"
                  : mediaPickerTarget?.type === "size"
                  ? `Select Visual for Size: ${mediaPickerTarget.key}`
                  : mediaPickerTarget?.type === "color"
                  ? `Select Visual for Colour: ${mediaPickerTarget.key}`
                  : mediaPickerTarget?.type === "space"
                  ? `Select Visual for Space: ${mediaPickerTarget.key}`
                  : "Select Image from Media Library"}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setMediaPickerOpen(false);
                  setMediaPickerTarget(null);
                }}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <MediaManagerClient
              isPickerMode
              onSelectMedia={(media) => {
                if (!mediaPickerTarget || mediaPickerTarget.type === "gallery") {
                  handleAddImageUrl(media.url);
                } else if (mediaPickerTarget.type === "catalogue") {
                  const filename = (media.filename || media.url.split("/").pop() || "").toLowerCase();
                  const canonicalUrl = filename ? `/catalogue/${filename}` : media.url;
                  setForm((prev) => ({
                    ...prev,
                    catalogueUrl: canonicalUrl,
                    catalogue_url: canonicalUrl,
                    catalogue: canonicalUrl,
                    productPdf: canonicalUrl,
                    catalogueMediaId: media.id,
                    catalogueName: media.altText || media.originalName || media.filename || "Catalogue.pdf",
                  }));
                } else if (mediaPickerTarget.type === "size" && mediaPickerTarget.key) {
                  const targetKey = mediaPickerTarget.key;
                  setForm((prev) => ({
                    ...prev,
                    sizeImages: {
                      ...(prev.sizeImages || {}),
                      [targetKey]: media.url,
                    },
                  }));
                } else if (mediaPickerTarget.type === "color" && mediaPickerTarget.key) {
                  const targetKey = mediaPickerTarget.key;
                  setForm((prev) => {
                    const raw = prev.colorImages?.[targetKey];
                    const current: string[] = Array.isArray(raw)
                      ? [...raw]
                      : (typeof raw === "string" && raw ? [raw] : []);
                    const updated = current.includes(media.url) ? current : [...current, media.url];
                    const galleryImages = (prev.images || []).includes(media.url)
                      ? prev.images
                      : [...(prev.images || []), media.url];
                    return {
                      ...prev,
                      images: galleryImages,
                      colorImages: {
                        ...(prev.colorImages || {}),
                        [targetKey]: updated,
                      },
                    };
                  });
                } else if (mediaPickerTarget.type === "space" && mediaPickerTarget.key) {
                  const targetKey = mediaPickerTarget.key;
                  const slugKey = slugify(targetKey);
                  setForm((prev) => ({
                    ...prev,
                    spaceImages: {
                      ...(prev.spaceImages || {}),
                      [targetKey]: media.url,
                      [slugKey]: media.url,
                    },
                    space_images: {
                      ...((prev as any).space_images || {}),
                      [targetKey]: media.url,
                      [slugKey]: media.url,
                    },
                  }));
                }
                setMediaPickerOpen(false);
                setMediaPickerTarget(null);
              }}
            />
          </div>
        </div>
      )}

      {/* GALLERY / MEDIA ASSIGNMENT MODAL FOR SIZE & COLOUR */}
      {galleryPickerTarget && (() => {
        const isColorPicker = galleryPickerTarget.type === "color";
        const assignedColorPhotos: string[] = (() => {
          if (!isColorPicker) return [];
          const raw = form.colorImages?.[galleryPickerTarget.key];
          if (!raw) return [];
          if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string" && Boolean(x.trim()));
          if (typeof raw === "string" && raw.trim()) return [raw.trim()];
          return [];
        })();

        return (
          <div className="fixed inset-0 z-[110] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0e1628] border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] font-bold text-[#c5a880] uppercase tracking-wider block">
                    {isColorPicker ? "Multi-Photo Assignment" : "Image Assignment"}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white">
                    {isColorPicker
                      ? `Select Photos for Colour: ${galleryPickerTarget.key}`
                      : `Assign Image for ${galleryPickerTarget.type === "size" ? "Size" : "Space"}: ${galleryPickerTarget.key}`}
                  </h3>
                  {isColorPicker && (
                    <p className="text-xs text-gray-400 mt-1">
                      Click photos to toggle them. You can select multiple photos for this colour (1st is primary).
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setGalleryPickerTarget(null)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Existing Gallery Images */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300 block">
                    Choose from Existing Gallery ({(form.images || []).length} images)
                  </label>
                  {isColorPicker && (
                    <span className="text-[11px] font-bold text-[#c5a880]">
                      {assignedColorPhotos.length} photo{assignedColorPhotos.length === 1 ? "" : "s"} selected
                    </span>
                  )}
                </div>
                {(form.images || []).length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-2">
                    No images in product gallery yet. Pick from Media Library below.
                  </p>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 max-h-56 overflow-y-auto p-2 bg-[#070b14] rounded-xl border border-white/5">
                    {(form.images || []).map((imgUrl, i) => {
                      const isSelected = isColorPicker
                        ? assignedColorPhotos.includes(imgUrl)
                        : (galleryPickerTarget.type === "size"
                            ? form.sizeImages?.[galleryPickerTarget.key] === imgUrl
                            : (getProductSpaceImage(form, galleryPickerTarget.key) || form.spaceImages?.[galleryPickerTarget.key]) === imgUrl);
                      const colorIndex = isColorPicker ? assignedColorPhotos.indexOf(imgUrl) : -1;

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            const targetKey = galleryPickerTarget.key;
                            if (isColorPicker) {
                              setForm((prev) => {
                                const raw = prev.colorImages?.[targetKey];
                                const current: string[] = Array.isArray(raw)
                                  ? [...raw]
                                  : (typeof raw === "string" && raw ? [raw] : []);
                                let updated: string[];
                                if (current.includes(imgUrl)) {
                                  updated = current.filter((u) => u !== imgUrl);
                                } else {
                                  updated = [...current, imgUrl];
                                }
                                const copy = { ...(prev.colorImages || {}) };
                                if (updated.length > 0) {
                                  copy[targetKey] = updated;
                                } else {
                                  delete copy[targetKey];
                                }
                                return { ...prev, colorImages: copy };
                              });
                              // Keep modal open so user can pick multiple photos
                              return;
                            }

                            if (galleryPickerTarget.type === "size") {
                              setForm((prev) => ({
                                ...prev,
                                sizeImages: { ...(prev.sizeImages || {}), [targetKey]: imgUrl },
                              }));
                            } else if (galleryPickerTarget.type === "space") {
                              const slugKey = slugify(targetKey);
                              setForm((prev) => ({
                                ...prev,
                                spaceImages: {
                                  ...(prev.spaceImages || {}),
                                  [targetKey]: imgUrl,
                                  [slugKey]: imgUrl,
                                },
                                space_images: {
                                  ...((prev as any).space_images || {}),
                                  [targetKey]: imgUrl,
                                  [slugKey]: imgUrl,
                                },
                              }));
                            }
                            setGalleryPickerTarget(null);
                          }}
                          className={`relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer group ${
                            isSelected
                              ? "border-[#c5a880] ring-2 ring-[#c5a880] shadow-md shadow-[#c5a880]/30 scale-[1.02]"
                              : "border-white/10 hover:border-[#c5a880] hover:scale-105"
                          }`}
                        >
                          <img
                            src={getAdminThumbnailUrl(imgUrl, 160)}
                            alt={`Gallery ${i}`}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (e.currentTarget.src !== imgUrl) {
                                e.currentTarget.src = imgUrl;
                              }
                            }}
                          />
                          {/* Selected Overlay & Badge */}
                          <div
                            className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            }`}
                          >
                            <Check className={`w-4 h-4 ${isSelected ? "text-[#c5a880] stroke-[3]" : "text-white"}`} />
                          </div>
                          {isSelected && isColorPicker && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono font-bold text-[#c5a880] border border-[#c5a880]/40">
                              {colorIndex === 0 ? "★1" : `#${colorIndex + 1}`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer: Media Library button & Done / Cancel */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const target = { ...galleryPickerTarget };
                    setGalleryPickerTarget(null);
                    setMediaPickerTarget(target);
                  }}
                  className="inline-flex items-center space-x-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>+ Media Library</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGalleryPickerTarget(null)}
                  className={`px-5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-colors ${
                    isColorPicker
                      ? "bg-[#c5a880] hover:bg-[#b0936d] text-black shadow-md shadow-[#c5a880]/20"
                      : "bg-white/5 hover:bg-white/10 text-gray-300"
                  }`}
                >
                  {isColorPicker
                    ? `Done (${assignedColorPhotos.length} selected)`
                    : "Cancel"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* FULL-IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-[#c5a880] transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="rounded-2xl overflow-hidden border border-white/15 max-h-[85vh] shadow-2xl bg-black">
              <img src={previewImageUrl} alt="Product preview" className="max-h-[85vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* UNSAVED CHANGES CONFIRMATION MODAL */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0e1628] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif text-lg font-bold text-white">Discard Unsaved Changes?</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              You have made changes to this product that have not been saved. Unsaved changes will be lost. Continue?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
