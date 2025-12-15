import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
<<<<<<< HEAD
        hostname: "intern-2025-bucket.s3.amazonaws.com",
=======
        hostname: "intern-2025-bucket.s3.ap-southeast-1.amazonaws.com",
>>>>>>> origin/main
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
