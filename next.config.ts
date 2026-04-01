import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: ".next-build",
  output: "standalone",
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
