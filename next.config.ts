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
  async headers() {
    return [
      {
        // The same deployment answers on extracabs.lk AND on its
        // *.vercel.app address. Both serve the whole site, so without this
        // the vercel.app copy is a second, fully crawlable version of every
        // page, competing with the real domain for the exact searches this
        // site is being built to win.
        //
        // X-Robots-Tag, not robots.txt: robots.txt is one static file for the
        // deployment and cannot answer differently per host, and a
        // disallowed URL can still be indexed from a link. This header is the
        // instruction not to index, and it is host-scoped.
        //
        // Deliberately NOT a redirect to extracabs.lk: the vercel.app address
        // has to stay usable for testing, including before the domain
        // resolves. Canonicals already point at NEXT_PUBLIC_SITE_URL.
        source: "/:path*",
        has: [{ type: "host", value: "(?<vercelHost>.+[.]vercel[.]app)" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  images: {
    // Vehicle photos come from Cloudinary. SafeImage attaches a Cloudinary
    // loader for them, so Next's optimiser is bypassed and this pattern is a
    // backstop for any plain <Image> pointed at a delivery URL.
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
    ],
    // Capped at 1920. The defaults go up to 3840, which meant every cold load
    // of the hero paid to resize a 1920px source *up* to 4K for no visible
    // gain, slow enough that the image could miss the first paint.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
  },
};

export default nextConfig;
