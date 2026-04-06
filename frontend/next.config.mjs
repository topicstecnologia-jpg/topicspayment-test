const backendApiUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"
).replace(/\/$/, "");
const usesExternalBackend = /^https?:\/\//.test(backendApiUrl);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!usesExternalBackend) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendApiUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
