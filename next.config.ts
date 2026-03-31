import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-build",
  serverExternalPackages: ["@react-pdf/renderer"],
  outputFileTracingExcludes: {
    "*": ["**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
