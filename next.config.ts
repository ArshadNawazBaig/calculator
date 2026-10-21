import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  turbopack: { resolveAlias: { buffer: { browser: "buffer/" } } },
  reactStrictMode: true,
  // There are separate root layouts for English and each translated site.
  // Unknown routes (including dynamicParams=false misses) need a global 404.
  experimental: { globalNotFound: true },
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
      // An empty wildcard destination produces an empty Location for /en.
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path+", destination: "/:path+", permanent: true },
      { source: "/:locale(es|fr|de|pt|ar|hi|tl)/percentage-calculator", destination: "/:locale/percent-calculator", permanent: true },
      { source: "/:locale(es|fr|de|pt|ar|hi|tl)/terms-and-services", destination: "/:locale/terms", permanent: true },
    ];
  },
};
export default config;
