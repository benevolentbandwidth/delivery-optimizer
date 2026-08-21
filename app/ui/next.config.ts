import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  // The route PDF embeds Manrope, which is read from disk at request time.
  // Next's tracing cannot see a runtime fs read, so the files are listed
  // explicitly or they are dropped from the deployed bundle.
  outputFileTracingIncludes: {
    "/api/whatsapp/send-route": ["./src/assets/fonts/*.ttf"],
  },
};

export default nextConfig;
