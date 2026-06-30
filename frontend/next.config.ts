import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  // Re-enable unoptimized images so external avatars (Clerk/Dicebear) load correctly
  images: {
    unoptimized: true,
  },
  // Brotli/gzip all responses
  compress: true,
  poweredByHeader: false,
  // Allow images from external domains used in the app
  // (flagcdn for country flags, dicebear for avatars, Clerk for profile photos)
  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Cache public folder assets (logos, card images) for 1 hour
        source: "/(.*\\.webp|.*\\.png|.*\\.jpg|.*\\.svg)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "stryk",
  project: "stryk-frontend",
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  sourcemaps: {
    disable: true,
  },
});
