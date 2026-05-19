import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // explicit root silences the "multiple lockfiles" warning since /Users/admin/ has
  // an unrelated package-lock.json that turbopack would otherwise prefer.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
