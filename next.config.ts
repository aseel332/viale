import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Allow custom bottle-image uploads up to the 10 MB cap enforced in
      // lib/server/storage.ts, with headroom for multipart overhead and other
      // form fields. Without this, Next.js rejects bodies over its 1 MB default.
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
