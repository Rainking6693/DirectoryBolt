/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration to avoid hanging issues
  reactStrictMode: true,
  swcMinify: true,
  
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

    return config
  },
}

module.exports = nextConfig