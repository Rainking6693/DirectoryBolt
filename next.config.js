/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force rebuild with timestamp
  env: {
    BUILD_TIME: new Date().toISOString(),
    FORCE_REBUILD: 'true'
  },
  // Enhanced configuration for SEO and performance
  
  reactStrictMode: false,
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  
  // Skip validation for build stability
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Enhanced image optimization
  images: {
    domains: ['localhost', 'directorybolt.com', 'images.unsplash.com'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Enhanced experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Enhanced webpack configuration
  webpack: (config, { dev, isServer, webpack }) => {
    // Prevent build-time JSON parsing issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }
    // Production optimizations
    if (!dev) {
      // Bundle splitting for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\/]node_modules[\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      }
      
      // Tree shaking optimization
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }
    
    // Disable source maps in production for performance
    if (!dev) {
      config.devtool = false
    }
    
    // Ignore problematic files and prevent build-time JSON parsing
    config.watchOptions = {
      ignored: [
        '**/node_modules/**',
        '**/autobolt-extension/**',
        '**/sync-directorybolt-to-autobolt.js',
        '**/verify-sync.js',
        '**/build/**',
        '**/scripts/**',
        '**/data/guides/**' // Prevent watching guide files during build
      ]
    }
    
    // Add module rules to handle JSON files safely
    config.module.rules.push({
      test: /\.json$/,
      type: 'json',
      parser: {
        parse: (input) => {
          try {
            return JSON.parse(input)
          } catch (error) {
            console.warn('JSON parsing warning during build:', error.message)
            return {} // Return empty object instead of failing
          }
        }
      }
    })
    
    // Add ignore plugin for autobolt-extension
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/autobolt-extension/,
      })
    )
    
    // Client-side fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
        process: false,
      }
    }
    
    return config
  },
  
  // Enhanced security and performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "connect-src 'self' https://api.stripe.com https://js.stripe.com",
              "worker-src 'self' blob:",
              "manifest-src 'self'"
            ].join('; ')
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(self)'
          }
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      }
    ]
  },
  
  // Enhanced redirects for SEO
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/directory-submission',
        destination: '/pricing',
        permanent: true,
      },
    ]
  },
  
  // Enhanced rewrites for clean URLs
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap'
      },
      {
        source: '/robots.txt',
        destination: '/api/robots'
      }
    ]
  },
}

module.exports = nextConfig
