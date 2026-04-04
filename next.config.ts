import type { NextConfig } from "next";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: BASE_PATH || undefined,
  assetPrefix: BASE_PATH || undefined,
  turbopack: {},
  images: {
    remotePatterns: [],
  },
  serverExternalPackages: [],
  // Cache RSC responses on client to speed up back/forward navigation
  // static: pages that don't change between navigations (5 min cache)
  // dynamic: pages with user data (30 sec cache for quick back-nav)
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    return [
      {
        // Legacy: redirect old /api/uploads/:filename to /api/photos/:filename
        source: "/api/uploads/:filename",
        destination: "/api/photos/:filename",
      },
    ];
  },
};

export default nextConfig;
