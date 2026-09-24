import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@shop/ui", "@shop/types", "@shop/api-client"],
};

export default config;
