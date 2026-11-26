"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Video,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  Film,
} from "lucide-react";
import {
  WATCH_AND_CHOOSE_VIDEOS,
  WATCH_AND_CHOOSE_CATEGORIES,
  WatchAndChooseItem,
  WatchAndChooseCategory,
  WatchAndChoosePlatform,
} from "@/data/watchAndChoose";

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:shorts\/|v\/|watch\?v=|embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function extractInstagramShortcode(url: string): string | null {
  const m = url.match(/instagram\.com\/(?:reel|p)\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export function VideosManagerClient() {
  const [videos, setVideos] = useState<WatchAndChooseItem[]>(WATCH_AND_CHOOSE_VIDEOS);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New video modal state
  const [newUrl, setNewUrl] = useState<string>("");
  const [newCategories, setNewCategories] = useState<WatchAndChooseCategory[]>([
    "PRODUCT HIGHLIGHTS",
  ]);
  const [modalError, setModalError] = useState<string>("");
  const [modalSuccess, setModalSuccess] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch from API if server is running
  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/videos");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          // Normalize API format to WatchAndChooseItem
          const normalized: WatchAndChooseItem[] = json.data.map((v: any) => ({
            id: v.id,
            order: Number(v.order) || 0,
            platform: v.platform,
            postType: v.post_type || v.postType || "Short",
            url: v.url,
            videoId: v.video_id || v.videoId,
            shortcode: v.shortcode,
            categories: v.categories || [],
            thumbnail: v.thumbnail,
            hqThumbnail: v.hq_thumbnail || v.hqThumbnail,
            embedUrl: v.embed_url || v.embedUrl,
            status: v.status || "published",
          }));
          setVideos(normalized);
        }
      }
    } catch {
      // Fallback already loaded
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  // Filtered videos
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (categoryFilter !== "ALL" && !v.categories.includes(categoryFilter as any)) {
        return false;
      }
      if (platformFilter !== "ALL" && v.platform !== platformFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesUrl = v.url.toLowerCase().includes(q);
        const matchesOrder = String(v.order).includes(q) || `#${v.order}`.includes(q);
        const matchesId =
          (v.videoId && v.videoId.toLowerCase().includes(q)) ||
          (v.shortcode && v.shortcode.toLowerCase().includes(q));
        const matchesCat = v.categories.some((c) => c.toLowerCase().includes(q));
        if (!matchesUrl && !matchesOrder && !matchesId && !matchesCat) return false;
      }
      return true;
    });
  }, [videos, categoryFilter, platformFilter, search]);

  const handleToggleCategory = (cat: WatchAndChooseCategory) => {
    if (newCategories.includes(cat)) {
      if (newCategories.length > 1) {
        setNewCategories(newCategories.filter((c) => c !== cat));
      }
    } else {
      setNewCategories([...newCategories, cat]);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    const url = newUrl.trim();
    if (!url) {
      setModalError("Please enter a valid video URL.");
      return;
    }

    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    const isInstagram = url.includes("instagram.com");

    if (!isYouTube && !isInstagram) {
      setModalError("Please enter a valid YouTube Shorts or Instagram Reel/Post URL.");
      return;
    }

    // Check duplicate
    const cleanUrl = url.replace(/\?.*$/, "").replace(/\/$/, "");
    const exists = videos.some((v) => {
      const vClean = (v.url || "").replace(/\?.*$/, "").replace(/\/$/, "");
      return vClean === cleanUrl;
    });

    if (exists) {
      setModalError("This video URL is already present in the collection.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/v1/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          categories: newCategories,
          status: "published",
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setModalSuccess("Video added successfully!");
        setNewUrl("");
        await fetchVideos();
        setTimeout(() => {
          setIsAddModalOpen(false);
          setModalSuccess("");
        }, 1200);
      } else {
        setModalError(json.error || "Failed to add video.");
      }
    } catch {
      // Local fallback addition
      const newOrder = videos.length > 0 ? Math.max(...videos.map((v) => v.order)) + 1 : 1;
      let newEntry: WatchAndChooseItem;

      if (isYouTube) {
        const videoId = extractYouTubeId(url) || "custom";
        newEntry = {
          id: `wac-yt-${Date.now()}`,
          order: newOrder,
          platform: "YouTube",
          postType: "Short",
          videoId,
          url,
          categories: newCategories,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          status: "published",
        };
      } else {
        const shortcode = extractInstagramShortcode(url) || "custom";
        newEntry = {
          id: `wac-ig-${Date.now()}`,
          order: newOrder,
          platform: "Instagram",
          postType: url.includes("/reel/") ? "Reel" : "Post",
          shortcode,
          url,
          categories: newCategories,
          embedUrl: `https://www.instagram.com/p/${shortcode}/embed/`,
          thumbnail: `/images/instagram/${shortcode}.jpg`,
          status: "published",
        };
      }

      setVideos([newEntry, ...videos]);
      setModalSuccess("Video added locally!");
      setNewUrl("");
      setTimeout(() => {
        setIsAddModalOpen(false);
        setModalSuccess("");
      }, 1000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Are you sure you want to remove this video from the collection?")) return;

    try {
      await fetch(`/api/v1/videos/${id}`, { method: "DELETE" });
    } catch {
      // Ignore
    }
    setVideos((prev) => prev.filter((v) => v.id !== id));
  };

  const ytCount = videos.filter((v) => v.platform === "YouTube").length;
  const igCount = videos.filter((v) => v.platform === "Instagram").length;

  return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c5a880] mb-1">
                <Video className="w-4 h-4" />
                <span>VIDEO MANAGEMENT</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-wide">
                Watch and Choose Videos
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Manage all 217 YouTube Shorts and Instagram video entries, assigned categories, and discovery filters.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchVideos}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded text-xs flex items-center gap-1.5 border border-white/10 transition-colors"
                title="Refresh list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-[#C95745] hover:bg-[#a84434] text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Video Link</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0d1424] border border-white/10">
              <span className="text-[11px] text-gray-400 font-medium block">Total Videos</span>
              <span className="text-2xl font-bold text-white mt-1 block">{videos.length}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0d1424] border border-white/10">
              <span className="text-[11px] text-gray-400 font-medium block">YouTube Shorts</span>
              <span className="text-2xl font-bold text-[#FF4E45] mt-1 block">{ytCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0d1424] border border-white/10">
              <span className="text-[11px] text-gray-400 font-medium block">Instagram Reels / Posts</span>
              <span className="text-2xl font-bold text-[#E1306C] mt-1 block">{igCount}</span>
            </div>
            <div className="p-4 rounded-xl bg-[#0d1424] border border-white/10">
              <span className="text-[11px] text-gray-400 font-medium block">Discovery Categories</span>
              <span className="text-2xl font-bold text-[#c5a880] mt-1 block">6</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 rounded-xl bg-[#0d1424] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#152037] border border-white/15 rounded text-gray-200 focus:outline-none focus:border-[#C95745]"
              >
                <option value="ALL">All Categories ({videos.length})</option>
                {WATCH_AND_CHOOSE_CATEGORIES.map((c) => {
                  if (c === "ALL VIDEOS") return null;
                  const count = videos.filter((v) => v.categories.includes(c)).length;
                  return (
                    <option key={c} value={c}>
                      {c} ({count})
                    </option>
                  );
                })}
              </select>

              {/* Platform Filter */}
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#152037] border border-white/15 rounded text-gray-200 focus:outline-none focus:border-[#C95745]"
              >
                <option value="ALL">All Platforms</option>
                <option value="YouTube">YouTube Shorts ({ytCount})</option>
                <option value="Instagram">Instagram ({igCount})</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, URL, order..."
                className="w-full pl-8 pr-7 py-1.5 bg-[#152037] border border-white/15 rounded text-gray-200 text-xs placeholder-gray-500 focus:outline-none focus:border-[#C95745]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Videos Table */}
          <div className="rounded-xl bg-[#0d1424] border border-white/10 overflow-hidden shadow-lg">
            <div className="p-4 border-b border-white/10 flex items-center justify-between text-xs text-gray-400">
              <span>
                Showing <strong className="text-white">{filteredVideos.length}</strong> of{" "}
                <strong className="text-white">{videos.length}</strong> videos
              </span>
              <a
                href="/watch-and-choose"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#c5a880] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View Public Page</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="overflow-x-auto max-h-[640px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#101b38] text-gray-300 uppercase tracking-wider sticky top-0 z-10 text-[10px] border-b border-white/10">
                  <tr>
                    <th className="p-3 w-16 text-center">#</th>
                    <th className="p-3 w-20">Preview</th>
                    <th className="p-3 w-28">Platform</th>
                    <th className="p-3">Video URL &amp; Identifier</th>
                    <th className="p-3">Categories</th>
                    <th className="p-3 w-24">Status</th>
                    <th className="p-3 w-20 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-white/5 transition-colors">
                      {/* Order */}
                      <td className="p-3 text-center font-bold text-gray-400">
                        #{video.order}
                      </td>

                      {/* Thumbnail */}
                      <td className="p-3">
                        <div className="w-12 h-16 rounded overflow-hidden bg-black/60 relative border border-white/15">
                          <img
                            src={video.thumbnail}
                            alt={`Preview #${video.order}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </td>

                      {/* Platform */}
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            video.platform === "YouTube"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                          }`}
                        >
                          {video.platform === "YouTube" ? "YouTube Shorts" : `IG ${video.postType}`}
                        </span>
                      </td>

                      {/* URL & ID */}
                      <td className="p-3 max-w-xs">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono text-gray-200 text-[11px] truncate">
                            {video.videoId || video.shortcode || "ID"}
                          </span>
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-[#C95745] shrink-0"
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        <span className="text-[10px] text-gray-500 truncate block">
                          {video.url}
                        </span>
                      </td>

                      {/* Categories */}
                      <td className="p-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {video.categories.map((c) => (
                            <span
                              key={c}
                              className="px-1.5 py-0.5 rounded bg-white/10 text-gray-200 text-[9.5px] font-medium"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {video.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteVideo(video.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                          title="Delete video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Video Modal */}
          {isAddModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              <div
                className="w-full max-w-lg bg-[#0d1424] border border-white/20 rounded-xl p-6 shadow-2xl text-white space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-[#C95745]" />
                    <h3 className="font-serif text-lg font-bold">Add New Video Link</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1 text-gray-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {modalError && (
                  <div className="p-3 rounded bg-red-500/20 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {modalSuccess && (
                  <div className="p-3 rounded bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{modalSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleAddVideo} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-gray-300 font-medium mb-1">
                      Video URL (YouTube Shorts or Instagram Reel/Post) *
                    </label>
                    <input
                      type="url"
                      required
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="e.g. https://www.youtube.com/shorts/... or https://www.instagram.com/reel/..."
                      className="w-full px-3 py-2 bg-[#152037] border border-white/15 rounded text-white placeholder-gray-500 focus:outline-none focus:border-[#C95745]"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-medium mb-2">
                      Assign Categories (select at least one)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {WATCH_AND_CHOOSE_CATEGORIES.map((cat) => {
                        if (cat === "ALL VIDEOS") return null;
                        const isChecked = newCategories.includes(cat);
                        return (
                          <label
                            key={cat}
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                              isChecked
                                ? "bg-[#C95745]/20 border-[#C95745] text-white"
                                : "bg-[#152037] border-white/10 text-gray-400 hover:border-white/30"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleCategory(cat)}
                              className="rounded accent-[#C95745]"
                            />
                            <span className="text-[11px] font-semibold">{cat}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2 bg-[#C95745] hover:bg-[#a84434] text-white rounded font-bold transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Adding..." : "Add Video"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
  );
}
