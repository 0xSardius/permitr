import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow importing the shared SDK (../../sdk) from outside the app root —
  // the examiner reuses the Codama-generated registry client and the
  // canonical citation-hash implementation rather than duplicating them.
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
