import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://maps.google.com https://www.google.com;",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [{ source: "/", destination: "/shop" }],
    };
  },
};

export default nextConfig;