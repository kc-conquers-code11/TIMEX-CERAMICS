"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";
import Card from "@/components/ui/Card";
import { ArrowRight, Clock, Calendar, Search } from "lucide-react";

interface BlogsListClientProps {
  initialBlogs: any[];
}

export function BlogsListClient({ initialBlogs }: BlogsListClientProps) {
  const [blogs, setBlogs] = useState(() =>
    (initialBlogs || []).filter((b) => String(b?.status || "Published").toLowerCase() !== "draft")
  );
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Live Database Rehydration: pulls newest and updated blog articles from API
  useEffect(() => {
    fetch("/api/v1/blogs?activeOnly=true&_t=" + Date.now())
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.blogs)) {
          setBlogs(data.blogs.filter((b: any) => String(b?.status || "Published").toLowerCase() !== "draft"));
        }
      })
      .catch(() => {});
  }, []);

  // Compute all available categories from blog data
  const categories = useMemo(() => {
    const set = new Set<string>();
    blogs.forEach((b) => {
      if (b.category) set.add(b.category.toUpperCase().trim());
    });
    return ["ALL", ...Array.from(set)];
  }, [blogs]);

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchCat =
        selectedCategory === "ALL" ||
        (b.category && b.category.toUpperCase().trim() === selectedCategory);
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        b.title?.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  const featuredPost = selectedCategory === "ALL" && !searchQuery ? filteredBlogs[0] : null;
  const regularPosts = featuredPost ? filteredBlogs.slice(1) : filteredBlogs;

  return (
    <>
      {/* Search and Category Filter Ribbon */}
      <div className="mb-12 space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#333333]/50 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search design feeds, trends, laying guides..."
              className="w-full pl-11 pr-4 py-3 bg-[#FCFBF8] border border-[#333333]/30 rounded-[2px] text-xs text-[#333333] placeholder-[#333333]/50 focus:outline-none focus:border-[#101B38] transition-colors"
            />
          </div>

          <div className="text-xs text-[#333333]/70 font-medium self-center">
            Showing <strong className="text-[#101B38]">{filteredBlogs.length}</strong> {filteredBlogs.length === 1 ? "article" : "articles"}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-[2px] text-[11px] font-medium tracking-wider uppercase whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#101B38] text-[#FCFBF8]"
                    : "bg-[#EDEAE4] text-[#333333] hover:bg-[#101B38] hover:text-[#FCFBF8]"
                }`}
              >
                {cat === "ALL" ? "All Feeds" : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Post Card (Hero Highlight) */}
      {featuredPost && (
        <div className="mb-16">
          <Reveal direction="up">
            <Link href={`/blogs/${featuredPost.slug}`} className="block group">
              <Card className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden border border-[#EDEAE4] shadow-xs hover:border-[#101B38]/30 transition-all duration-300 rounded-[2px] bg-[#FCFBF8]">
                <div className="lg:col-span-7 relative h-72 lg:h-[420px] w-full overflow-hidden bg-[#EDEAE4]">
                  <Image
                    src={featuredPost.coverImage}
                    alt={featuredPost.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                  <span className="absolute top-4 left-4 z-10 text-[9px] bg-[#101B38] text-[#FCFBF8] font-medium uppercase tracking-widest px-3 py-1.5 rounded-[2px]">
                    Featured Article
                  </span>
                </div>

                <div className="lg:col-span-5 p-8 md:p-12 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-[10px] text-[#C95745] font-semibold uppercase tracking-widest">
                      <span>{featuredPost.category}</span>
                      <span>•</span>
                      <span>{featuredPost.readTime}</span>
                    </div>

                    <h2 className="font-serif text-2xl md:text-4xl font-bold text-[#101B38] group-hover:text-[#C95745] transition-colors duration-300 leading-snug">
                      {featuredPost.title}
                    </h2>

                    <p className="text-xs md:text-sm text-[#333333]/70 font-light leading-relaxed line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  </div>

                  <div className="pt-6 border-t border-[#EDEAE4] flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={featuredPost.author?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
                        alt={featuredPost.author?.name || "Author"}
                        className="w-9 h-9 rounded-full object-cover border border-[#EDEAE4]"
                      />
                      <div>
                        <p className="text-xs font-medium text-[#101B38]">{featuredPost.author?.name || "Timex Editorial"}</p>
                        <p className="text-[10px] text-[#333333]/50 font-light">{featuredPost.date}</p>
                      </div>
                    </div>

                    <span className="text-xs font-semibold text-[#101B38] group-hover:text-[#C95745] transition-colors inline-flex items-center gap-1.5 uppercase tracking-wider font-sans pb-1.5 border-b border-[#EDEAE4] group-hover:border-[#C95745]">
                      <span>Read</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </Reveal>
        </div>
      )}

      {/* Regular Articles Grid */}
      <div className="space-y-6 mb-10">
        <h3 className="font-serif text-2xl font-bold text-[#101B38] border-b border-[#EDEAE4] pb-4">
          Recent Editorial Articles
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {regularPosts.map((post, idx) => (
          <Reveal key={post.slug || post.id || idx} direction="up" delay={idx * 0.1}>
            <Link href={`/blogs/${post.slug}`} className="block h-full group">
              <Card className="flex flex-col h-full bg-[#FCFBF8] border border-[#EDEAE4] shadow-xs hover:border-[#101B38]/30 transition-all duration-300 rounded-[2px] overflow-hidden">
                <div className="relative h-60 w-full overflow-hidden bg-[#EDEAE4]">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <span className="absolute top-4 left-4 z-10 text-[9px] bg-[#101B38] text-[#FCFBF8] font-medium uppercase tracking-widest px-3 py-1.5 rounded-[2px]">
                    {post.category}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 text-[10px] text-[#333333]/60 font-medium">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#C95745]" />
                        <span>{post.date}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-[#C95745]" />
                        <span>{post.readTime}</span>
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-[#101B38] group-hover:text-[#C95745] transition-colors duration-300 leading-snug line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-[#333333]/70 font-light leading-relaxed line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#EDEAE4]">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#101B38] group-hover:text-[#C95745] pb-1.5 border-b border-[#EDEAE4] group-hover:border-[#C95745] transition-colors uppercase tracking-wider font-sans">
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>
    </>
  );
}
