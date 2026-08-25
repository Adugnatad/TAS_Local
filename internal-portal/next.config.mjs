/** @type {import('next').NextConfig} */
const portalCore = process.env.PORTAL_CORE_URL ?? "http://localhost:8080";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/portal-api/:path*",
        destination: `${portalCore}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
