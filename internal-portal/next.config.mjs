/** @type {import('next').NextConfig} */
const portalCore = process.env.PORTAL_CORE_URL ?? "http://localhost:8080";

const nextConfig = {
  async rewrites() {
    return [
      // Compatibility for stale client bundles that still call /portal-api/*
      {
        source: "/portal-api/:path*",
        destination: `${portalCore}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
