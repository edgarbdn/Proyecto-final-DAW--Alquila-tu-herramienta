import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "zakxciagimnpnalfopos.supabase.co",
      },
    ],
  },
};

export default nextConfig;
