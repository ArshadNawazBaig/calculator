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
      { source: "/en/:path*", destination: "/:path*", permanent: true },
      { source: "/:locale(es|fr|de|pt|ar)/percentage-calculator", destination: "/:locale/percent-calculator", permanent: true },
      { source: "/:locale(es|fr|de|pt|ar)/terms-and-services", destination: "/:locale/terms", permanent: true },
    ];
  },
};
export default config;
