import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-build",
  serverExternalPackages: ["pdfkit"],
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
