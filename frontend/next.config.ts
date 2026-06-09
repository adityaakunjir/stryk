import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  sentry: {
    hideSourceMaps: true,
    widenClientFileUpload: true,
    tunnelRoute: "/monitoring",
  }
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  silent: true,
  org: "stryk",
  project: "stryk-frontend",
});

