"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Eye,
  Edit3,
  Sparkles,
  Calendar,
  Clock,
  User,
  Tag,
  Check,
  Search,
} from "lucide-react";
import { BlogItem } from "@/types/admin";
import { MediaManagerClient } from "./media/MediaManagerClient";

export const BLOG_CATEGORIES = [
  "TRENDS",
  "DESIGN TIPS",
  "CREATIVE",
  "NEWS",
  "GUIDES",
  "ARCHITECTURE",
];

export const PRESET_BLOG_COVERS = [
  { label: "Modern Kitchen Island", url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80" },
  { label: "Minimalist Bath Lounge", url: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80" },
  { label: "Boutique Hotel Lobby", url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" },
  { label: "Tactile Travertine Wall", url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1200&q=80" },
  { label: "Calacatta Gold Slabs", url: "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=1200&q=80" },
];

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function convertContentToHtml(content: any, excerpt = ""): string {
  if (typeof content === "string") return content;
  if (!content) return `<p>${excerpt}</p>`;

  let html = "";
  if (content.intro) {
    html += `<p>${content.intro}</p>\n\n`;
  }
  if (Array.isArray(content.sections)) {
    content.sections.forEach((sec: any) => {
      if (sec.heading) html += `<h2>${sec.heading}</h2>\n`;
      if (sec.subheading) html += `<p><em>${sec.subheading}</em></p>\n`;
      if (Array.isArray(sec.body)) {
        sec.body.forEach((b: string) => {
          html += `<p>${b}</p>\n`;
        });
      }
      if (sec.quote) {
        html += `<blockquote>"${sec.quote}"</blockquote>\n`;
      }
      if (sec.image) {
        html += `<img src="${sec.image}" alt="${sec.heading || "Illustration"}" />\n`;
        if (sec.imageCaption) html += `<p><small>${sec.imageCaption}</small></p>\n`;
      }
      html += "\n";
    });
  }
  return html.trim() || `<p>${excerpt}</p>`;
}

interface BlogEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingBlog: BlogItem | null;
  onSave: (blog: Partial<BlogItem>) => Promise<void>;
  saving: boolean;
}

type MainTab = "content" | "cover-author" | "seo";

export function BlogEditorModal({
  isOpen,
  onClose,
  editingBlog,
  onSave,
  saving,
}: BlogEditorModalProps) {
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("content");
  const [contentViewMode, setContentViewMode] = useState<"editor" | "preview">("editor");
  const [mediaPickerTarget, setMediaPickerTarget] = useState<"cover" | "author" | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(BLOG_CATEGORIES);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/v1/taxonomies/blog-categories")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.categories) && data.categories.length > 0) {
            const names = data.categories.map((c: any) => c.name);
            setCategoryOptions(names);
          }
        })
        .catch((e) => console.warn("Failed to load dynamic blog categories:", e));
    }
  }, [isOpen]);

  const [form, setForm] = useState<Partial<BlogItem>>({
    title: "",
    slug: "",
    subtitle: "",
    category: "TRENDS",
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    readTime: "5 Min Read",
    author: {
      name: "Elena Vance",
      role: "Senior Architectural Stylist",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
    },
    coverImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
    excerpt: "",
    content: "",
    tags: ["TRENDS", "Interior Design", "Tiles"],
    status: "Published",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
  });

  useEffect(() => {
    if (editingBlog) {
      const richContent = convertContentToHtml(editingBlog.content, editingBlog.excerpt || "");
      setForm({
        id: editingBlog.id,
        title: editingBlog.title || "",
        slug: editingBlog.slug || "",
        subtitle: editingBlog.subtitle || "",
        category: editingBlog.category || "TRENDS",
        date: editingBlog.date || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        readTime: editingBlog.readTime || "5 Min Read",
        author: editingBlog.author || {
          name: "Elena Vance",
          role: "Senior Architectural Stylist",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        },
        coverImage: editingBlog.coverImage || "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
        excerpt: editingBlog.excerpt || "",
        content: richContent,
        tags: Array.isArray(editingBlog.tags) ? editingBlog.tags : [editingBlog.category || "TILES"],
        status: editingBlog.status || "Published",
        metaTitle: editingBlog.metaTitle || `${editingBlog.title} | Timex Ceramic Blog`,
        metaDescription: editingBlog.metaDescription || editingBlog.excerpt || "",
        keywords: editingBlog.keywords || `${editingBlog.title}, ${editingBlog.category}, tiles`,
      });
    } else {
      const defaultContent = `<h2>1. Architectural Harmony & Surface Balance</h2>
<p>Modern vitrified porcelain surfaces bridge the threshold between organic tactile texture and structural performance. In high-traffic luxury residential and hospitality environments, selecting large-format surfaces establishes an uninterrupted visual plane.</p>

<h2>2. Tactile Depth and Ambient Illumination</h2>
<p>Light grazing across honed and carving porcelain finishes reveals micro-relief textures that evoke natural stone quarry clefts. By pairing contrasting finishes with subtle ambient illumination, architects can define space zoning without physical partitions.</p>

<blockquote>Clean lines and authentic surface glazes define the new vernacular of understated architectural luxury.</blockquote>

<h2>3. Laying Guidelines & Surface Preservation</h2>
<ul>
  <li>Maintain a calibrated 2mm grout joint for vitrified porcelain tiles.</li>
  <li>Apply zero-VOC polymer-modified adhesives for optimal bond strength.</li>
  <li>Clean routinely with neutral stone cleaners to preserve glaze luminosity.</li>
</ul>`;

      setForm({
        title: "",
        slug: "",
        subtitle: "",
        category: "TRENDS",
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        readTime: "5 Min Read",
        author: {
          name: "Elena Vance",
          role: "Senior Architectural Stylist",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
        },
        coverImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
        excerpt: "",
        content: defaultContent,
        tags: ["TRENDS", "Interior Design", "Tiles"],
        status: "Published",
        metaTitle: "",
        metaDescription: "",
        keywords: "",
      });
    }
    setActiveMainTab("content");
    setContentViewMode("editor");
  }, [editingBlog, isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  const handleTitleChange = (title: string) => {
    setForm((prev) => {
      const shouldUpdateSlug = !editingBlog || !prev.slug || prev.slug === slugify(prev.title || "");
      const newSlug = shouldUpdateSlug ? slugify(title) : prev.slug;
      const autoMetaTitle = prev.metaTitle === `${prev.title || ""} | Timex Ceramic Blog` || !prev.metaTitle
        ? `${title} | Timex Ceramic Blog`
        : prev.metaTitle;
      return {
        ...prev,
        title,
        slug: newSlug,
        metaTitle: autoMetaTitle,
      };
    });
  };

  const handleGenerateSlug = () => {
    if (form.title) {
      setForm((prev) => ({ ...prev, slug: slugify(prev.title || "") }));
    }
  };

  const insertSnippet = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setForm((prev) => ({ ...prev, content: (prev.content || "") + "\n" + snippet }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = form.content || "";
    const selected = current.substring(start, end);

    let replacement = snippet;
    if (snippet.includes("TEXT")) {
      replacement = snippet.replace("TEXT", selected || "Sample text");
    }

    const updated = current.substring(0, start) + replacement + current.substring(end);
    setForm((prev) => ({ ...prev, content: updated }));

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.title.trim()) {
      alert("Blog Title is required.");
      return;
    }
    await onSave(form);
  };

  return createPortal(
    <div className="dark-scrollbars fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div className="bg-[#0b101d] border border-white/10 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-5 md:p-6 border-b border-white/10 flex items-center justify-between bg-[#0e1628]/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest text-[#c5a880] font-extrabold uppercase">
                {editingBlog ? "Editorial CMS" : "Publishing Portal"}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  form.status === "Published"
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                }`}
              >
                {form.status || "Published"}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5 truncate max-w-lg">
              {editingBlog ? `Edit: ${form.title || "Untitled Article"}` : "Create New Editorial Article"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="flex items-center gap-1 px-4 py-2 bg-[#090d16] border-b border-white/5 overflow-x-auto scrollbar-none">
          {[
            { id: "content", label: "Article & Full Content" },
            { id: "cover-author", label: "Cover Image & Author" },
            { id: "seo", label: "SEO & Search Metadata" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveMainTab(tab.id as MainTab)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeMainTab === tab.id
                  ? "bg-[#c5a880] text-black font-extrabold shadow-sm"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: ARTICLE & FULL CONTENT */}
          {activeMainTab === "content" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">Article Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Curated Chaos: Why Unexpected Red Needs a Silent Partner"
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
                      Generate from Title
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-mono select-none">
                      /blogs/
                    </span>
                    <input
                      type="text"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                      placeholder="curated-chaos-unexpected-red"
                      className="w-full bg-[#111827] border border-white/10 rounded-xl pl-16 pr-4 py-2.5 text-xs text-[#c5a880] font-mono focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">Article Subtitle / Strapline</label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="Architectural perspective on modern tiles..."
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-200 mb-1">Publishing Status *</label>
                  <select
                    value={form.status || "Published"}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                  >
                    <option value="Published">Published (Live on Website)</option>
                    <option value="Draft">Draft (Internal Only)</option>
                  </select>
                </div>
              </div>

              {/* Short Excerpt */}
              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">Short Excerpt / Summary *</label>
                <p className="text-[11px] text-gray-400 mb-1.5">Displayed on blog index cards, social share cards, and search previews.</p>
                <textarea
                  rows={2}
                  required
                  value={form.excerpt}
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  placeholder="Enter a compelling 2-sentence summary of the article..."
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              {/* Full Rich Content Editor */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                  <div>
                    <label className="text-xs font-bold text-gray-200">Full Article Content (Rich HTML)</label>
                    <p className="text-[10px] text-gray-400">Use the toolbar buttons to format headings, paragraphs, lists, quotes, and images.</p>
                  </div>

                  <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => setContentViewMode("editor")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        contentViewMode === "editor" ? "bg-[#c5a880] text-black shadow-sm" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentViewMode("preview")}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        contentViewMode === "preview" ? "bg-[#c5a880] text-black shadow-sm" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Live Public Preview</span>
                    </button>
                  </div>
                </div>

                {contentViewMode === "editor" ? (
                  <div className="space-y-2">
                    {/* Rich Formatting Toolbar */}
                    <div className="flex flex-wrap items-center gap-1 p-2 bg-[#111827] border border-white/10 rounded-xl">
                      <button
                        type="button"
                        onClick={() => insertSnippet("<h2>Heading 2</h2>\n")}
                        title="Add Heading 2"
                        className="px-2.5 py-1 text-xs font-bold bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg flex items-center gap-1"
                      >
                        <Heading2 className="w-3.5 h-3.5" />
                        <span>H2</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => insertSnippet("<h3>Heading 3</h3>\n")}
                        title="Add Heading 3"
                        className="px-2.5 py-1 text-xs font-bold bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg flex items-center gap-1"
                      >
                        <Heading3 className="w-3.5 h-3.5" />
                        <span>H3</span>
                      </button>

                      <div className="w-[1px] h-4 bg-white/10 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertSnippet("<p>TEXT</p>\n")}
                        title="Paragraph"
                        className="px-2.5 py-1 text-xs font-semibold bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg"
                      >
                        P
                      </button>

                      <button
                        type="button"
                        onClick={() => insertSnippet("<strong>TEXT</strong>")}
                        title="Bold"
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertSnippet("<em>TEXT</em>")}
                        title="Italic"
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-[1px] h-4 bg-white/10 mx-1" />

                      <button
                        type="button"
                        onClick={() => insertSnippet("<ul>\n  <li>Key point one</li>\n  <li>Key point two</li>\n</ul>\n")}
                        title="Bullet List"
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertSnippet("<ol>\n  <li>Step one</li>\n  <li>Step two</li>\n</ol>\n")}
                        title="Numbered List"
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => insertSnippet('<blockquote>"Clean architectural lines and authentic surface glazes define modern luxury."</blockquote>\n')}
                        title="Pull Quote"
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>

                      <div className="w-[1px] h-4 bg-white/10 mx-1" />

                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt("Enter link URL (e.g. https://www.timexceramic.com/products):");
                          if (url) insertSnippet(`<a href="${url}">TEXT</a>`);
                        }}
                        title="Hyperlink"
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt("Enter Image URL (e.g. https://images.unsplash.com/...):");
                          if (url) insertSnippet(`<img src="${url}" alt="Surface specification illustration" />\n`);
                        }}
                        title="Insert Image"
                        className="p-1.5 bg-white/5 hover:bg-white/15 text-gray-200 rounded-lg"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      rows={12}
                      value={form.content || ""}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Write your article in formatted HTML or plain paragraphs..."
                      className="w-full bg-[#111827] border border-white/10 rounded-2xl p-4 text-xs font-mono text-white leading-relaxed focus:outline-none focus:border-[#c5a880]"
                    />
                  </div>
                ) : (
                  /* Live Public Preview */
                  <div className="p-6 bg-white text-gray-800 rounded-2xl border border-gray-200 min-h-[300px] overflow-y-auto">
                    <div className="mb-4 pb-3 border-b border-gray-200">
                      <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                        {form.category}
                      </span>
                      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
                        {form.title || "Untitled Article Preview"}
                      </h1>
                      {form.subtitle && <p className="text-xs text-gray-500 italic mt-0.5">{form.subtitle}</p>}
                    </div>

                    <div
                      className="prose max-w-none text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:border-l-4 [&>h2]:border-amber-600 [&>h2]:pl-3 [&>h2]:mt-6 [&>h3]:text-base [&>h3]:font-bold [&>p]:leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>blockquote]:border-l-4 [&>blockquote]:border-blue-600 [&>blockquote]:bg-gray-50 [&>blockquote]:p-4 [&>blockquote]:rounded-xl [&>blockquote]:italic [&>img]:rounded-xl [&>img]:max-h-80 [&>img]:object-cover"
                      dangerouslySetInnerHTML={{ __html: form.content || "<p><em>No content written yet.</em></p>" }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: COVER IMAGE & AUTHOR */}
          {activeMainTab === "cover-author" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Cover Image */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-200">Cover / Hero Image *</label>
                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget("cover")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c5a880]/15 hover:bg-[#c5a880]/25 text-[#c5a880] border border-[#c5a880]/30 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Choose from Media Library</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={form.coverImage}
                  onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  placeholder="https://images.unsplash.com/photo-... or select from Media Library"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                />

                {/* Preset image buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {PRESET_BLOG_COVERS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm({ ...form, coverImage: preset.url })}
                      className="px-2.5 py-1 rounded-lg bg-[#111827] hover:bg-white/10 text-gray-300 text-[11px] border border-white/10 cursor-pointer"
                    >
                      + {preset.label}
                    </button>
                  ))}
                </div>

                {/* Image Live Thumbnail */}
                {form.coverImage && (
                  <div className="relative h-44 w-full max-w-md rounded-2xl overflow-hidden border border-white/10 mt-2 bg-black/40">
                    <img src={form.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              {/* Author Details */}
              <div className="border-t border-white/10 pt-5 space-y-4">
                <h4 className="text-xs font-bold text-[#c5a880] uppercase tracking-wider">Author Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={form.author?.name || ""}
                      onChange={(e) => setForm({ ...form, author: { ...(form.author || { role: "", avatar: "" }), name: e.target.value } })}
                      placeholder="Elena Vance"
                      className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Author Role</label>
                    <input
                      type="text"
                      value={form.author?.role || ""}
                      onChange={(e) => setForm({ ...form, author: { ...(form.author || { name: "", avatar: "" }), role: e.target.value } })}
                      placeholder="Senior Architectural Stylist"
                      className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-300">Author Avatar URL</label>
                      <button
                        type="button"
                        onClick={() => setMediaPickerTarget("author")}
                        className="text-[10px] text-[#c5a880] hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Library</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={form.author?.avatar || ""}
                      onChange={(e) => setForm({ ...form, author: { ...(form.author || { name: "", role: "" }), avatar: e.target.value } })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Publication Date</label>
                    <input
                      type="text"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      placeholder="May 18, 2026"
                      className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">Estimated Read Time</label>
                    <input
                      type="text"
                      value={form.readTime}
                      onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                      placeholder="5 Min Read"
                      className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SEO METADATA */}
          {activeMainTab === "seo" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 bg-[#090d16] border border-white/5 rounded-2xl space-y-1">
                <span className="text-[10px] text-[#c5a880] uppercase font-bold tracking-wider">Search Snippet Preview</span>
                <p className="text-sm font-semibold text-blue-400 truncate">
                  {form.metaTitle || `${form.title || "Blog Post"} | Timex Ceramic Blog`}
                </p>
                <p className="text-[11px] text-emerald-400 font-mono truncate">
                  https://www.timexceramic.com/blogs/{form.slug || "article-slug"}
                </p>
                <p className="text-xs text-gray-400 line-clamp-2">
                  {form.metaDescription || form.excerpt || "Curated architectural tiling trends, styling insights, and surface specifications by Timex Ceramic."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">SEO Meta Title</label>
                <input
                  type="text"
                  value={form.metaTitle}
                  onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                  placeholder="Curated Chaos: Why Unexpected Red Needs a Silent Partner | Timex Ceramic"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">SEO Meta Description</label>
                <textarea
                  rows={3}
                  value={form.metaDescription}
                  onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                  placeholder="Read our weekly design column on pairing bold accent surfaces with quiet stone porcelain backgrounds..."
                  className="w-full bg-[#111827] border border-white/10 rounded-xl p-3 text-xs text-white leading-relaxed focus:outline-none focus:border-[#c5a880]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-200 mb-1">Keywords & Topic Tags</label>
                <input
                  type="text"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                  placeholder="red tiles, ceramic trends, bathroom ideas, tile architecture"
                  className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#c5a880]"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-5 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-[#c5a880] to-[#b09166] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-[#c5a880]/20 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Saving Article...</span>
                </>
              ) : (
                <span>SAVE BLOG POST</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* MEDIA LIBRARY PICKER MODAL */}
      {mediaPickerTarget && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-white/10 rounded-3xl max-w-5xl w-full max-h-[85vh] overflow-y-auto p-6 relative shadow-2xl">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <h3 className="font-serif text-lg font-bold text-white">
                Select {mediaPickerTarget === "cover" ? "Cover Image" : "Author Avatar"} from Media Library
              </h3>
              <button
                type="button"
                onClick={() => setMediaPickerTarget(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <MediaManagerClient
              isPickerMode
              onSelectMedia={(media) => {
                if (mediaPickerTarget === "cover") {
                  setForm((prev) => ({ ...prev, coverImage: media.url }));
                } else if (mediaPickerTarget === "author") {
                  setForm((prev) => ({
                    ...prev,
                    author: { ...(prev.author || { name: "", role: "" }), avatar: media.url },
                  }));
                }
                setMediaPickerTarget(null);
              }}
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
