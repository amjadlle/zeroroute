import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/signup",
        destination: "/api/checkout",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/widget.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
