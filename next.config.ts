import type { NextConfig } from "next";

const outputMode =
  process.env.NEXT_OUTPUT === "export" ? "export" : "standalone";

const nextConfig: NextConfig = {
  output: outputMode,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: "100kb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://cdn.jsdelivr.net https://world.openfoodfacts.org https://fundingchoicesmessages.google.com data: blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://fundingchoicesmessages.google.com https://va.vercel-scripts.com",
              "frame-src https://googleads.g.doubleclick.net https://tesseract.projectnaptha.com",
              "img-src 'self' data: blob: https://pagead2.googlesyndication.com",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/sw.js",
        destination: "/sw.js",
      },
      {
        source: "/manifest.json",
        destination: "/manifest.json",
      },
    ];
  },
};

export default nextConfig;
