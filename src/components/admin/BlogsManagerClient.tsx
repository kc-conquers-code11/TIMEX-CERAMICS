"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { BlogItem } from "@/types/admin";
import { BlogEditorModal } from "./BlogEditorModal";

const API_BASE = "/api/v1";

const BLOG_CATEGORIES = ["TRENDS", "DESIGN TIPS", "CREATIVE", "NEWS", "GUIDES", "ARCHITECTURE"];

export function BlogsManagerClient() {
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [blogCategories, setBlogCategories] = useState<string[]>(BLOG_CATEGORIES);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogItem | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<{ id: string; title: string } | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      let res = await fetch(`${API_BASE}/blogs?_t=${Date.now()}`);
      if (!res.ok) {
        res = await fetch(`/api/blogs?_t=${Date.now()}`);
      }
      const data = await res.json();
      if (data.success && Array.isArray(data.blogs)) {
        setBlogs(data.blogs);
      } else if (Array.isArray(data)) {
        setBlogs(data);
      }
    } catch (err) {
      console.error("Failed to load blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();

    // Load dynamic blog categories (same source as the blog editor)
    fetch(`${API_BASE}/taxonomies/blog-categories?_t=${Date.now()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const rows = data?.categories || data?.data || data?.blogCategories;
        if (Array.isArray(rows) && rows.length > 0) {
          const names = rows
            .map((c: any) => (typeof c === "string" ? c : c.name || c.title || c.label))
            .filter(Boolean)
            .map((n: string) => String(n).toUpperCase().trim());
          const merged = Array.from(new Set([...names, ...BLOG_CATEGORIES]));
          if (merged.length > 0) setBlogCategories(merged);
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenAdd = () => {
    setEditingBlog(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BlogItem) => {
    setEditingBlog(b);
    setIsModalOpen(true);
  };

  const handleSave = async (blogData: Partial<BlogItem>) => {
    if (!blogData.title || !blogData.title.trim()) {
      alert("Please enter a blog title.");
      return;
    }

    setFormSaving(true);
    try {
      const isEdit = Boolean(editingBlog?.id || editingBlog?.slug);
      const targetSlug = editingBlog?.slug || blogData.slug || "";
      const url = isEdit ? `${API_BASE}/blogs/${targetSlug}` : `${API_BASE}/blogs`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
      });
      const data = await res.json();

      if (data.success && data.blog) {
        const isDraft = String(data.blog.status || blogData.status || "").toLowerCase() === "draft";
        showToast(
          isEdit
            ? (isDraft ? "Blog draft updated successfully!" : "Blog post updated successfully!")
            : (isDraft ? "Blog post saved as draft!" : "New blog post published!")
        );
        setIsModalOpen(false);

        setBlogs((prev) => {
          if (isEdit) {
            return prev.map((b) => (b.id === data.blog.id || b.slug === data.blog.slug ? data.blog : b));
          } else {
            return [data.blog, ...prev];
          }
        });

        fetchBlogs();
      } else {
        alert(data.error || "Failed to save blog post.");
      }
    } catch (err: any) {
      alert(`Error saving blog post: ${err.message}`);
    } finally {
      setFormSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!blogToDelete) return;
    const { id, title } = blogToDelete;
    try {
      const res = await fetch(`${API_BASE}/blogs/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast(`Blog article "${title}" moved to Recycle Bin.`);
        setBlogs((prev) => prev.filter((b) => b.id !== id && b.slug !== id));
      } else {
        alert(data.error || "Failed to move blog to trash.");
      }
    } catch (err: any) {
      alert(`Error deleting blog: ${err.message}`);
    } finally {
      setBlogToDelete(null);
    }
  };

  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesCategory =
        categoryFilter === "ALL" || b.category?.toLowerCase().trim() === categoryFilter.toLowerCase().trim();

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title?.toLowerCase().includes(q) ||
        b.slug?.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [blogs, categoryFilter, search]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#c5a880] text-black text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {blogToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d1424] border border-white/10 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6" />
              <h3 className="font-serif text-lg font-bold text-white">Move Blog Article to Recycle Bin</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Are you sure you want to move blog article <strong>"{blogToDelete.title}"</strong> to the Recycle Bin? It will be hidden from the public journal and can be restored at any time.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setBlogToDelete(null)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-lg"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Editor Modal */}
      {isModalOpen && (
        <BlogEditorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          editingBlog={editingBlog}
          saving={formSaving}
        />
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-white tracking-wide">Blog Posts Management</h2>
          <p className="text-xs text-gray-400">Publish architectural articles, design trend feed, and editorial insights.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchBlogs}
            title="Reload blog posts"
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors cursor-pointer border border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#c5a880]" : ""}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#c5a880] to-[#b09166] text-black font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-[#c5a880]/20 hover:opacity-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ADD BLOG</span>
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 bg-[#111827] border border-white/10 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title, excerpt, category, or slug..."
            className="w-full pl-10 pr-4 py-2 bg-[#090d16] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#c5a880]"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#090d16] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a880]"
          >
            <option value="ALL">All Blog Categories ({blogs.length})</option>
            {BLOG_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Blog Posts Table */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <div className="w-8 h-8 border-2 border-[#c5a880] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs">Loading articles...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <FileText className="w-12 h-12 text-gray-600 mx-auto" />
            <p className="text-sm font-medium text-gray-300">No blog posts found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0c1220] border-b border-white/10 text-gray-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3.5">Article</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Slug</th>
                  <th className="px-4 py-3.5">Author</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBlogs.map((b) => {
                  const cover =
                    b.coverImage ||
                    b.cover_image ||
                    b.image ||
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";
                  const isActive =
                    String(b.status || "Published").toLowerCase() !== "draft" &&
                    b.isActive !== false &&
                    b.is_active !== false;
                  const authorName =
                    typeof b.author === "object" && b.author !== null
                      ? b.author.name
                      : b.author || "Editorial Team";

                  return (
                    <tr key={b.id || b.slug} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 relative">
                            <img src={cover} alt={b.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="max-w-xs sm:max-w-md">
                            <p className="font-bold text-white text-xs group-hover:text-[#c5a880] transition-colors line-clamp-1">{b.title}</p>
                            <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">{b.excerpt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c5a880]/10 text-[#c5a880] border border-[#c5a880]/20">
                          {b.category || "TRENDS"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-gray-400">
                        /blogs/{b.slug}
                      </td>
                      <td className="px-4 py-3.5 text-gray-300">
                        {authorName}
                      </td>
                      <td className="px-4 py-3.5 text-gray-400 text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>{b.date || "Recent"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}
                        >
                          {isActive ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/blogs/${b.slug}`}
                            target="_blank"
                            title="View Article"
                            className="p-1.5 text-gray-400 hover:text-[#c5a880] hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(b)}
                            title="Edit Article"
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setBlogToDelete({ id: b.id, title: b.title })}
                            title="Delete Article"
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
