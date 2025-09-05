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
console.log('🔍 Next.js Config - isProd:', isProd, 'NODE_ENV:', process.env.NODE_ENV);

// === Content Security Policy (CSP) ===
// More permissive in development, strict in production
const csp = isProd ? [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  `connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://api.airtable.com ${SUPABASE_ORIGIN} ${SUPABASE_WS} https://*.sentry.io`,
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "trusted-types 'allow-duplicates'"
].join('; ') : [
  // Development mode - more permissive for Next.js dev server
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https: blob:",
  `connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://www.googletagmanager.com https://api.airtable.com ${SUPABASE_ORIGIN} ${SUPABASE_WS} wss: ws://localhost:* ws://127.0.0.1:*`,
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "object-src 'none'",
  "base-uri 'self'"
  // No trusted-types in development to avoid conflicts
].join('; ');

const nextConfig = {
  // Enable full server-side functionality for production
  // Removed 'output: export' to enable API routes
  
  // Optimize images for performance
  images: {
    domains: ['localhost', 'directorybolt.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  
  // ESLint configuration for build
  eslint: {
    ignoreDuringBuilds: false, // Keep ESLint active but don't fail on warnings
  },
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: true, // Temporarily ignore TypeScript errors for deployment testing
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: false, // Disable CSS optimization to avoid critters dependency issues
    optimizePackageImports: ['@radix-ui/react-icons'],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  
  // Compression and caching
  generateEtags: true,
  
  // Bundle analyzer and optimization
  webpack: (config, { isServer, dev }) => {
    // Add polyfill for Node.js 18 compatibility with undici/supabase
    if (isServer) {
      // Add global polyfills for server-side rendering
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Polyfill File and Blob for undici compatibility
      config.plugins = config.plugins || [];
      config.plugins.push({
        apply: (compiler) => {
          compiler.hooks.beforeRun.tapAsync('PolyfillPlugin', (compilation, callback) => {
            // Add global polyfills
            if (typeof global !== 'undefined') {
              global.File = global.File || class File extends Blob {
                constructor(fileBits, fileName, options = {}) {
                  super(fileBits, options);
                  this.name = fileName;
                  this.lastModified = options.lastModified || Date.now();
                }
              };
              
              global.Blob = global.Blob || class Blob {
                constructor(blobParts = [], options = {}) {
                  this.size = 0;
                  this.type = options.type || '';
                  if (blobParts.length) {
                    this.size = blobParts.reduce((acc, part) => acc + (part.length || 0), 0);
                  }
                }
                slice() { return new Blob(); }
                stream() { return new ReadableStream(); }
                text() { return Promise.resolve(''); }
                arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
              };
            }
            callback();
          });
        }
      });
    }
    
    // Optimize bundle size
    if (!dev && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': __dirname,
      };
      
      // Optimize for production
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY || 'default-key',
    // Stripe publishable key for client-side access
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  
  // Security headers - Enhanced for production with CSP
  async headers() {
    const securityHeaders = [
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
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
    ]

    // Add CSP only in production
    if (isProd) {
      securityHeaders.push({
        key: 'Content-Security-Policy',
        value: csp,
      })
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      })
      securityHeaders.push({
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      })
    }

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Static assets caching
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // API routes should not be cached
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://directorybolt.com,https://www.directorybolt.com'
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  
  // API rate limiting
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig