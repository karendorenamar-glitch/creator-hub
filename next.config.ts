import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inspiration photos and payment proofs are uploaded through Server Actions;
  // the default 1 MB body limit is too small (8 MB per file, several files).
  experimental: {
    serverActions: {
      bodySizeLimit: "60mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
