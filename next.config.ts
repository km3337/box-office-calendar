import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.the-numbers.com",
        pathname: "/images/movie-posters/**",
      },
    ],
  },
};

export default nextConfig;
