import type { NextConfig } from "next";

import { securityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      }
    ]
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders
      },
      {
        source: "/:path*\\.(svg|png|jpg|jpeg|gif|webp|avif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable"
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: "/collections/chocolate-covered-cookies-and-cream",
        destination: "/collections/chocolate-covered-strawberries",
        statusCode: 301
      },
      {
        source: "/collections/Cake-Pops",
        destination: "/collections/cake-pops",
        statusCode: 301
      },
      {
        source: "/collections/Cakesicles",
        destination: "/collections/cakesicles",
        statusCode: 301
      }
    ];
  }
};

export default nextConfig;
