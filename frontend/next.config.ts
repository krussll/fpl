import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/**/*": ["./.fpl_cache/**/*"],
  },
};

export default nextConfig;
