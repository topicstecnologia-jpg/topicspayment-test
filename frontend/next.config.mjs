const configuredBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
).trim().replace(/\/$/, "");

function isLoopbackHostname(hostname) {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname.toLowerCase());
}

function shouldUseExternalBackend(url) {
  if (!/^https?:\/\//.test(url)) {
    return false;
  }

  try {
    const { hostname } = new URL(url);
    return !(process.env.NODE_ENV === "production" && isLoopbackHostname(hostname));
  } catch {
    return false;
  }
}

const usesExternalBackend = shouldUseExternalBackend(configuredBackendUrl);

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
        destination: `${configuredBackendUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
