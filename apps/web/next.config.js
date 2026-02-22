const { withSentryConfig } = require('@sentry/nextjs');
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize package imports to enable tree-shaking for barrel files
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-slider",
      "react-select",
      "@supabase/supabase-js",
    ],
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Minimize output by excluding source maps in production
  productionBrowserSourceMaps: false,

  webpack(config, { isServer }) {
    // Tree-shake mapbox-gl CSS import on the server
    if (isServer) {
      config.resolve.alias["mapbox-gl/dist/mapbox-gl.css"] = false;
    }

    return config;
  },
};

module.exports = withSentryConfig(
    nextConfig,
    {
        // For all available options, see:
        // https://github.com/getsentry/sentry-webpack-plugin#options

        // Suppresses source map uploading logs during build
        silent: true,
        org: "payeasy",
        project: "payeasy-web",
    },
    {
        // For all available options, see:
        // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

        // Upload a larger set of source maps for prettier stack traces (increases build time)
        widenClientFileUpload: true,

        // Transpiles SDK to be compatible with IE11 (increases bundle size)
        transpileClientSDK: true,

        // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
        tunnelRoute: "/monitoring",

        // Hides source maps from generated client bundles
        hideSourceMaps: true,

        // Automatically tree-shake Sentry logger statements to reduce bundle size
        disableLogger: true,
    }
);
module.exports = withBundleAnalyzer(nextConfig);
