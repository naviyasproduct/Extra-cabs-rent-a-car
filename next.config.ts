import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Identity documents are uploaded through a server action, and those
      // requests are capped at 1MB by default. A phone photograph of an NIC
      // is routinely 2 to 5MB, so every real upload would fail before
      // saveDocument() ever ran, with an error the customer cannot act on.
      //
      // 10mb leaves room above the 8MB cap in lib/panel/uploads.ts for the
      // boundaries and part headers multipart/form-data adds. The real limit
      // is the one in uploads.ts, which refuses the file with a sentence
      // explaining why; this only has to be the larger of the two.
      bodySizeLimit: "10mb",
    },
  },
  images: {
    // Local files only for now. Add remote CDN patterns here when the
    // backend starts serving uploaded fleet photos.
    remotePatterns: [],
    // Capped at 1920. The defaults go up to 3840, which meant every cold load
    // of the hero paid to resize a 1920px source *up* to 4K for no visible
    // gain, slow enough that the image could miss the first paint.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
  },
};

export default nextConfig;
