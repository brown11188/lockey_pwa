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
  async rewrites() {
    return [
      {
        // Legacy: redirect old /api/uploads/:filename to /api/photos/:filename
        source: "/api/uploads/:filename",
        destination: "/api/photos/:filename",
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
