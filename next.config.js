/** @type {import('next').NextConfig} */

// Security headers for CSP and security compliance
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://airtable.com https://api.airtable.com wss:",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "upgrade-insecure-requests",
      "require-trusted-types-for 'script'",
      "trusted-types 'default' 'nextjs'"
    ].join('; ')
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Embedder-Policy', 
    value: 'require-corp'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(self)'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
]

const nextConfig = {
  // Minimal configuration to avoid hanging issues
  reactStrictMode: true,
  swcMinify: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders
      }
    ]
  },
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Modern browser support to reduce polyfills
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Experimental features for Node.js compatibility
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  
  // Keep API routes enabled
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },

  // Webpack configuration to handle Node.js modules and server-only code
  webpack: (config, { isServer }) => {
    // Add fallbacks for Node.js modules in client-side code
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
      }
    }

    // Ensure proper handling of undici in server environment
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'undici': 'commonjs undici'
      })
    }

    return config
  },
}

module.exports = nextConfig