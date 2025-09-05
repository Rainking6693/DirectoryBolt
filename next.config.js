/** @type {import('next').NextConfig} */

// === Derive Supabase origins for CSP from env (fallback to wildcard) ===
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
let SUPABASE_ORIGIN = 'https://*.supabase.co';
let SUPABASE_WS = 'wss://*.supabase.co';
try {
  if (SUPABASE_URL) {
    const u = new URL(SUPABASE_URL);
    SUPABASE_ORIGIN = u.origin;        // e.g., https://abcd.supabase.co
    SUPABASE_WS = `wss://${u.host}`;   // e.g., wss://abcd.supabase.co
  }
} catch { /* ignore malformed env */ }

const isProd = process.env.NODE_ENV === 'production';

// === Content Security Policy (CSP) ===
const csp = [
  "default-src 'self'",
  // Allow GA/GTM/Stripe/Sentry. Keep 'unsafe-eval' only in dev.
  `script-src 'self' ${isProd ? '' : "'unsafe-eval'"} 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com https://browser.sentry-cdn.com https://js.sentry-cdn.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  // Connect targets: Stripe, GA4 (incl. regional), GTM, Airtable, Supabase, Sentry, dev websockets
  `connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://api.airtable.com ${SUPABASE_ORIGIN} ${SUPABASE_WS} https://*.sentry.io wss: ws://localhost:3000 ws://localhost:*`,
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

// === Security headers ===
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  async redirects() {
    return [];
  },

  // (Optional) Unique build id; remove if you prefer better caching
  async generateBuildId() {
    return 'build-' + Date.now();
  },

  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },

  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  compiler: {
    removeConsole: isProd, // strip console.* in prod
  },

  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/puppeteer/.local-chromium/**/*',
      ],
    },
  },

  // Build-time env that will be inlined (public IDs are safe).
  // Uses your provided IDs as defaults; override via Netlify env if you like.
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NODE_ENV || 'development',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    // Your GA / GTM / Tag IDs (public)
    NEXT_PUBLIC_GA_MEASUREMENT_ID:
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-806DLVV41T',
    NEXT_PUBLIC_GTM_ID:
      process.env.NEXT_PUBLIC_GTM_ID || 'GTM-TJWH3TRK',
    NEXT_PUBLIC_GOOGLE_TAG_ID:
      process.env.NEXT_PUBLIC_GOOGLE_TAG_ID || 'GT-TQL3DMRD',
  },

  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },

  webpack: (config, { isServer }) => {
    // No Node core polyfills in browser bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
        'node:crypto': false,
        'node:events': false,
        'node:stream': false,
        'node:util': false,
        'node:buffer': false,
        'fs/promises': false,
      };
    }

    // Keep undici external on server
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({ undici: 'commonjs undici' });
    }

    return config;
  },
};

module.exports = nextConfig;
