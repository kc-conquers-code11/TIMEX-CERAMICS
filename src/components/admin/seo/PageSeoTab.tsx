"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Edit,
  Save,
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Globe,
  Tag,
  Share2,
  Code,
  Check,
  RefreshCw,
} from "lucide-react";

export function PageSeoTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "page" | "product" | "blog" | "category">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState<any>({});

  const fetchSeoList = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/seo?_t=" + Date.now());
      const data = await res.json();
      if (data.success && Array.isArray(data.seo)) {
        setItems(data.seo);
      }
    } catch (err) {
      console.error("Failed to load SEO items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeoList();
  }, []);

  const openEditor = (item: any) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      page_path: item.page_path,
      content_type: item.content_type,
      title: item.title,
      slug: item.slug,
      content: item.content || "",
      seo_title: item.seo_title || item.meta_title || item.title || "",
      meta_description: item.meta_description || "",
      focus_keyword: item.focus_keyword || "",
      secondary_keywords: Array.isArray(item.secondary_keywords)
        ? item.secondary_keywords.join(", ")
        : item.secondary_keywords || "",
      canonical_url: item.canonical_url || `https://www.timexceramic.com${item.page_path === "/" ? "" : item.page_path}`,
      robots_index: item.robots_index !== undefined ? item.robots_index : true,
      robots_follow: item.robots_follow !== undefined ? item.robots_follow : true,
      og_title: item.og_title || item.seo_title || item.title || "",
      og_description: item.og_description || item.meta_description || "",
      og_image: item.og_image || "",
      twitter_title: item.twitter_title || item.og_title || item.seo_title || item.title || "",
      twitter_description: item.twitter_description || item.og_description || item.meta_description || "",
      twitter_image: item.twitter_image || item.og_image || "",
      twitter_card: item.twitter_card || "summary_large_image",
      schema_type: item.schema_type || (item.content_type === "product" ? "Product" : item.content_type === "blog" ? "Article" : "WebPage"),
      schema_data: item.schema_data || "",
      seo_score: item.seo_score || 70,
    });
    setSaveSuccess(false);
  };

  const closeEditor = () => {
    setEditingItem(null);
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        secondary_keywords: formData.secondary_keywords
          ? formData.secondary_keywords.split(",").map((k: string) => k.trim()).filter(Boolean)
          : [],
      };

      const res = await fetch("/api/v1/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        // Refresh local list
        fetchSeoList();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Save SEO error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesType = filterType === "all" || item.content_type === filterType;
      const matchesSearch =
        !searchQuery ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.page_path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.seo_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.focus_keyword?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [items, filterType, searchQuery]);

  // Length helper calculations
  const titleLen = (formData.seo_title || "").length;
  const descLen = (formData.meta_description || "").length;

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-wide">Page SEO Manager</h2>
          <p className="text-xs text-gray-400">
            Configure titles, meta descriptions, focus keywords, canonical tags, and Open Graph tags across all surfaces.
          </p>
        </div>

        <button
          onClick={fetchSeoList}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-300 hover:text-white cursor-pointer w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#111827] border border-white/10 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Type tabs */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(["all", "page", "product", "blog", "category"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                filterType === t
                  ? "bg-[#c5a880] text-black shadow-md shadow-[#c5a880]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {t === "all" ? "All Content" : t === "category" ? "Collections" : `${t}s`}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, URL or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#090d16] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
          />
        </div>
      </div>

      {/* Items Table */}
      {loading ? (
        <div className="p-16 text-center text-gray-400 font-mono text-xs animate-pulse">
          Loading Page SEO Targets...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center text-gray-400 bg-[#111827] border border-white/10 rounded-2xl">
          No content matches your filter.
        </div>
      ) : (
        <div className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-gray-400">
                  <th className="py-3.5 px-4">Content Type</th>
                  <th className="py-3.5 px-4">Public URL & Source Title</th>
                  <th className="py-3.5 px-4">Configured SEO Title</th>
                  <th className="py-3.5 px-4">Focus Keyword</th>
                  <th className="py-3.5 px-4 text-center">Score</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-gray-200">
                {filteredItems.map((item) => {
                  const score = item.seo_score || 70;
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            item.content_type === "product"
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                              : item.content_type === "blog"
                              ? "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                              : item.content_type === "category"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                              : "bg-[#c5a880]/15 text-[#c5a880] border border-[#c5a880]/20"
                          }`}
                        >
                          {item.content_type}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-white truncate max-w-xs">{item.title}</div>
                        <a
                          href={item.page_path}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[11px] text-gray-400 hover:text-[#c5a880] flex items-center gap-1 w-fit"
                        >
                          {item.page_path} <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <div className="truncate font-medium text-gray-200">{item.seo_title || "—"}</div>
                        <div className="text-[10px] text-gray-400 truncate">{item.meta_description || "Missing description"}</div>
                      </td>

                      <td className="py-3 px-4">
                        {item.focus_keyword ? (
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 text-[#c5a880] font-semibold border border-white/5">
                            {item.focus_keyword}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500 italic">Not set</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            score >= 85
                              ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                              : score >= 70
                              ? "text-[#c5a880] border-[#c5a880]/20 bg-[#c5a880]/10"
                              : "text-rose-400 border-rose-500/20 bg-rose-500/10"
                          }`}
                        >
                          {score}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditor(item)}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-[#c5a880] text-gray-300 hover:text-black font-semibold text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit SEO
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Drawer / Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-3xl bg-[#0b0f19] border-l border-white/10 h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#c5a880]/15 text-[#c5a880]">
                  {formData.content_type}
                </span>
                <h3 className="text-xl font-serif font-bold text-white mt-1">{formData.title}</h3>
                <p className="font-mono text-xs text-gray-400">{formData.page_path}</p>
              </div>
              <button
                onClick={closeEditor}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                SEO metadata saved successfully. Live public website has been updated!
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="space-y-6 flex-1">
              {/* 1. Live Google Search Preview */}
              <div className="p-4 bg-[#111827] border border-white/10 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-gray-400 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-[#c5a880]" />
                  Google SERP Snippet Preview
                </span>
                <div className="p-4 bg-white rounded-xl text-black font-sans space-y-1 select-none">
                  <div className="flex items-center gap-1.5 text-xs text-gray-700">
                    <span className="font-semibold text-gray-900">timexceramic.com</span>
                    <span>› {formData.page_path.replace(/^\//, "")}</span>
                  </div>
                  <h4 className="text-base text-[#1a0dab] hover:underline font-medium leading-snug cursor-pointer line-clamp-1">
                    {formData.seo_title || "Timex Ceramic | International Premium Tiles"}
                  </h4>
                  <p className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                    {formData.meta_description || "Add an informative description that summarizes the content of this surface to entice searchers."}
                  </p>
                </div>
              </div>

              {/* 2. SEO Title Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-gray-200">SEO Title</label>
                  <span
                    className={`font-mono text-[11px] ${
                      titleLen >= 35 && titleLen <= 65
                        ? "text-emerald-400"
                        : titleLen > 65
                        ? "text-rose-400"
                        : "text-amber-400"
                    }`}
                  >
                    {titleLen} / 60 recommended
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  placeholder="e.g. Statuario Marble Look Vitrified Tiles | Timex Ceramic"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
                  required
                />
              </div>

              {/* 3. Meta Description Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-gray-200">Meta Description</label>
                  <span
                    className={`font-mono text-[11px] ${
                      descLen >= 120 && descLen <= 165
                        ? "text-emerald-400"
                        : descLen > 165
                        ? "text-rose-400"
                        : "text-amber-400"
                    }`}
                  >
                    {descLen} / 160 recommended
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formData.meta_description}
                  onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Summarize the luxury tile surface features, finish, durability, and brand promise..."
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              {/* 4. Focus & Secondary Keywords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-200">Focus Keyword</label>
                  <input
                    type="text"
                    value={formData.focus_keyword}
                    onChange={(e) => setFormData({ ...formData, focus_keyword: e.target.value })}
                    placeholder="e.g. vitrified porcelain slabs"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-200">Secondary Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.secondary_keywords}
                    onChange={(e) => setFormData({ ...formData, secondary_keywords: e.target.value })}
                    placeholder="e.g. bathroom slabs, italian marble tiles"
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
                  />
                </div>
              </div>

              {/* 5. Canonical URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-200">Canonical URL</label>
                <input
                  type="text"
                  value={formData.canonical_url}
                  onChange={(e) => setFormData({ ...formData, canonical_url: e.target.value })}
                  placeholder="https://www.timexceramic.com/..."
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              {/* 6. Robots Directives */}
              <div className="p-4 bg-[#111827] border border-white/10 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-gray-200">Search Crawler Indexing Directives</span>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.robots_index}
                      onChange={(e) => setFormData({ ...formData, robots_index: e.target.checked })}
                      className="accent-[#c5a880] w-4 h-4 rounded"
                    />
                    <span>Allow Indexing (robots index)</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.robots_follow}
                      onChange={(e) => setFormData({ ...formData, robots_follow: e.target.checked })}
                      className="accent-[#c5a880] w-4 h-4 rounded"
                    />
                    <span>Follow Links (robots follow)</span>
                  </label>
                </div>
              </div>

              {/* 7a. Facebook / Open Graph Meta */}
              <div className="p-4 bg-[#111827] border border-white/10 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5 text-[#c5a880]" />
                  Facebook (Open Graph)
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.og_title || ""}
                    onChange={(e) => setFormData({ ...formData, og_title: e.target.value })}
                    placeholder="Facebook / OG Title (defaults to SEO title)"
                    className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500"
                  />
                  <textarea
                    rows={2}
                    value={formData.og_description || ""}
                    onChange={(e) => setFormData({ ...formData, og_description: e.target.value })}
                    placeholder="Facebook / OG Description"
                    className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500"
                  />
                  <input
                    type="text"
                    value={formData.og_image || ""}
                    onChange={(e) => setFormData({ ...formData, og_image: e.target.value })}
                    placeholder="Facebook / OG Image URL (1200x630)"
                    className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500"
                  />
                </div>
              </div>

              {/* 7b. Twitter / X Card Meta */}
              <div className="p-4 bg-[#111827] border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-[#c5a880]" />
                    Twitter / X Card
                  </span>
                  <select
                    value={formData.twitter_card || "summary_large_image"}
                    onChange={(e) => setFormData({ ...formData, twitter_card: e.target.value })}
                    className="bg-[#090d16] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="summary_large_image">Summary Large Image</option>
                    <option value="summary">Summary</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.twitter_title || ""}
                    onChange={(e) => setFormData({ ...formData, twitter_title: e.target.value })}
                    placeholder="Twitter Title"
                    className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500"
                  />
                  <textarea
                    rows={2}
                    value={formData.twitter_description || ""}
                    onChange={(e) => setFormData({ ...formData, twitter_description: e.target.value })}
                    placeholder="Twitter Description"
                    className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500"
                  />
                  <input
                    type="text"
                    value={formData.twitter_image || ""}
                    onChange={(e) => setFormData({ ...formData, twitter_image: e.target.value })}
                    placeholder="Twitter Image URL (1200x675)"
                    className="w-full bg-[#090d16] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500"
                  />
                </div>
              </div>

              {/* 8. Schema Data (JSON-LD) */}
              <div className="p-4 bg-[#111827] border border-white/10 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-[#c5a880]" />
                    Structured Schema (JSON-LD)
                  </span>
                  <select
                    value={formData.schema_type}
                    onChange={(e) => setFormData({ ...formData, schema_type: e.target.value })}
                    className="bg-[#090d16] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white"
                  >
                    <option value="Product">Product</option>
                    <option value="Article">Article</option>
                    <option value="LocalBusiness">LocalBusiness</option>
                    <option value="Organization">Organization</option>
                    <option value="FAQPage">FAQPage</option>
                    <option value="BreadcrumbList">BreadcrumbList</option>
                    <option value="WebPage">WebPage</option>
                  </select>
                </div>
                <textarea
                  rows={4}
                  value={formData.schema_data}
                  onChange={(e) => setFormData({ ...formData, schema_data: e.target.value })}
                  placeholder="Paste or edit custom JSON-LD schema (leave blank for automatic schema)..."
                  className="w-full bg-[#090d16] border border-white/10 rounded-xl p-3 font-mono text-[11px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              {/* Drawer Action Bar */}
              <div className="sticky bottom-0 pt-4 bg-[#0b0f19] border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-gray-300 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#c5a880] to-[#b09166] text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#c5a880]/20 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save SEO Target"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
