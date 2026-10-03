import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Silence the dev-only cross-origin warning from the preview sandbox origin.
  allowedDevOrigins: ["*.space-z.ai"],
};

export default nextConfig;
