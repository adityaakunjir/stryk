import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  }
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

