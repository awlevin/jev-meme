import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Renderer and API read these from disk at runtime.
  outputFileTracingIncludes: {
    "/api/meme": ["./public/samples/**"],
    "/m/[id]/image.png": ["./public/samples/**", "./assets/fonts/**"],
    "/m/[id]/card.png": ["./public/samples/**", "./assets/fonts/**"],
  },
};

export default nextConfig;
