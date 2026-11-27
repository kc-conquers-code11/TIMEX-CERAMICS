import React from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCollectionBySlug, getAllCollections, Collection } from "@/data/collections";
import { getCategoryBySlug, resolveCategoryImage } from "@/services/categories";
import { getProducts } from "@/services/product";
import { getCollectionSeoData } from "@/services/collectionSeo";
import { getSeoMetadata, buildPageMetadata } from "@/services/seo";
import { ArrowLeft } from "lucide-react";
import { CollectionSeoSection } from "@/components/collection/CollectionSeoSection";
import { CollectionProductGridClient, LiveCategoryCount } from "@/components/collection/CollectionProductGridClient";
import { matchesProductCategory } from "@/utils/productCategories";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 10;

export async function generateStaticParams() {
  const { getAllCollections } = await import("@/data/collections");
  const collections = getAllCollections();
  const params = collections.map((c) => ({
    slug: c.slug,
  }));
  if (!params.some((p) => p.slug === "colourful")) {
    params.push({ slug: "colourful" });
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const seo = await getSeoMetadata(`/product-category/${slug}`);
  return buildPageMetadata(seo);
}

export default async function ProductCategoryDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  const fallbackCollection = !cat ? getCollectionBySlug(slug) : undefined;

  // Single Source of Truth: Reuse the exact same image mapping as the World of Tiles navigation menu
  const bannerImage = cat
    ? resolveCategoryImage(cat)
    : (fallbackCollection ? resolveCategoryImage(fallbackCollection) : "/images/hero-bg.jpg");

  let collection: Collection | undefined = cat
    ? {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        subtitle: cat.seoTitle || `${cat.name} Luxury Slabs & Tiles`,
        shortDesc: cat.metaDescription || cat.description || "",
        description: cat.description || `Explore ${cat.name} curated collection from Timex Ceramic.`,
        banner: bannerImage,
        thumbnail: bannerImage,
        icon: `/images/collections/${cat.slug}.svg`,
        featured: false,
        productCount: cat.productCount || 0,
        previewImages: [bannerImage],
        link: `/product-category/${cat.slug}`,
        column: 1,
      }
    : (fallbackCollection ? { ...fallbackCollection, banner: bannerImage, thumbnail: bannerImage } : undefined);

  if (!collection) {
    notFound();
  }

  const seoData = await getCollectionSeoData(slug);

  // Filter products for this category from live database (Primary + All Additional Categories)
  const allProducts = await getProducts();
  const seenIds = new Set<string>();
  const categoryProducts = allProducts.filter((p) => {
    if (!p) return false;
    if (
      p.is_trashed ||
      p.isTrashed ||
      p.isActive === false ||
      p.is_active === false ||
      p.status === "Inactive" ||
      p.status === "Draft"
    ) {
      return false;
    }

    const isMatch =
      matchesProductCategory(p, collection.slug) ||
      matchesProductCategory(p, collection.id) ||
      matchesProductCategory(p, collection.name);

    if (!isMatch) return false;

    const key = String(p.id || p.slug || "").trim();
    if (key) {
      if (seenIds.has(key)) return false;
      seenIds.add(key);
    }
    return true;
  });

  // Fallback to top products if category count is small
  const displayProducts = categoryProducts.length > 0 ? categoryProducts : allProducts.slice(0, 8);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: seoData.metaTitle || `${collection.name} Tiles | Timex Ceramic`,
    description: seoData.metaDescription || collection.description,
    url: `https://www.timexceramic.com/product-category/${collection.slug}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: displayProducts.map((prod, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: `https://www.timexceramic.com/product/${prod.slug}`,
        name: prod.name,
      })),
    },
  };

  const publishedFaqs = (seoData.faqs || []).filter(
    (f: any) => (f.status ? f.status === "published" : true) && f.question && f.answer
  );

  const faqJsonLd =
    publishedFaqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: publishedFaqs.map((faq: any) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-[#F7F5F0] relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Hero Banner Section */}
      <section className="relative h-[60vh] min-h-[440px] w-full overflow-hidden flex items-center justify-center bg-[#101B38]">
        <Image
          src={bannerImage}
          alt={collection.name}
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101B38] via-[#101B38]/50 to-transparent" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center text-[#FCFBF8] space-y-6">
          <Link
            href="/collections"
            className="inline-flex items-center space-x-2 text-[10px] uppercase font-medium tracking-[0.25em] text-[#C95745] hover:text-[#FCFBF8] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </Link>

          {collection.slug === "brick" || collection.slug === "marble" ? (
            <h2 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-[#FCFBF8] leading-tight">
              {collection.name} Tiles
            </h2>
          ) : (
            <h1 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-[#FCFBF8] leading-tight">
              {collection.name} Tiles
            </h1>
          )}
          <p className="text-xs md:text-sm font-light text-[#EDEAE4]/80 max-w-2xl mx-auto leading-relaxed">
            {collection.description}
          </p>

          <div className="flex items-center justify-center space-x-8 pt-4">
            <div className="text-center">
              <LiveCategoryCount
                initialCount={categoryProducts.length}
                collectionSlug={collection.slug}
                collectionId={collection.id}
                collectionName={collection.name}
              />
              <span className="text-[9px] uppercase tracking-widest text-[#EDEAE4]/70 font-medium">Designs Available</span>
            </div>
            <div className="w-[1px] h-8 bg-[#EDEAE4]/20" />
            <div className="text-center">
              <span className="block font-serif text-2xl font-bold text-[#FCFBF8]">Imported</span>
              <span className="text-[9px] uppercase tracking-widest text-[#EDEAE4]/70 font-medium">Grade Quality</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid with Live Rehydration */}
      <CollectionProductGridClient
        initialProducts={displayProducts}
        collectionSlug={collection.slug}
        collectionId={collection.id}
        collectionName={collection.name}
      />

      {/* Dynamic SEO & FAQ Content Area (Full Width) */}
      <CollectionSeoSection seoData={seoData} />
    </div>
  );
}
