import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: "github.com",
      },
      {
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
}

export default nextConfig
