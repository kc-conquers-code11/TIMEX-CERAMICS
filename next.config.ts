import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://localhost:5001";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  basePath: "",
  distDir: ".next",
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "localhost",
    "127.0.0.1",
  ],
  async redirects() {
    return [
      {
        source: "/products",
        destination: "/world-of-tiles",
        permanent: true,
      },
      {
        source: "/collections/:slug",
        destination: "/product-category/:slug",
        permanent: true,
      },
      {
        source: "/catalogues/:path*",
        destination: "/catalogue/:path*",
        permanent: true,
      },
      // Consolidated Space Categories 301 Redirects
      {
        source: "/living-room-tiles",
        destination: "/living-dining-room-tiles",
        permanent: true,
      },
      {
        source: "/dining-room-tiles",
        destination: "/living-dining-room-tiles",
        permanent: true,
      },
      {
        source: "/cafe-tiles",
        destination: "/cafe-restaurant-tiles",
        permanent: true,
      },
      {
        source: "/restaurant-tiles",
        destination: "/cafe-restaurant-tiles",
        permanent: true,
      },
      {
        source: "/commercial-tiles",
        destination: "/commercial-office-tiles",
        permanent: true,
      },
      {
        source: "/office-tiles",
        destination: "/commercial-office-tiles",
        permanent: true,
      },
      {
        source: "/elevation-tiles",
        destination: "/elevation-exterior-tiles",
        permanent: true,
      },
      {
        source: "/featured-wall-tiles",
        destination: "/elevation-exterior-tiles",
        permanent: true,
      },
      {
        source: "/hotel-tiles",
        destination: "/hotel-hospitality-tiles",
        permanent: true,
      },
      {
        source: "/outdoor-tiles",
        destination: "/outdoor-landscape-tiles",
        permanent: true,
      },
      {
        source: "/parking-tiles",
        destination: "/outdoor-landscape-tiles",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${backendUrl}/uploads/:path*`,
      },
      {
        source: "/catalogue/:path*",
        destination: `${backendUrl}/catalogue/:path*`,
      },
      {
        source: "/catalogues/:path*",
        destination: `${backendUrl}/catalogues/:path*`,
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "assets.mixkit.co",
      },
      {
        protocol: "https",
        hostname: "**.trycloudflare.com",
      },
      {
        protocol: "https",
        hostname: "www.timexceramic.com",
      },
      {
        protocol: "https",
        hostname: "timexceramic.com",
      },
    ],
  },
};

export default nextConfig;
