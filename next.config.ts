import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Local files only for now. Add remote CDN patterns here when the
    // backend starts serving uploaded fleet photos.
    remotePatterns: [],
    // Capped at 1920. The defaults go up to 3840, which meant every cold load
    // of the hero paid to resize a 1920px source *up* to 4K for no visible
    // gain — slow enough that the image could miss the first paint.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
  },
};

export default nextConfig;
