import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { resolveAlias: { buffer: { browser: "buffer/" } } },
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www\\.finflo\\.org" }],
        destination: "https://finflo.org/:path*",
        permanent: true,
      },
      { source: "/percentage-calculator", destination: "/percent-calculator", permanent: true },
      { source: "/terms-and-services", destination: "/terms", permanent: true },
    ];
  },
};
export default config;
