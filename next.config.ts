import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ties the client bundle to its deployment. A browser still running an older
  // bundle is forced to reload instead of posting a server-action id that no
  // longer exists ("Failed to find Server Action").
  // Next rejects ids longer than 32 characters and the git sha is 40, so the
  // platform id is preferred with a truncated sha as the fallback.
  deploymentId:
    process.env.VERCEL_DEPLOYMENT_ID ??
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 32),
  poweredByHeader: false,
  // Inspiration photos and payment proofs are uploaded through Server Actions;
  // the default 1 MB body limit is too small (8 MB per file, several files).
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
