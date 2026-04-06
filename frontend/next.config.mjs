const configuredBackendUrl = (
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
).replace(/\/$/, "");

const isLocalBackendUrl =
  configuredBackendUrl === "" ||
  /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(configuredBackendUrl);

const usesExternalBackend =
  /^https?:\/\//.test(configuredBackendUrl) &&
  !(process.env.NODE_ENV === "production" && isLocalBackendUrl);

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
