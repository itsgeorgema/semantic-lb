import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/events",
        destination: `${process.env.PROXY_URL || "http://localhost:8080"}/events`,
      },
    ];
  },
};

export default nextConfig;
