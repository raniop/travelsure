import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/buyinsnew",
  images: {
    unoptimized: true, // Disable image optimization for Netlify compatibility
  },
  /* config options here */
};

export default nextConfig;
