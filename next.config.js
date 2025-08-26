/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance and Production Optimizations
  experimental: {
    // Disable CSS optimization for Netlify compatibility
    optimizeCss: process.env.NETLIFY ? false : true,
    scrollRestoration: true,
  },
  
  // Image optimization for better performance
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
  
  // Environment variables for different stages
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
  },
  
  // Build optimization
  swcMinify: true,
  
  // Static export configuration for Netlify
  output: process.env.NETLIFY ? 'export' : undefined,
  trailingSlash: true,
  
  // Netlify-specific optimizations
  async rewrites() {
    // Only apply rewrites when not in export mode
    if (process.env.NETLIFY) {
      return []
    }
    return [
      {
        source: '/api/:path*',
        destination: '/.netlify/functions/:path*',
      },
    ]
  },
  
  // Netlify build optimizations
  ...(process.env.NETLIFY && {
    distDir: '.next',
    generateEtags: false,
    // Disable image optimization for static export
    images: {
      unoptimized: true,
    },
  }),
}

// Bundle analyzer for performance monitoring
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)