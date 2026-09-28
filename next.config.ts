import type { NextConfig } from "next";

const externalAssetsUrl = process.env.NEXT_PUBLIC_ASSETS_BASE_URL
  ? new URL(process.env.NEXT_PUBLIC_ASSETS_BASE_URL)
  : null;

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.100.135", "192.168.101.73"],
  ...(externalAssetsUrl
    ? {
        images: {
          remotePatterns: [
            {
              protocol: externalAssetsUrl.protocol.replace(":", "") as "http" | "https",
              hostname: externalAssetsUrl.hostname,
              port: externalAssetsUrl.port,
              pathname: `${externalAssetsUrl.pathname.replace(/\/$/, "")}/**`,
            },
          ],
        },
      }
    : {}),
};

export default nextConfig;
