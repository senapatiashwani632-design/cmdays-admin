import type { NextConfig } from "next";

// next.config.js in your ADMIN app (cmdays-admin)
const nextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Accept" },
        ],
      },
    ];
  },
};

export default nextConfig;
//export default nextConfig;
