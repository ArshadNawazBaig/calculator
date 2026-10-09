import type { NextConfig } from "next";
const config:NextConfig={poweredByHeader:false,turbopack:{resolveAlias:{buffer:{browser:"buffer/"}}},reactStrictMode:true,async redirects(){return [{source:"/percentage-calculator",destination:"/percent-calculator",permanent:true},{source:"/terms-and-services",destination:"/terms",permanent:true}];}};
export default config;
